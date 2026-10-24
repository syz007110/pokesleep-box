import { fileURLToPath, URL } from 'node:url'
import { copyFileSync, existsSync } from 'node:fs'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import vuetify from 'vite-plugin-vuetify'

const repoBase = '/pokesleep-box/'

export default defineConfig(({ command }) => {
  const base = process.env.VITE_BASE ?? (command === 'build' ? repoBase : '/')

  return {
    base,
    plugins: [
      vue(),
      vuetify({ autoImport: true }),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'pwa-192.png', 'pwa-512.png'],
        manifest: {
          id: base,
          name: '橙花口袋本',
          short_name: '口袋本',
          description: '宝可梦睡眠离线计算器，数据只存在本机。',
          lang: 'zh-CN',
          start_url: base,
          scope: base,
          display: 'standalone',
          orientation: 'portrait',
          background_color: '#141A22',
          theme_color: '#141A22',
          categories: ['utilities', 'games'],
          icons: [
            { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
            { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
            { src: 'pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
          ]
        },
        workbox: {
          navigateFallback: `${base}index.html`,
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,json,webmanifest}'],
          cleanupOutdatedCaches: true,
          clientsClaim: true,
          skipWaiting: true
        },
        devOptions: {
          enabled: false
        }
      }),
      {
        name: 'spa-github-pages-404',
        closeBundle() {
          if (existsSync('dist/index.html')) {
            copyFileSync('dist/index.html', 'dist/404.html')
          }
        }
      }
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      }
    }
  }
})
