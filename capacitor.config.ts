import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.pulse.medtracker',
  appName: 'PULSE',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
};

export default config;
