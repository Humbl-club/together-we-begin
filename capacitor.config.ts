import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.945e8026291f443493b5949dcf1fab6b',
  appName: 'HUMBL',
  webDir: 'dist',
  server: {
    url: 'https://945e8026-291f-4434-93b5-949dcf1fab6b.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#FCFCFC",
      showSpinner: false,
      androidSpinnerStyle: "small",
      iosSpinnerStyle: "small"
    },
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