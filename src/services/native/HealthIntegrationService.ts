import { Capacitor } from '@capacitor/core';

export interface HealthIntegrationAPI {
  isAvailable(): Promise<boolean>;
  requestPermissions(): Promise<boolean>;
  getTodaySteps(): Promise<number | null>;
}

export const HealthIntegrationService: HealthIntegrationAPI = {
  async isAvailable() {
    try {
      if (!Capacitor.isNativePlatform()) return false;
      if (Capacitor.getPlatform() === 'android') {
        // Dynamically import Health Connect on Android only
        const mod = await import(/* @vite-ignore */ '@pianissimoproject/capacitor-health-connect').catch(() => null as any);
        return Boolean(mod?.HealthConnect);
      }
      // iOS HealthKit: to be added once a plugin is selected
      return false;
    } catch {
      return false;
    }
  },

  async requestPermissions() {
    try {
      if (!Capacitor.isNativePlatform()) return false;
      if (Capacitor.getPlatform() === 'android') {
        const mod = await import(/* @vite-ignore */ '@pianissimoproject/capacitor-health-connect').catch(() => null as any);
        if (mod?.HealthConnect) {
          // Request read permissions for steps
          await mod.HealthConnect.requestPermissions({
            read: [{ dataType: 'Steps' }],
          } as any);
          return true;
        }
      }
      return false;
    } catch {
      return false;
    }
  },

  async getTodaySteps() {
    try {
      if (!Capacitor.isNativePlatform()) return null;
      if (Capacitor.getPlatform() === 'android') {
        const mod = await import(/* @vite-ignore */ '@pianissimoproject/capacitor-health-connect').catch(() => null as any);
        if (mod?.HealthConnect) {
          const end = new Date();
          const start = new Date();
          start.setHours(0, 0, 0, 0);
          const res = await mod.HealthConnect.readRecords({
            recordType: 'Steps',
            timeRangeFilter: { startTime: start.toISOString(), endTime: end.toISOString() },
          } as any);
          const total = ((res as any)?.records || []).reduce((sum: number, r: any) => sum + (r.count || r.value || 0), 0);
          return Number.isFinite(total) ? total : null;
        }
      }
      return null;
    } catch {
      return null;
    }
  },
};
