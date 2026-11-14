import { defineConfig, devices } from "@playwright/test";
import baseConfig from "./playwright.config.mjs";

export default defineConfig({
  ...baseConfig,
  testMatch: "**/production-notice.e2e.js",
  workers: 1,
  projects: [
    { name: "desktop-chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile-chromium", use: { ...devices["iPhone 13"], browserName: "chromium" } },
    { name: "desktop-webkit", use: { ...devices["Desktop Safari"], browserName: "webkit" } },
    { name: "mobile-webkit", use: { ...devices["iPhone 13"], browserName: "webkit" } },
  ],
});
