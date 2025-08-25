import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/hooks/use-toast';

export interface HealthData {
  id: string;
  user_id: string;
  date: string;
  steps: number;
  distance_km: number;
  calories_burned: number;
  active_minutes: number;
  sleep_hours: number;
  water_glasses: number;
  weight_kg?: number;
  heart_rate_avg?: number;
  mood_score?: number;
  energy_level?: number;
  stress_level?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface HealthDataInput {
  date?: string;
  steps?: number;
  distance_km?: number;
  calories_burned?: number;
  active_minutes?: number;
  sleep_hours?: number;
  water_glasses?: number;
  weight_kg?: number;
  heart_rate_avg?: number;
  mood_score?: number;
  energy_level?: number;
  stress_level?: number;
  notes?: string;
}

export const useHealthData = () => {
  const [healthData, setHealthData] = useState<HealthData[]>([]);
  const [todayData, setTodayData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch health data for a date range
  const fetchHealthData = useCallback(async (startDate?: string, endDate?: string) => {
    if (!user) return;

    try {
      setLoading(true);
      let query = supabase
        .from('health_data')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (startDate) {
        query = query.gte('date', startDate);
      }
      if (endDate) {
        query = query.lte('date', endDate);
      }

      const { data, error } = await query;

      if (error) throw error;
      setHealthData(data || []);

      // Set today's data
      const today = new Date().toISOString().split('T')[0];
      const todayEntry = data?.find(entry => entry.date === today);
      setTodayData(todayEntry || null);
    } catch (error) {
      console.error('Error fetching health data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load health data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  // Add or update health data for a specific date
  const updateHealthData = useCallback(async (input: HealthDataInput) => {
    if (!user) return;

    try {
      const date = input.date || new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('health_data')
        .upsert({
          user_id: user.id,
          date,
          ...input
        }, {
          onConflict: 'user_id,date'
        })
        .select()
        .single();

      if (error) throw error;

      // Update local state
      setHealthData(prev => {
        const filtered = prev.filter(entry => entry.date !== date);
        return [data, ...filtered].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      });

      // Update today's data if it's today
      const today = new Date().toISOString().split('T')[0];
      if (date === today) {
        setTodayData(data);
      }

      toast({
        title: 'Success',
        description: 'Health data updated successfully'
      });

      return data;
    } catch (error) {
      console.error('Error updating health data:', error);
      toast({
        title: 'Error',
        description: 'Failed to update health data',
        variant: 'destructive'
      });
      throw error;
    }
  }, [user, toast]);

  // Get weekly summary
  const getWeeklySummary = useCallback(() => {
    const lastWeek = healthData.slice(0, 7);
    if (lastWeek.length === 0) return null;

    const summary = {
      totalSteps: lastWeek.reduce((sum, day) => sum + (day.steps || 0), 0),
      avgSteps: Math.round(lastWeek.reduce((sum, day) => sum + (day.steps || 0), 0) / lastWeek.length),
      totalDistance: lastWeek.reduce((sum, day) => sum + (day.distance_km || 0), 0),
      totalCalories: lastWeek.reduce((sum, day) => sum + (day.calories_burned || 0), 0),
      avgSleep: lastWeek.reduce((sum, day) => sum + (day.sleep_hours || 0), 0) / lastWeek.length,
      avgMood: lastWeek.filter(day => day.mood_score).reduce((sum, day) => sum + (day.mood_score || 0), 0) / lastWeek.filter(day => day.mood_score).length || 0,
      daysActive: lastWeek.filter(day => (day.steps || 0) > 0).length
    };

    return summary;
  }, [healthData]);

  // Initialize data on mount
  useEffect(() => {
    if (user) {
      fetchHealthData();
    }
  }, [user, fetchHealthData]);

  return {
    healthData,
    todayData,
    loading,
    fetchHealthData,
    updateHealthData,
    getWeeklySummary
  };
};