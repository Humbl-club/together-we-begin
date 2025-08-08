// Safe no-op health integration layer for web/staging builds.
// When native HealthKit/Health Connect plugins are installed, we can extend this.

export interface HealthIntegrationAPI {
  isAvailable(): Promise<boolean>;
  requestPermissions(): Promise<boolean>;
  getTodaySteps(): Promise<number | null>;
}

export const HealthIntegrationService: HealthIntegrationAPI = {
  async isAvailable() {
    // On web/staging builds, return false to avoid bundler resolving native modules
    return false;
  },
  async requestPermissions() {
    return false;
  },
  async getTodaySteps() {
    return null;
  }
};
