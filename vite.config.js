import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  server: {
    proxy: {
      // In dev, proxy /api/* → Node AI server on port 3001
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg", "icons/icon-192.png", "icons/icon-512.png"],
      manifest: {
        name: "Lecturer Sam Academy",
        short_name: "Lecturer Sam",
        description:
          "An interactive learning platform for Ghanaian JHS teachers and students, aligned to the NaCCA Common Core Programme.",
        theme_color: "#12263a",
        background_color: "#f4f0e8",
        display: "standalone",
        start_url: "/",
        icons: [
          {
            src: "icons/icon-192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "icons/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "icons/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,svg,png,woff2}"],
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024, // 4 MB
        // Textbook figures are heavy (~8 MB across 72 PNGs) — exclude them
        // from the precache and let them cache at runtime on first view.
        globIgnores: ["**/*-fig*.png"],
        runtimeCaching: [
          {
            urlPattern: /\/assets\/.*\.(?:png|jpg|jpeg|gif)$/,
            handler: "CacheFirst",
            options: {
              cacheName: "textbook-figures",
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 60 },
            },
          },
        ],
      },
    }),
  ],
});
