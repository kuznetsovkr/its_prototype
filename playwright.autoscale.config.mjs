import { defineConfig, devices } from "@playwright/test";
import baseConfig from "./playwright.config.mjs";

// Optional Safari-engine regression checks; the default suite still uses Chromium.
export default defineConfig({
  ...baseConfig,
  testMatch: ["**/compact-autoscale.e2e.js", "**/order-autoscale.e2e.js", "**/autoscale-final.e2e.js"],
  workers: 1,
  projects: [
    { name: "desktop-webkit", use: { ...devices["Desktop Safari"], browserName: "webkit" } },
    { name: "mobile-webkit", use: { ...devices["iPhone 13"], browserName: "webkit" } },
  ],
});
