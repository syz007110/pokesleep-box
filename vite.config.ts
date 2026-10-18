import { fileURLToPath, URL } from 'node:url'
import { copyFileSync, existsSync } from 'node:fs'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

const repoBase = '/pokesleep-box/'

export default defineConfig(({ command }) => {
  const base = process.env.VITE_BASE ?? (command === 'build' ? repoBase : '/')

  return {
    base,
    plugins: [
      vue(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['icons/apple-touch-icon.png', 'icons/favicon-32.png', 'icons/mask-icon.svg'],
        manifest: {
          id: repoBase,
          name: '宝可梦睡眠盒子',
          short_name: '睡眠盒子',
          description: '离线管理自己的宝可梦睡眠盒子，并计算每只宝可梦的产出。',
          lang: 'zh-CN',
          start_url: base,
          scope: base,
          display: 'standalone',
          orientation: 'portrait',
          background_color: '#0e1714',
          theme_color: '#0e1714',
          categories: ['utilities', 'games'],
          icons: [
            {
              src: 'icons/icon-192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: 'icons/icon-512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: 'icons/icon-maskable-192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'maskable'
            },
            {
              src: 'icons/icon-maskable-512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable'
            }
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
        '@': fileURLToPath(new URL('./src', import.meta.url)),
        'sleepapi-common': fileURLToPath(new URL('./src/lab.ts', import.meta.url))
      }
    },
    optimizeDeps: {
      include: ['uuid']
    }
  }
})
