import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.26b9fdaf651e44f283c9dc2122b52443',
  appName: 'box-cricket-captain-score',
  webDir: 'dist',
  server: {
    url: 'https://26b9fdaf-651e-44f2-83c9-dc2122b52443.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#1e7e34',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false
    }
  }
};

export default config;