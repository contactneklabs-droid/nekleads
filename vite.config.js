import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
export default defineConfig({
    plugins: [
        react(),
        VitePWA({
            registerType: 'autoUpdate',
            injectRegister: 'auto',
            includeAssets: ['favicon.jpg', 'apple-touch-icon.png'],
            manifest: {
                name: 'NEK LEADS',
                short_name: 'NEK LEADS',
                description: 'Volunteer & Manpower Management for NEK',
                theme_color: '#000000',
                background_color: '#000000',
                display: 'standalone',
                orientation: 'portrait',
                icons: [
                    {
                        src: 'favicon.jpg',
                        sizes: '192x192',
                        type: 'image/jpeg'
                    },
                    {
                        src: 'favicon.jpg',
                        sizes: '512x512',
                        type: 'image/jpeg',
                        purpose: 'any maskable'
                    }
                ],
                shortcuts: [
                    {
                        name: 'WhatsApp Drafts',
                        short_name: 'Drafts',
                        description: 'Event and payment notice generator',
                        url: '/whatsapp-drafts',
                        icons: [{ src: 'favicon.jpg', sizes: '192x192' }]
                    },
                    {
                        name: 'Talent Directory',
                        short_name: 'Talent',
                        description: 'View hostesses & volunteer leads',
                        url: '/volunteers',
                        icons: [{ src: 'favicon.jpg', sizes: '192x192' }]
                    },
                    {
                        name: 'Manpowers',
                        short_name: 'Manpowers',
                        description: 'View crew & manpower leads',
                        url: '/manpower',
                        icons: [{ src: 'favicon.jpg', sizes: '192x192' }]
                    }
                ]
            },
            workbox: {
                runtimeCaching: [
                    {
                        urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'google-fonts-cache',
                            expiration: {
                                maxEntries: 10,
                                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
                            },
                            cacheableResponse: {
                                statuses: [0, 200]
                            }
                        }
                    },
                    {
                        urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'gstatic-fonts-cache',
                            expiration: {
                                maxEntries: 10,
                                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
                            },
                            cacheableResponse: {
                                statuses: [0, 200]
                            }
                        }
                    }
                ]
            },
            devOptions: {
                enabled: true
            }
        })
    ],
});
