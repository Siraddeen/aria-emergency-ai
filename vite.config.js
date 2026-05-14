import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  server: {
    host: "0.0.0.0",
    port: 5173,

    // Allow ngrok / mobile external access
    allowedHosts: true,

    // Required for MediaPipe / SharedArrayBuffer / WASM
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
    },
  },

  plugins: [
    tailwindcss(),

    react(),

    VitePWA({
      registerType: "autoUpdate",

      includeAssets: [
        "favicon.ico",
        "icon-192.png",
        "icon-512.png",
        "robots.txt",
      ],

      manifest: {
        name: "ARIA — Emergency AI Assistant",
        short_name: "ARIA",

        description:
          "Offline-first emergency AI assistant powered by Gemma + NLP fallback.",

        theme_color: "#00d4aa",
        background_color: "#0a0c0f",

        display: "standalone",
        orientation: "portrait",

        start_url: "/",

        icons: [
          {
            src: "/icon-192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/icon-512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },

      workbox: {
        cleanupOutdatedCaches: true,

        globPatterns: ["**/*.{js,css,html,json,png,svg,ico,woff2}"],

        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com/,
            handler: "CacheFirst",

            options: {
              cacheName: "google-fonts-stylesheets",

              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },

              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },

          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com/,
            handler: "CacheFirst",

            options: {
              cacheName: "google-fonts-webfonts",

              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },

              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },

          // Cache local AI model
          {
            urlPattern: /\/models\/.*\.bin$/,
            handler: "CacheFirst",

            options: {
              cacheName: "aria-local-models",

              expiration: {
                maxEntries: 2,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },

              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },

      devOptions: {
        enabled: true,
      },
    }),
  ],
});

// import { defineConfig } from 'vite'
// import react from '@vitejs/plugin-react'
// import { VitePWA } from 'vite-plugin-pwa'
// import tailwindcss from '@tailwindcss/vite'

// export default defineConfig({
//   server: {
//     headers: {
//       'Cross-Origin-Opener-Policy': 'same-origin',
//       'Cross-Origin-Embedder-Policy': 'require-corp',
//     },
//   },
//   plugins: [
//     tailwindcss(),
//     react(),
//     VitePWA({
//       registerType: 'autoUpdate',
//       includeAssets: ['**/*'],
//       manifest: {
//         name: 'ARIA — Emergency AI Assistant',
//         short_name: 'ARIA',
//         description: 'Offline-first emergency AI assistant',
//         theme_color: '#00d4aa',
//         background_color: '#0a0c0f',
//         display: 'standalone',
//         icons: [
//           { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
//           { src: '/icon-512.png', sizes: '512x512', type: 'image/png' }
//         ]
//       },
//       workbox: {
//         globPatterns: ['**/*.{js,css,html,json,png,svg,ico}'],
//         runtimeCaching: [
//           {
//             urlPattern: /^https:\/\/fonts\.googleapis\.com/,
//             handler: 'CacheFirst',
//             options: { cacheName: 'google-fonts', expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 } }
//           }
//         ]
//       }
//     })
//   ]
// })
