import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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
    lastUpdated: new Date()
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
      checkHealthKitConnection();
    }
  }, [user]);

  const checkHealthKitConnection = useCallback(async () => {
    try {
      setLoading(true);
      // Check if device supports health data
      if ('permissions' in navigator && 'query' in navigator.permissions) {
        try {
          const permission = await navigator.permissions.query({ name: 'accelerometer' as any });
          setIsConnected(permission.state === 'granted');
        } catch {
          setIsConnected(false);
        }
      }
      
      // Try to access step counter API if available
      if ('sensors' in navigator) {
        try {
          const sensor = new (window as any).Accelerometer({ frequency: 60 });
          sensor.addEventListener('reading', () => {
            updateStepsFromSensor();
          });
          sensor.start();
          setIsConnected(true);
        } catch (error) {
          setIsConnected(false);
        }
      }
    } catch (error) {
      console.log('Health tracking not available on this device');
      setIsConnected(false);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateHealthData = useCallback((newData: Partial<HealthData>) => {
    setHealthData(prev => ({
      ...prev,
      ...newData,
      lastUpdated: new Date()
    }));
  }, []);

  const updateStepsFromSensor = useCallback(() => {
    // Simulate step counting - in a real app this would come from device sensors
    const mockSteps = Math.floor(Math.random() * 1000) + 5000;
    updateHealthData({
      steps: mockSteps,
      calories: Math.floor(mockSteps * 0.04),
      distance: mockSteps * 0.0008, // km
      activeMinutes: Math.floor(mockSteps / 100),
    });
  }, [updateHealthData]);

  const syncChallengeProgress = async (challengeId: string, progressData: any) => {
    try {
      const { error } = await supabase
        .from('challenge_participations')
        .update({
          progress_data: {
            ...progressData,
            steps: healthData.steps,
            lastSync: new Date().toISOString()
          }
        })
        .eq('challenge_id', challengeId)
        .eq('user_id', user!.id);

      if (error) throw error;

      toast({
        title: "Progress Synced",
        description: "Your health data has been synced with challenges!"
      });
    } catch (error) {
      console.error('Error syncing challenge progress:', error);
    }
  };

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

  // Simulate daily data updates
  useEffect(() => {
    const interval = setInterval(() => {
      if (isConnected) {
        updateStepsFromSensor();
      }
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [isConnected, updateStepsFromSensor]);

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
    updateStepsFromSensor
  };
};