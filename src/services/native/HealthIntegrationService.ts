// Minimal, safe wrapper around native health integrations.
// Tries Apple HealthKit (iOS) and Health Connect (Android) when available.
// Falls back to returning null so callers can use Motion/Pedometer.

import { Capacitor } from '@capacitor/core';

export interface HealthIntegrationAPI {
  isAvailable(): Promise<boolean>;
  requestPermissions(): Promise<boolean>;
  getTodaySteps(): Promise<number | null>;
}

export const HealthIntegrationService: HealthIntegrationAPI = {
  async isAvailable() {
    if (!Capacitor.isNativePlatform()) return false;
    try {
      // Lazy import to avoid bundling errors on web
      const kit = await import(/* @vite-ignore */ '@capawesome-team/capacitor-health-kit').catch(() => null);
      const connect = await import(/* @vite-ignore */ '@capawesome-team/capacitor-health-connect').catch(() => null);
      return Boolean(kit || connect);
    } catch {
      return false;
    }
  },

  async requestPermissions() {
    if (!Capacitor.isNativePlatform()) return false;
    try {
      const kit = await import(/* @vite-ignore */ '@capawesome-team/capacitor-health-kit').catch(() => null as any);
      if (kit?.HealthKit) {
        try {
          // Request read permission for steps
          await kit.HealthKit.requestAuthorization({
            read: ['steps'] as any,
          } as any);
          return true;
        } catch {}
      }
      const connect = await import(/* @vite-ignore */ '@capawesome-team/capacitor-health-connect').catch(() => null as any);
      if (connect?.HealthConnect) {
        try {
          await connect.HealthConnect.requestPermissions({
            read: [{ dataType: 'steps' }],
          } as any);
          return true;
        } catch {}
      }
      return false;
    } catch {
      return false;
    }
  },

  async getTodaySteps() {
    if (!Capacitor.isNativePlatform()) return null;
    try {
      const kit = await import(/* @vite-ignore */ '@capawesome-team/capacitor-health-kit').catch(() => null as any);
      if (kit?.HealthKit) {
        try {
          const end = new Date();
          const start = new Date();
          start.setHours(0, 0, 0, 0);
          // API shape may differ by version; guard everything
          const res = await kit.HealthKit.queryQuantitySum!?.({
            unit: 'count',
            sampleType: 'steps',
            startDate: start.toISOString(),
            endDate: end.toISOString(),
          } as any);
          const value = (res as any)?.value ?? null;
          return typeof value === 'number' ? value : null;
        } catch {}
      }
      const connect = await import(/* @vite-ignore */ '@capawesome-team/capacitor-health-connect').catch(() => null as any);
      if (connect?.HealthConnect) {
        try {
          const end = new Date();
          const start = new Date();
          start.setHours(0, 0, 0, 0);
          const res = await connect.HealthConnect.readRecords({
            recordType: 'Steps',
            timeRangeFilter: { startTime: start.toISOString(), endTime: end.toISOString() },
          } as any);
          const total = ((res as any)?.records || []).reduce((sum: number, r: any) => sum + (r.count || r.value || 0), 0);
          return Number.isFinite(total) ? total : null;
        } catch {}
      }
      return null;
    } catch {
      return null;
    }
  },
};
