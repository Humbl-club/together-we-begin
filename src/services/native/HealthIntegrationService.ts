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
        const mod = await import(/* @vite-ignore */ '@pianissimoproject/capacitor-health-connect').catch(() => null as any);
        return Boolean(mod?.HealthConnect);
      }
      if (Capacitor.getPlatform() === 'ios') {
        const hk = await import(/* @vite-ignore */ '@perfood/capacitor-healthkit').catch(() => null as any);
        return Boolean(hk?.HealthKit);
      }
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
      if (Capacitor.getPlatform() === 'ios') {
        const hk = await import(/* @vite-ignore */ '@perfood/capacitor-healthkit').catch(() => null as any);
        if (hk?.HealthKit) {
          try {
            // Prefer requestPermissions if available
            if (typeof hk.HealthKit.requestPermissions === 'function') {
              const res = await hk.HealthKit.requestPermissions({
                read: ['steps'] as any,
              } as any);
              return !!res;
            }
            // Fallback: requestAuthorization
            if (typeof hk.HealthKit.requestAuthorization === 'function') {
              await hk.HealthKit.requestAuthorization({ read: ['steps'] } as any);
              return true;
            }
          } catch {}
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
      if (Capacitor.getPlatform() === 'ios') {
        const hk = await import(/* @vite-ignore */ '@perfood/capacitor-healthkit').catch(() => null as any);
        if (hk?.HealthKit) {
          const end = new Date();
          const start = new Date();
          start.setHours(0, 0, 0, 0);
          try {
            // Try common sum API names
            if (typeof hk.HealthKit.queryQuantitySum === 'function') {
              const res = await hk.HealthKit.queryQuantitySum({
                sampleType: 'steps',
                unit: 'count',
                startDate: start.toISOString(),
                endDate: end.toISOString(),
              } as any);
              const value = (res as any)?.value ?? null;
              return typeof value === 'number' ? value : null;
            }
            if (typeof hk.HealthKit.sumQuantitySamples === 'function') {
              const res = await hk.HealthKit.sumQuantitySamples({
                sampleType: 'steps',
                unit: 'count',
                startDate: start.toISOString(),
                endDate: end.toISOString(),
              } as any);
              const value = (res as any)?.value ?? null;
              return typeof value === 'number' ? value : null;
            }
          } catch {}
        }
      }
      return null;
    } catch {
      return null;
    }
  },
};
