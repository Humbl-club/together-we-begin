import { Capacitor } from '@capacitor/core';

export interface HealthDataSource {
  type: 'motion' | 'health_app';
  name: string;
  available: boolean;
  connected: boolean;
  todaySteps: number | null;
  lastSync: Date | null;
}

export interface ReliableHealthAPI {
  getAvailableDataSources(): Promise<HealthDataSource[]>;
  getTodaySteps(source?: 'motion' | 'health_app' | 'merged'): Promise<number | null>;
  syncFromHealthApp(): Promise<boolean>;
  isHealthAppAvailable(): Promise<boolean>;
  requestHealthAppPermissions(): Promise<boolean>;
}

export const ReliableHealthService: ReliableHealthAPI = {
  async getAvailableDataSources() {
    const sources: HealthDataSource[] = [];
    
    // Motion-based tracking (always available on mobile)
    sources.push({
      type: 'motion',
      name: 'Motion Sensor',
      available: Capacitor.isNativePlatform(),
      connected: true, // Assume connected if available
      todaySteps: 0, // Will be updated by PedometerService
      lastSync: new Date()
    });

    // Health app integration (optional)
    const healthAppAvailable = await this.isHealthAppAvailable();
    sources.push({
      type: 'health_app',
      name: Capacitor.getPlatform() === 'ios' ? 'Apple Health' : 'Google Fit',
      available: healthAppAvailable,
      connected: false, // Will be updated when user connects
      todaySteps: null,
      lastSync: null
    });

    return sources;
  },

  async getTodaySteps(source = 'motion') {
    try {
      if (source === 'motion' || source === 'merged') {
        // Return steps from PedometerService (imported later to avoid circular deps)
        return 0; // Will be overridden by calling components
      }

      if (source === 'health_app') {
        // Future: Implement reliable health app integration
        return null;
      }

      return null;
    } catch (error) {
      console.error('Error getting today steps:', error);
      return null;
    }
  },

  async syncFromHealthApp() {
    try {
      // Future: Implement reliable health app sync
      // For now, return false to indicate health app sync is not available
      return false;
    } catch (error) {
      console.error('Error syncing from health app:', error);
      return false;
    }
  },

  async isHealthAppAvailable() {
    try {
      if (!Capacitor.isNativePlatform()) return false;
      
      // Future: Check for reliable health app plugins
      // For now, return false to disable unreliable integrations
      return false;
    } catch (error) {
      console.error('Error checking health app availability:', error);
      return false;
    }
  },

  async requestHealthAppPermissions() {
    try {
      // Future: Implement reliable health app permissions
      return false;
    } catch (error) {
      console.error('Error requesting health app permissions:', error);
      return false;
    }
  }
};