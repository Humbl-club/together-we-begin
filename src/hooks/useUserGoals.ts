import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/hooks/use-toast';

export interface UserGoal {
  id: string;
  user_id: string;
  goal_type: string;
  target_value: number;
  current_value: number;
  unit: string;
  period: 'daily' | 'weekly' | 'monthly';
  is_active: boolean;
  start_date: string;
  end_date?: string;
  created_at: string;
  updated_at: string;
}

export interface GoalInput {
  goal_type: string;
  target_value: number;
  unit: string;
  period?: 'daily' | 'weekly' | 'monthly';
  start_date?: string;
  end_date?: string;
}

export const useUserGoals = () => {
  const [goals, setGoals] = useState<UserGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch user goals
  const fetchGoals = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_goals')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGoals((data || []) as UserGoal[]);
    } catch (error) {
      console.error('Error fetching goals:', error);
      toast({
        title: 'Error',
        description: 'Failed to load goals',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  // Create a new goal
  const createGoal = useCallback(async (input: GoalInput) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_goals')
        .insert({
          user_id: user.id,
          goal_type: input.goal_type,
          target_value: input.target_value,
          unit: input.unit,
          period: input.period || 'daily',
          start_date: input.start_date || new Date().toISOString().split('T')[0],
          end_date: input.end_date
        })
        .select()
        .single();

      if (error) throw error;

      setGoals(prev => [data as UserGoal, ...prev]);
      
      toast({
        title: 'Success',
        description: 'Goal created successfully'
      });

      return data;
    } catch (error) {
      console.error('Error creating goal:', error);
      toast({
        title: 'Error',
        description: 'Failed to create goal',
        variant: 'destructive'
      });
      throw error;
    }
  }, [user, toast]);

  // Update goal progress
  const updateGoalProgress = useCallback(async (goalId: string, currentValue: number) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_goals')
        .update({ current_value: currentValue })
        .eq('id', goalId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      setGoals(prev => prev.map(goal => 
        goal.id === goalId ? { ...goal, current_value: currentValue } : goal
      ));

      return data;
    } catch (error) {
      console.error('Error updating goal progress:', error);
      throw error;
    }
  }, [user]);

  // Deactivate a goal
  const deactivateGoal = useCallback(async (goalId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_goals')
        .update({ is_active: false })
        .eq('id', goalId)
        .eq('user_id', user.id);

      if (error) throw error;

      setGoals(prev => prev.filter(goal => goal.id !== goalId));
      
      toast({
        title: 'Success',
        description: 'Goal deactivated'
      });
    } catch (error) {
      console.error('Error deactivating goal:', error);
      toast({
        title: 'Error',
        description: 'Failed to deactivate goal',
        variant: 'destructive'
      });
    }
  }, [user, toast]);

  // Get goals by type
  const getGoalsByType = useCallback((goalType: string) => {
    return goals.filter(goal => goal.goal_type === goalType);
  }, [goals]);

  // Calculate completion percentage
  const getCompletionPercentage = useCallback((goal: UserGoal) => {
    return Math.min(100, Math.round((goal.current_value / goal.target_value) * 100));
  }, []);

  // Check if goal is completed
  const isGoalCompleted = useCallback((goal: UserGoal) => {
    return goal.current_value >= goal.target_value;
  }, []);

  // Initialize data on mount
  useEffect(() => {
    if (user) {
      fetchGoals();
    }
  }, [user, fetchGoals]);

  return {
    goals,
    loading,
    fetchGoals,
    createGoal,
    updateGoalProgress,
    deactivateGoal,
    getGoalsByType,
    getCompletionPercentage,
    isGoalCompleted
  };
};