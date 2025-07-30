import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { pedometerService, StepData, DailyStepData } from '@/services/PedometerService';

interface HealthData {
  steps: number;
  calories: number;
  distance: number;
  activeMinutes: number;
  heartRate?: number;
  workouts: number;
  waterGlasses: number;
  sleepHours: number;
  lastUpdated: Date;
  dailySteps: { [date: string]: number };
  weeklySteps: DailyStepData[];
}

interface HealthGoals {
  dailySteps: number;
  weeklyExercise: number;
  monthlyDistance: number;
  dailyWater: number;
  minSleep: number;
}

export const useHealthTracking = () => {
  const [healthData, setHealthData] = useState<HealthData>({
    steps: 0,
    calories: 0,
    distance: 0,
    activeMinutes: 0,
    heartRate: undefined,
    workouts: 0,
    waterGlasses: 0,
    sleepHours: 0,
    lastUpdated: new Date(),
    dailySteps: {},
    weeklySteps: []
  });
  
  const [healthGoals, setHealthGoals] = useState<HealthGoals>({
    dailySteps: 10000,
    weeklyExercise: 150,
    monthlyDistance: 50,
    dailyWater: 8,
    minSleep: 8
  });
  
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      initializePedometer();
    }
  }, [user]);

  const initializePedometer = useCallback(async () => {
    try {
      setLoading(true);
      
      // Start native pedometer tracking
      const trackingStarted = await pedometerService.startTracking();
      setIsConnected(trackingStarted);
      
      if (trackingStarted) {
        // Set up step callback
        pedometerService.addStepCallback(handleStepUpdate);
        
        // Load initial data
        updateHealthDataFromPedometer();
        
        toast({
          title: "Pedometer Connected",
          description: "Step tracking is now active!"
        });
      } else {
        // Only use mock tracking in development
        if (import.meta.env.DEV) {
          setIsConnected(true);
          startMockTracking();
        } else {
          setIsConnected(false);
          toast({
            title: "Health Tracking Unavailable",
            description: "Install the mobile app for step tracking",
            variant: "destructive"
          });
        }
      }
    } catch (error) {
      console.error('Error initializing pedometer:', error);
      setIsConnected(false);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleStepUpdate = useCallback((stepData: StepData) => {
    updateHealthDataFromPedometer();
    
    // Validate steps for anti-cheating
    const validation = pedometerService.validateSteps(stepData.steps);
    if (!validation.isValid) {
      console.warn('Suspicious step data detected:', validation.flags);
      logStepValidation(stepData, validation);
    }
  }, []);

  const updateHealthDataFromPedometer = useCallback(() => {
    const currentSteps = pedometerService.getCurrentSteps();
    const todaySteps = pedometerService.getTodaySteps();
    const dailySteps = pedometerService.getDailySteps();
    const weeklySteps = pedometerService.getWeeklySteps();
    
    setHealthData(prev => ({
      ...prev,
      steps: todaySteps,
      calories: Math.floor(todaySteps * 0.04),
      distance: todaySteps * 0.0008, // km
      activeMinutes: Math.floor(todaySteps / 100),
      lastUpdated: new Date(),
      dailySteps,
      weeklySteps
    }));
  }, []);

  const startMockTracking = useCallback(() => {
    // Fallback mock tracking for development/web
    const interval = setInterval(() => {
      const mockSteps = Math.floor(Math.random() * 100) + pedometerService.getTodaySteps();
      setHealthData(prev => ({
        ...prev,
        steps: mockSteps,
        calories: Math.floor(mockSteps * 0.04),
        distance: mockSteps * 0.0008,
        activeMinutes: Math.floor(mockSteps / 100),
        lastUpdated: new Date()
      }));
    }, 5000); // Update every 5 seconds for demo

    return () => clearInterval(interval);
  }, []);

  const logStepValidation = async (stepData: StepData, validation: any) => {
    if (!user) return;
    
    try {
      await supabase.from('step_validation_logs').insert({
        user_id: user.id,
        challenge_id: null, // Will be set when syncing with specific challenges
        reported_steps: stepData.steps,
        validation_score: validation.score,
        anomaly_flags: validation.flags,
        device_info: {
          deviceId: stepData.deviceId,
          timestamp: stepData.timestamp,
          accelerationData: stepData.accelerationData
        }
      });
    } catch (error) {
      console.error('Error logging step validation:', error);
    }
  };

  const syncChallengeProgress = async (challengeId: string, progressData?: any) => {
    if (!user) return;
    
    try {
      const todaySteps = pedometerService.getTodaySteps();
      const weeklySteps = pedometerService.getWeeklySteps();
      
      // Update or insert walking leaderboard entry
      const { error: leaderboardError } = await supabase
        .from('walking_leaderboards')
        .upsert({
          challenge_id: challengeId,
          user_id: user.id,
          total_steps: todaySteps,
          daily_steps: Object.fromEntries(
            weeklySteps.map(day => [day.date, day.steps])
          ),
          last_updated: new Date().toISOString()
        });

      if (leaderboardError) throw leaderboardError;

      // Update challenge participation
      const { error: participationError } = await supabase
        .from('challenge_participations')
        .update({
          progress_data: {
            ...progressData,
            steps: todaySteps,
            weeklySteps,
            lastSync: new Date().toISOString()
          }
        })
        .eq('challenge_id', challengeId)
        .eq('user_id', user.id);

      if (participationError) throw participationError;

      toast({
        title: "Steps Synced",
        description: `${todaySteps} steps synced to challenge!`
      });
    } catch (error) {
      console.error('Error syncing challenge progress:', error);
      toast({
        title: "Sync Failed",
        description: "Could not sync steps to challenge.",
        variant: "destructive"
      });
    }
  };

  const updateHealthData = useCallback((newData: Partial<HealthData>) => {
    setHealthData(prev => ({
      ...prev,
      ...newData,
      lastUpdated: new Date()
    }));
  }, []);

  const updateGoals = (newGoals: Partial<HealthGoals>) => {
    setHealthGoals(prev => ({ ...prev, ...newGoals }));
  };

  const getProgressPercentage = (type: keyof HealthGoals) => {
    switch (type) {
      case 'dailySteps':
        return Math.min((healthData.steps / healthGoals.dailySteps) * 100, 100);
      case 'weeklyExercise':
        return Math.min((healthData.activeMinutes / healthGoals.weeklyExercise) * 100, 100);
      case 'monthlyDistance':
        return Math.min((healthData.distance / healthGoals.monthlyDistance) * 100, 100);
      case 'dailyWater':
        return Math.min((healthData.waterGlasses / healthGoals.dailyWater) * 100, 100);
      case 'minSleep':
        return Math.min((healthData.sleepHours / healthGoals.minSleep) * 100, 100);
      default:
        return 0;
    }
  };

  const resetDailySteps = async () => {
    await pedometerService.resetDailySteps();
    updateHealthDataFromPedometer();
  };

  const checkHealthKitConnection = useCallback(async () => {
    await initializePedometer();
  }, [initializePedometer]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      pedometerService.removeStepCallback(handleStepUpdate);
    };
  }, [handleStepUpdate]);

  return {
    healthData,
    healthGoals,
    isConnected,
    loading,
    updateGoals,
    updateHealthData,
    syncChallengeProgress,
    getProgressPercentage,
    checkHealthKitConnection,
    resetDailySteps,
    updateStepsFromSensor: updateHealthDataFromPedometer
  };
};