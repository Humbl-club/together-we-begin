import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { pedometerService, StepData } from '@/services/PedometerService';
import { useToast } from '@/hooks/use-toast';

interface StepValidationResult {
  isValid: boolean;
  score: number;
  flags: string[];
}

interface StepSyncResult {
  success: boolean;
  synced_steps: number;
  validation_result: StepValidationResult;
}

export const useStepTracking = () => {
  const [isTracking, setIsTracking] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [currentSteps, setCurrentSteps] = useState(0);
  const [todaySteps, setTodaySteps] = useState(0);
  const [weeklySteps, setWeeklySteps] = useState<{ date: string; steps: number }[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  
  const { user } = useAuth();
  const { toast } = useToast();

  // Request device permissions
  const requestPermissions = useCallback(async () => {
    try {
      // The permissions are handled in capacitor.config.ts
      // This function will trigger the permission request when needed
      const success = await pedometerService.startTracking();
      if (success) {
        setHasPermission(true);
        setIsTracking(true);
        toast({
          title: "Step tracking enabled",
          description: "Your steps are now being tracked for challenges!"
        });
      } else {
        setHasPermission(false);
        toast({
          title: "Permission required",
          description: "Please enable motion permissions to track steps",
          variant: "destructive"
        });
      }
      return success;
    } catch (error) {
      console.error('Error requesting permissions:', error);
      setHasPermission(false);
      toast({
        title: "Permission error",
        description: "Failed to enable step tracking",
        variant: "destructive"
      });
      return false;
    }
  }, [toast]);

  // Start step tracking
  const startTracking = useCallback(async () => {
    if (hasPermission === null) {
      return await requestPermissions();
    }
    
    if (hasPermission === false) {
      toast({
        title: "Permission required",
        description: "Please enable motion permissions in your device settings",
        variant: "destructive"
      });
      return false;
    }

    try {
      const success = await pedometerService.startTracking();
      setIsTracking(success);
      return success;
    } catch (error) {
      console.error('Error starting step tracking:', error);
      toast({
        title: "Error",
        description: "Failed to start step tracking",
        variant: "destructive"
      });
      return false;
    }
  }, [hasPermission, requestPermissions, toast]);

  // Stop step tracking
  const stopTracking = useCallback(async () => {
    try {
      await pedometerService.stopTracking();
      setIsTracking(false);
    } catch (error) {
      console.error('Error stopping step tracking:', error);
    }
  }, []);

  // Sync steps with server and validate
  const syncSteps = useCallback(async (challengeId?: string): Promise<StepSyncResult | null> => {
    if (!user || syncing) return null;

    setSyncing(true);
    try {
      const todayStepCount = pedometerService.getTodaySteps();
      const dailyStepsData = pedometerService.getDailySteps();
      const today = new Date().toISOString().split('T')[0];
      
      // Validate steps
      const validation = pedometerService.validateSteps(todayStepCount);
      
      // Sync daily step data to health_data table
      if (validation.isValid && todayStepCount > 0) {
        const { error: healthDataError } = await supabase
          .from('health_data')
          .upsert({
            user_id: user.id,
            date: today,
            steps: todayStepCount,
            distance_km: Math.round((todayStepCount * 0.0008) * 100) / 100, // Rough estimate: 0.8m per step
            calories_burned: Math.round(todayStepCount * 0.04), // Rough estimate: 0.04 calories per step
            active_minutes: Math.min(Math.round(todayStepCount / 100), 60) // Rough estimate based on step count
          }, {
            onConflict: 'user_id,date'
          });

        if (healthDataError) {
          console.error('Error syncing to health_data:', healthDataError);
        }
      }

      // Sync historical daily data if available
      for (const [date, steps] of Object.entries(dailyStepsData)) {
        if (steps > 0 && date !== today) { // Don't duplicate today's data
          const dayValidation = pedometerService.validateSteps(steps);
          if (dayValidation.isValid) {
            await supabase
              .from('health_data')
              .upsert({
                user_id: user.id,
                date,
                steps,
                distance_km: Math.round((steps * 0.0008) * 100) / 100,
                calories_burned: Math.round(steps * 0.04),
                active_minutes: Math.min(Math.round(steps / 100), 60)
              }, {
                onConflict: 'user_id,date'
              });
          }
        }
      }
      
      // Log validation data
      const { error: validationError } = await supabase
        .from('step_validation_logs')
        .insert({
          user_id: user.id,
          challenge_id: challengeId || null,
          reported_steps: todayStepCount,
          validation_score: validation.score,
          anomaly_flags: validation.flags,
          device_info: {
            platform: navigator.platform,
            userAgent: navigator.userAgent.slice(0, 100),
            timestamp: new Date().toISOString()
          }
        });

      if (validationError) {
        console.error('Error logging validation:', validationError);
      }

      // Sync to walking leaderboards if challenge specified
      if (challengeId && validation.isValid) {
        const { error: syncError } = await supabase
          .from('walking_leaderboards')
          .upsert({
            challenge_id: challengeId,
            user_id: user.id,
            total_steps: todayStepCount,
            daily_steps: { [today]: todayStepCount },
            is_validated: validation.score > 0.7,
            flagged_for_review: validation.score < 0.5,
            last_updated: new Date().toISOString()
          });

        if (syncError) {
          throw syncError;
        }
      }

      setLastSyncTime(new Date());
      
      if (!validation.isValid) {
        toast({
          title: "Steps validation failed",
          description: "Your step count seems unusual and may need review",
          variant: "destructive"
        });
      }

      return {
        success: true,
        synced_steps: todayStepCount,
        validation_result: validation
      };

    } catch (error) {
      console.error('Error syncing steps:', error);
      toast({
        title: "Sync failed",
        description: "Failed to sync your steps. Please try again.",
        variant: "destructive"
      });
      return {
        success: false,
        synced_steps: 0,
        validation_result: { isValid: false, score: 0, flags: ['sync_error'] }
      };
    } finally {
      setSyncing(false);
    }
  }, [user, syncing, toast]);

  // Update local step data
  const updateStepData = useCallback(() => {
    setCurrentSteps(pedometerService.getCurrentSteps());
    setTodaySteps(pedometerService.getTodaySteps());
    setWeeklySteps(pedometerService.getWeeklySteps());
  }, []);

  // Set up step tracking callbacks
  useEffect(() => {
    const handleStepUpdate = (stepData: StepData) => {
      updateStepData();
    };

    pedometerService.addStepCallback(handleStepUpdate);
    updateStepData(); // Initial load

    return () => {
      pedometerService.removeStepCallback(handleStepUpdate);
    };
  }, [updateStepData]);

  // Auto-sync every 5 minutes when tracking
  useEffect(() => {
    if (!isTracking || !user) return;

    const interval = setInterval(() => {
      // Auto-sync without specific challenge (for health data and validation logging)
      syncSteps();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [isTracking, user, syncSteps]);

  // Daily sync at midnight to ensure daily data is captured
  useEffect(() => {
    if (!user) return;

    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 1, 0); // 1 second after midnight

    const timeUntilMidnight = tomorrow.getTime() - now.getTime();

    const timeout = setTimeout(() => {
      // Sync yesterday's final step count
      syncSteps();
      
      // Set up daily recurring sync
      const dailyInterval = setInterval(() => {
        syncSteps();
      }, 24 * 60 * 60 * 1000); // Every 24 hours

      return () => clearInterval(dailyInterval);
    }, timeUntilMidnight);

    return () => clearTimeout(timeout);
  }, [user, syncSteps]);

  // Check permission status on mount
  useEffect(() => {
    // Initialize step tracking state
    updateStepData();
  }, [updateStepData]);

  return {
    isTracking,
    hasPermission,
    currentSteps,
    todaySteps,
    weeklySteps,
    syncing,
    lastSyncTime,
    requestPermissions,
    startTracking,
    stopTracking,
    syncSteps,
    updateStepData
  };
};