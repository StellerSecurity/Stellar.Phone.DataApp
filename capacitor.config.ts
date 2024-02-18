import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'stellar.phone.dataApp',
  appName: 'Data',
  webDir: 'www',
  android: { allowMixedContent: true },
  server: {
    androidScheme: 'https'
  },
  plugins: {
    LocalNotifications: {
      smallIcon: "ic_stat_icon_config_sample",
      iconColor: "#488AFF",
      sound: "beep.wav",
    },
    CapacitorHttp: {
      enabled: true,
    },
    BackgroundRunner: {
      label: "stellar.phone.dataApp",
      src: "runners/runner.js",
      event: "checkIn",
      repeat: true,
      interval: 30,
      autoStart: true,
    },
  },
};

export default config;
