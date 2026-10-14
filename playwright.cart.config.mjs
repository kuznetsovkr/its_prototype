import process from "node:process";
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e", testMatch: ["**/cart-foundation.browser.js", "**/cart-ui.browser.js"], workers: 1,
  forbidOnly: Boolean(process.env.CI), retries: 0,
  use: { baseURL: "http://127.0.0.1:4174", screenshot: "only-on-failure", trace: "retain-on-failure" },
  webServer: {
    // Test-only consumers exercise storage and the real recipient/order pages.
    // Fixtures are outside public/ and not included in production builds.
    command: "npm run dev -- --host 127.0.0.1 --port 4174 --strictPort",
    url: "http://127.0.0.1:4174", reuseExistingServer: false,
    env: { ...process.env, VITE_API_URL: "/api", VITE_DEMO_MODE: "true", VITE_ALLOW_INDEXING: "false" },
  },
  projects: [
    { name: "desktop-chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile-chromium", use: { ...devices["iPhone 13"], browserName: "chromium" } },
    { name: "mobile-webkit", use: { ...devices["iPhone 13"], browserName: "webkit" } },
  ],
});
