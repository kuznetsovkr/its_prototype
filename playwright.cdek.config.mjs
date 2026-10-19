import { defineConfig } from "@playwright/test";
import cartConfig from "./playwright.cart.config.mjs";
export default defineConfig({ ...cartConfig, testMatch: ["**/cdek-widget.browser.js"],
  webServer: { ...cartConfig.webServer, env: { ...cartConfig.webServer.env, VITE_YMAPS_KEY: "fixture-key" } } });
