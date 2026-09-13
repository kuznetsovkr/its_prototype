import process from "node:process";
import { defineConfig, devices } from "@playwright/test";

const host = "127.0.0.1";
const port = 4173;
const baseURL = `http://${host}:${port}`;

export default defineConfig({
  testDir: "./e2e",
  testMatch: "**/*.e2e.js",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI
    ? [["line"], ["html", { open: "never" }]]
    : "list",
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  webServer: {
    command: `npm run build && npm run preview -- --host ${host} --port ${port} --strictPort`,
    url: baseURL,
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      ...process.env,
      VITE_ALLOW_INDEXING: "false",
      VITE_DEMO_MODE: "true",
      VITE_TURNSTILE_E2E: "true",
    },
  },
  projects: [
    {
      name: "desktop-chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "mobile-chromium",
      use: { ...devices["iPhone 13"], browserName: "chromium" },
    },
  ],
});
