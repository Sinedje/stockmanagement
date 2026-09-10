import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),

    // Installable sur poste, et surtout démarrable sans réseau. Sans service
    // worker, une caisse rouverte pendant une coupure n'affichait rien : les
    // fichiers de l'application venaient du serveur. Les données étaient bien
    // en cache, mais inaccessibles faute de pouvoir charger l'application.
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],

      manifest: {
        name: 'Stock Expert — Gestion de stock et de caisse',
        short_name: 'Stock Expert',
        description: "Gestion de stock multi-magasins, facturation, inventaire et suivi de caisse.",
        lang: 'fr',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'any',
        background_color: '#f1f5f9',
        theme_color: '#10b981',
        icons: [
          { src: '/pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/pwa-512.png', sizes: '512x512', type: 'image/png' },
          // « maskable » : Android recadre l'icône selon le lanceur.
          { src: '/pwa-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },

      workbox: {
        // Le paquet dépasse le seuil par défaut (2 Mo) à cause d'exceljs et
        // d'antd. Sans ce relèvement, les gros fichiers sont exclus du cache
        // et l'application ne démarre pas hors réseau.
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        navigateFallback: '/index.html',

        runtimeCaching: [
          {
            // Polices Google : rarement modifiées, coûteuses à recharger.
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\//,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Images produit : servies depuis le cache, actualisées en fond.
            urlPattern: /\/storage\/v1\/object\/public\//,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'product-images',
              expiration: { maxEntries: 400, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
          // Les appels métier ne sont volontairement PAS mis en cache ici :
          // c'est IndexedDB qui s'en charge, avec la distinction explicite
          // entre données fraîches et données de repli. Un cache HTTP
          // silencieux ferait passer des chiffres périmés pour à jour.
        ],
      },

      devOptions: { enabled: false },
    }),
  ],
})
