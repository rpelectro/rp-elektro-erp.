import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "prompt",
      injectRegister: false,
      includeAssets: ["fonts/DejaVuSans.ttf"],
      manifest: {
        name: "E-RP · RP Elektro",
        short_name: "E-RP",
        lang: "hu",
        theme_color: "#19222b",
        background_color: "#f5f6f8",
        display: "standalone",
        start_url: "./",
        icons: [
          {
            src: "icon.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ttf,svg,webmanifest}"],
        maximumFileSizeToCacheInBytes: 4000000,
        navigateFallback: "index.html",
        cleanupOutdatedCaches: false,
        skipWaiting: false,
        clientsClaim: false,
      },
    }),
  ],
  base: "./",
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
    testTimeout: 20000,
  },
});
