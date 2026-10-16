import { defineConfig } from "@playwright/test";
import baseConfig from "./playwright.config.mjs";

// Exercise the real create/confirm flow against intercepted local APIs, not the demo shortcut.
export default defineConfig({
  ...baseConfig,
  testMatch: ["**/order-completion.e2e.js", "**/order-delivery.e2e.js", "**/delivery-city.e2e.js", "**/order-step-scroll.e2e.js"],
  workers: 1,
  webServer: {
    ...baseConfig.webServer,
    env: {
      ...baseConfig.webServer.env,
      VITE_DEMO_MODE: "false",
      VITE_API_URL: "/api",
      VITE_CDEK_SERVICE_URL: "/service.php",
    },
  },
  projects: baseConfig.projects.map((project) => ({
    ...project,
    name: project.name.replace("chromium", "live-checkout"),
  })),
});
