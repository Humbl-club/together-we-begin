import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.humblclub.togetherwebegin',
  appName: 'final girls app',
  webDir: 'dist',
  server: {
    url: 'https://945e8026-291f-4434-93b5-949dcf1fab6b.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    Motion: {
      permissions: {
        'ios': {
          'NSMotionUsageDescription': 'This app uses motion data to count your steps for walking challenges.'
        },
        'android': {
          'permissions': [
            'android.permission.ACTIVITY_RECOGNITION'
          ]
        }
      }
    }
  }
};

export default config;