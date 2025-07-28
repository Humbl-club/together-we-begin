import { useEffect, useRef } from 'react';

type HapticPattern = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';

interface HapticFeedbackOptions {
  enabled?: boolean;
  intensity?: number;
}

export const useHapticFeedback = (options: HapticFeedbackOptions = {}) => {
  const { enabled = true, intensity = 1 } = options;
  const lastFeedbackTime = useRef<number>(0);

  const vibrate = (pattern: number | number[]) => {
    if (!enabled || !navigator.vibrate) return;
    
    // Throttle feedback to prevent spam
    const now = Date.now();
    if (now - lastFeedbackTime.current < 50) return;
    lastFeedbackTime.current = now;

    try {
      navigator.vibrate(pattern);
    } catch (error) {
      console.warn('Haptic feedback not supported:', error);
    }
  };

  const triggerHaptic = (pattern: HapticPattern) => {
    if (!enabled) return;

    const patterns = {
      light: [10],
      medium: [20],
      heavy: [30],
      success: [10, 50, 10],
      warning: [20, 100, 20],
      error: [50, 50, 50]
    };

    const selectedPattern = patterns[pattern];
    const adjustedPattern = selectedPattern.map(duration => 
      Math.round(duration * intensity)
    );

    vibrate(adjustedPattern);
  };

  // iOS Haptic Feedback support
  const triggerIOSHaptic = (type: 'impact' | 'notification' | 'selection', style?: string) => {
    if (!enabled) return;

    try {
      // @ts-ignore - iOS Haptic Feedback API
      if (window.DeviceMotionEvent && typeof DeviceMotionEvent.requestPermission === 'function') {
        // iOS 13+ haptic feedback
        if (type === 'impact' && window.navigator.vibrate) {
          const impactStyles = {
            light: [10],
            medium: [15],
            heavy: [25]
          };
          vibrate(impactStyles[style as keyof typeof impactStyles] || [15]);
        }
      }
    } catch (error) {
      // Fallback to standard vibration
      triggerHaptic('medium');
    }
  };

  // Convenience methods
  const feedback = {
    tap: () => triggerHaptic('light'),
    select: () => triggerHaptic('medium'),
    success: () => triggerHaptic('success'),
    error: () => triggerHaptic('error'),
    warning: () => triggerHaptic('warning'),
    impact: (style: 'light' | 'medium' | 'heavy' = 'medium') => {
      triggerIOSHaptic('impact', style);
    },
    notification: () => triggerIOSHaptic('notification'),
    selection: () => triggerIOSHaptic('selection')
  };

  return feedback;
};