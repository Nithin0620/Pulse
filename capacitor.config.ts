import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.pulse.medtracker',
  appName: 'PULSE',
  webDir: 'dist',
  server: {
    url: 'https://pulse.ssh.net.in',
    cleartext: true,
    androidScheme: 'https',
  },
};

export default config;
