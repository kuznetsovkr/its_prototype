import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  envPrefix: ["VITE_", "REACT_APP_"],
  server: {
    port: 3000,
  },
  preview: {
    port: 3000,
  },
  build: {
    outDir: "build",
    // The CDEK SDK is a pre-bundled third-party module. It is isolated in an
    // on-demand chunk and only downloaded when the pickup-point map is opened.
    chunkSizeWarningLimit: 700,
  },
  test: {
    environment: "node",
  },
});

