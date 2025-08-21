import { Motion } from '@capacitor/motion';
import { Capacitor } from '@capacitor/core';
import localforage from 'localforage';

export interface StepData {
  steps: number;
  timestamp: number;
  deviceId: string;
  accelerationData?: {
    x: number;
    y: number;
    z: number;
  };
}

export interface DailyStepData {
  date: string;
  steps: number;
  lastUpdated: number;
}

class PedometerService {
  private static instance: PedometerService;
  private isTracking = false;
  private currentSteps = 0;
  private dailySteps: { [date: string]: number } = {};
  private lastAcceleration = { x: 0, y: 0, z: 0 };
  private stepThreshold = 1.2; // Acceleration threshold for step detection
  private stepCooldown = 200; // Minimum time between steps in ms
  private lastStepTime = 0;
  private stepBuffer: number[] = [];
  private callbacks: ((stepData: StepData) => void)[] = [];
  
  // Enhanced validation and calibration
  private calibrationFactor = 1.0;
  private userWalkingPattern: number[] = [];
  private backgroundSync = false;
  private maxDailySteps = 50000;
  private rapidIncreaseThreshold = 1000; // steps per minute

  public static getInstance(): PedometerService {
    if (!PedometerService.instance) {
      PedometerService.instance = new PedometerService();
    }
    return PedometerService.instance;
  }

  private constructor() {
    this.loadStoredData();
  }

  private async loadStoredData(): Promise<void> {
    try {
      const storedSteps = await localforage.getItem<{ [date: string]: number }>('daily_steps');
      const currentStepsData = await localforage.getItem<number>('current_steps');
      
      if (storedSteps) {
        this.dailySteps = storedSteps;
      }
      
      if (currentStepsData) {
        this.currentSteps = currentStepsData;
      }
    } catch (error) {
      console.error('Error loading stored step data:', error);
    }
  }

  private async saveStepData(): Promise<void> {
    try {
      await localforage.setItem('daily_steps', this.dailySteps);
      await localforage.setItem('current_steps', this.currentSteps);
    } catch (error) {
      console.error('Error saving step data:', error);
    }
  }

  private getTodayKey(): string {
    return new Date().toISOString().split('T')[0];
  }

  private calculateMagnitude(x: number, y: number, z: number): number {
    return Math.sqrt(x * x + y * y + z * z);
  }

  private detectStep(acceleration: { x: number; y: number; z: number }): boolean {
    const currentMagnitude = this.calculateMagnitude(
      acceleration.x,
      acceleration.y,
      acceleration.z
    );
    
    const lastMagnitude = this.calculateMagnitude(
      this.lastAcceleration.x,
      this.lastAcceleration.y,
      this.lastAcceleration.z
    );

    // Enhanced peak detection with pattern learning
    const deltaAcceleration = Math.abs(currentMagnitude - lastMagnitude);
    const now = Date.now();

    // Anti-shake detection: require consistent movement pattern
    this.stepBuffer.push(deltaAcceleration);
    if (this.stepBuffer.length > 10) {
      this.stepBuffer.shift();
    }

    // Calculate movement consistency
    const avgDelta = this.stepBuffer.reduce((a, b) => a + b, 0) / this.stepBuffer.length;
    const consistency = deltaAcceleration / (avgDelta || 1);
    
    // Adaptive threshold based on user's walking pattern
    const adaptiveThreshold = this.stepThreshold * this.calibrationFactor;
    
    // Enhanced step detection with anti-cheat measures
    if (
      deltaAcceleration > adaptiveThreshold &&
      now - this.lastStepTime > this.stepCooldown &&
      consistency > 0.5 && consistency < 3 && // Prevent shake/fake steps
      this.stepBuffer.length >= 3 // Require movement history
    ) {
      // Learn user's walking pattern
      this.userWalkingPattern.push(deltaAcceleration);
      if (this.userWalkingPattern.length > 100) {
        this.userWalkingPattern.shift();
        // Update calibration based on user pattern
        const avgPattern = this.userWalkingPattern.reduce((a, b) => a + b, 0) / this.userWalkingPattern.length;
        this.calibrationFactor = Math.max(0.5, Math.min(2.0, avgPattern / this.stepThreshold));
      }
      
      this.lastStepTime = now;
      this.lastAcceleration = acceleration;
      return true;
    }

    this.lastAcceleration = acceleration;
    return false;
  }

  private incrementSteps(): void {
    this.currentSteps++;
    const today = this.getTodayKey();
    
    if (!this.dailySteps[today]) {
      this.dailySteps[today] = 0;
    }
    
    this.dailySteps[today]++;
    
    const stepData: StepData = {
      steps: this.currentSteps,
      timestamp: Date.now(),
      deviceId: this.getDeviceId(),
      accelerationData: this.lastAcceleration
    };

    // Save to local storage
    this.saveStepData();

    // Notify callbacks
    this.callbacks.forEach(callback => callback(stepData));
  }

  private getDeviceId(): string {
    // Generate a unique device ID based on platform
    const platform = Capacitor.getPlatform();
    const userAgent = navigator.userAgent;
    const timestamp = Date.now();
    
    return `${platform}_${btoa(userAgent).slice(0, 10)}_${timestamp}`;
  }

  public async startTracking(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) {
      console.warn('Motion tracking only available on native platforms');
      // Only start mock tracking in development
      if (import.meta.env?.DEV) {
        this.startMockTracking();
        return true;
      }
      return false;
    }

