import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.aria.assistant",
  appName: "ARIA",
  webDir: "dist",

  server: {
    androidScheme: "https",
  },
};

export default config;
