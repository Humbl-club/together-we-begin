import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface HealthData {
  steps: number;
  calories: number;
  distance: number;
  activeMinutes: number;
  lastUpdated: Date;
}

interface HealthGoals {
  dailySteps: number;
  weeklyExercise: number;
  monthlyDistance: number;
}

export const useHealthTracking = () => {
  const [healthData, setHealthData] = useState<HealthData>({
    steps: 0,
    calories: 0,
    distance: 0,
    activeMinutes: 0,
    lastUpdated: new Date()
  });
  
  const [healthGoals, setHealthGoals] = useState<HealthGoals>({
    dailySteps: 10000,
    weeklyExercise: 150,
    monthlyDistance: 50
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

  const checkHealthKitConnection = async () => {
    try {
      // Check if device supports health data
      if ('permissions' in navigator && 'query' in navigator.permissions) {
        const permission = await navigator.permissions.query({ name: 'sensors' as any });
        setIsConnected(permission.state === 'granted');
      }
      
      // Try to access step counter API if available
      if ('sensors' in navigator) {
        try {
          const sensor = new (window as any).Accelerometer({ frequency: 60 });
          sensor.addEventListener('reading', () => {
            // Basic step counting simulation
            updateStepsFromSensor();
          });
          sensor.start();
          setIsConnected(true);
        } catch (error) {
          // Fallback to manual tracking or mock data
          setIsConnected(false);
        }
      }
    } catch (error) {
      console.log('Health tracking not available on this device');
      setIsConnected(false);
    } finally {
      setLoading(false);
    }
  };

  const updateStepsFromSensor = () => {
    // Simulate step counting - in a real app this would come from device sensors
    const mockSteps = Math.floor(Math.random() * 1000) + 5000;
    setHealthData(prev => ({
      ...prev,
      steps: mockSteps,
      calories: Math.floor(mockSteps * 0.04),
      distance: mockSteps * 0.0008, // km
      activeMinutes: Math.floor(mockSteps / 100),
      lastUpdated: new Date()
    }));
  };

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
  }, [isConnected]);

  return {
    healthData,
    healthGoals,
    isConnected,
    loading,
    updateGoals,
    syncChallengeProgress,
    getProgressPercentage,
    checkHealthKitConnection
  };
};