    try {
      // Check if motion is available
      console.log('Starting motion tracking...');

      // Start motion tracking with error handling
      await Motion.addListener('accel', (event) => {
        try {
          const acceleration = {
            x: event.accelerationIncludingGravity.x,
            y: event.accelerationIncludingGravity.y,
            z: event.accelerationIncludingGravity.z
          };
          
          if (this.isTracking && this.detectStep(acceleration)) {
            this.incrementSteps();
          }
        } catch (error) {
          console.error('Error processing acceleration data:', error);
        }
      });

      this.isTracking = true;
      console.log('Pedometer tracking started successfully');
      return true;
    } catch (error) {
      console.error('Error starting pedometer tracking:', error);
      // Only fallback to mock in development
      if (import.meta.env?.DEV) {
        this.startMockTracking();
        return true;
      }
      return false;
    }
  }

  private startMockTracking(): void {
    // Mock step tracking for development
    const interval = setInterval(() => {
      if (this.isTracking) {
        // Simulate realistic step patterns
        const randomSteps = Math.random() < 0.3 ? 1 : 0; // 30% chance of step per interval
        if (randomSteps > 0) {
          this.incrementSteps();
        }
      }
    }, 2000); // Check every 2 seconds

    // Store interval for cleanup
    (this as any).mockInterval = interval;
  }

  public async stopTracking(): Promise<void> {
    this.isTracking = false;
    try {
      if (Capacitor.isNativePlatform()) {
        await Motion.removeAllListeners();
      } else {
        // Clear mock interval
        if ((this as any).mockInterval) {
          clearInterval((this as any).mockInterval);
          (this as any).mockInterval = null;
        }
      }
      console.log('Pedometer tracking stopped');
    } catch (error) {
      console.error('Error stopping pedometer tracking:', error);
    }
  }

  public getCurrentSteps(): number {
    return this.currentSteps;
  }

  public getTodaySteps(): number {
    const today = this.getTodayKey();
    return this.dailySteps[today] || 0;
  }

  public getDailySteps(): { [date: string]: number } {
    return { ...this.dailySteps };
  }

  public getWeeklySteps(): DailyStepData[] {
    const weeklyData: DailyStepData[] = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split('T')[0];
      
      weeklyData.push({
        date: dateKey,
        steps: this.dailySteps[dateKey] || 0,
        lastUpdated: Date.now()
      });
    }
    
    return weeklyData;
  }

  public validateSteps(steps: number): { isValid: boolean; score: number; flags: string[] } {
    const flags: string[] = [];
    let score = 1.0;
    const now = Date.now();

    // Maximum realistic steps per day
    if (steps > this.maxDailySteps) {
      flags.push('excessive_daily_steps');
      score -= 0.5;
    }

    // Completely unrealistic steps
    if (steps > 100000) {
      flags.push('unrealistic_steps');
      score = 0;
    }

    // Check for rapid step increases (potential cheating)
    const today = this.getTodayKey();
    const todaySteps = this.dailySteps[today] || 0;
    const stepIncrease = steps - todaySteps;
    const timeSinceLastStep = now - this.lastStepTime;
    
    // Detect unrealistic step rates (more than 1000 steps per minute)
    if (stepIncrease > this.rapidIncreaseThreshold && timeSinceLastStep < 60000) {
      flags.push('rapid_step_increase');
      score -= 0.4;
    }

    // Check for consistent shake patterns
    if (this.stepBuffer.length > 5) {
      const avgDelta = this.stepBuffer.reduce((a, b) => a + b, 0) / this.stepBuffer.length;
      const variance = this.stepBuffer.reduce((acc, val) => acc + Math.pow(val - avgDelta, 2), 0) / this.stepBuffer.length;
      
      if (variance < 0.1 && stepIncrease > 100) {
        flags.push('artificial_movement_pattern');
        score -= 0.3;
      }
    }

    // Check for impossible step counts during inactive periods
    const hoursSinceUpdate = (now - (this.dailySteps[today + '_timestamp'] || now)) / (1000 * 60 * 60);
    if (hoursSinceUpdate > 8 && stepIncrease > 15000) {
      flags.push('inactive_period_spike');
      score -= 0.4;
    }

    return {
      isValid: score > 0.5,
      score: Math.max(0, score),
      flags
    };
  }

  // Enhanced background sync capability
  public enableBackgroundSync(): void {
    this.backgroundSync = true;
  }

  public disableBackgroundSync(): void {
    this.backgroundSync = false;
  }

  // Get calibration status
  public getCalibrationStatus(): { factor: number; samples: number; isCalibrated: boolean } {
    return {
      factor: this.calibrationFactor,
      samples: this.userWalkingPattern.length,
      isCalibrated: this.userWalkingPattern.length >= 50
    };
  }

  public addStepCallback(callback: (stepData: StepData) => void): void {
    this.callbacks.push(callback);
  }

  public removeStepCallback(callback: (stepData: StepData) => void): void {
    const index = this.callbacks.indexOf(callback);
    if (index > -1) {
      this.callbacks.splice(index, 1);
    }
  }

  public async resetDailySteps(): Promise<void> {
    const today = this.getTodayKey();
    this.dailySteps[today] = 0;
    this.currentSteps = 0;
    await this.saveStepData();
  }

  public async clearAllData(): Promise<void> {
    this.dailySteps = {};
    this.currentSteps = 0;
    await localforage.removeItem('daily_steps');
    await localforage.removeItem('current_steps');
  }
}

export const pedometerService = PedometerService.getInstance();