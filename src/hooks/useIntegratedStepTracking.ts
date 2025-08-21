import { useState, useEffect, useCallback } from 'react';
import { useStepTracking } from './useStepTracking';
import { useHealthData } from './useHealthData';

export const useIntegratedStepTracking = () => {
  const stepTracking = useStepTracking();
  const healthData = useHealthData();
  const [historicalSteps, setHistoricalSteps] = useState<{ date: string; steps: number }[]>([]);

  // Get combined step data (real-time + historical)
  const getCombinedStepData = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    const lastWeek = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      if (dateStr === today) {
        // Use real-time data for today
        lastWeek.push({
          date: dateStr,
          steps: stepTracking.todaySteps
        });
      } else {
        // Use historical data from database
        const historicalEntry = healthData.healthData.find(entry => entry.date === dateStr);
        lastWeek.push({
          date: dateStr,
          steps: historicalEntry?.steps || 0
        });
      }
    }
    
    return lastWeek;
  }, [stepTracking.todaySteps, healthData.healthData]);

  // Get weekly step totals
  const getWeeklyStepTotal = useCallback(() => {
    const weeklyData = getCombinedStepData();
    return weeklyData.reduce((total, day) => total + day.steps, 0);
  }, [getCombinedStepData]);

  // Get daily average for the week
  const getDailyStepAverage = useCallback(() => {
    const weeklyData = getCombinedStepData();
    const activeDays = weeklyData.filter(day => day.steps > 0).length;
    if (activeDays === 0) return 0;
    
    const total = weeklyData.reduce((sum, day) => sum + day.steps, 0);
    return Math.round(total / activeDays);
  }, [getCombinedStepData]);

  // Sync step data to health database
  const syncToHealthData = useCallback(async () => {
    if (stepTracking.todaySteps > 0) {
      try {
        await healthData.updateHealthData({
          steps: stepTracking.todaySteps,
          distance_km: Math.round((stepTracking.todaySteps * 0.0008) * 100) / 100,
          calories_burned: Math.round(stepTracking.todaySteps * 0.04),
          active_minutes: Math.min(Math.round(stepTracking.todaySteps / 100), 60)
        });
      } catch (error) {
        console.error('Failed to sync step data to health database:', error);
      }
    }
  }, [stepTracking.todaySteps, healthData.updateHealthData]);

  // Update historical step data when health data changes
  useEffect(() => {
    const stepHistory = healthData.healthData.map(entry => ({
      date: entry.date,
      steps: entry.steps || 0
    })).slice(0, 30); // Last 30 days
    
    setHistoricalSteps(stepHistory);
  }, [healthData.healthData]);

  // Auto-sync to health data periodically
  useEffect(() => {
    if (!stepTracking.isTracking) return;

    const interval = setInterval(() => {
      syncToHealthData();
    }, 10 * 60 * 1000); // Every 10 minutes

    return () => clearInterval(interval);
  }, [stepTracking.isTracking, syncToHealthData]);

  return {
    // Real-time step tracking
    isTracking: stepTracking.isTracking,
    hasPermission: stepTracking.hasPermission,
    todaySteps: stepTracking.todaySteps,
    currentSteps: stepTracking.currentSteps,
    syncing: stepTracking.syncing || healthData.loading,
    lastSyncTime: stepTracking.lastSyncTime,
    
    // Historical data
    historicalSteps,
    weeklyStepData: getCombinedStepData(),
    weeklyStepTotal: getWeeklyStepTotal(),
    dailyStepAverage: getDailyStepAverage(),
    
    // Combined health data
    todayHealthData: healthData.todayData,
    healthHistory: healthData.healthData,
    weeklySummary: healthData.getWeeklySummary(),
    
    // Actions
    startTracking: stepTracking.startTracking,
    stopTracking: stepTracking.stopTracking,
    requestPermissions: stepTracking.requestPermissions,
    syncSteps: stepTracking.syncSteps,
    syncToHealthData,
    updateStepData: stepTracking.updateStepData,
    
    // Health data actions
    updateHealthData: healthData.updateHealthData,
    fetchHealthData: healthData.fetchHealthData
  };
};