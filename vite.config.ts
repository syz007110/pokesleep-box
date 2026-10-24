import { copyFileSync, existsSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineConfig, type Plugin } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import vuetify from 'vite-plugin-vuetify'

const repoBase = '/pokesleep-box/'

function prefixPublicPaths(base: string): Plugin {
  const normalized = base.endsWith('/') ? base : `${base}/`
  return {
    name: 'prefix-public-paths',
    enforce: 'pre',
    transform(code, id) {
      if (!/\.(vue|ts|scss|css)$/.test(id) || id.includes('node_modules')) return null
      const next = code.replace(/(['"`])\/(images|fonts)\//g, `$1${normalized}$2/`)
      return next === code ? null : { code: next, map: null }
    }
  }
}

export default defineConfig(({ command }) => {
  const base = process.env.VITE_BASE ?? (command === 'build' ? repoBase : repoBase)
  return {
    base,
    css: {
      preprocessorOptions: {
        scss: {
          api: 'modern',
          additionalData: `@use "@/assets/main" as *;\n`
        }
      }
    },
    plugins: [
      prefixPublicPaths(base),
      vue(),
      vuetify(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'pwa-192x192.png', 'pwa-512x512.png'],
        manifest: {
          id: base,
          name: '橙花口袋本',
          short_name: '口袋本',
          description: '离线版 Neroli\'s Lab。计算和存档都在这台设备上。',
          lang: 'zh-CN',
          start_url: base,
          scope: base,
          display: 'standalone',
          orientation: 'portrait',
          background_color: '#191224',
          theme_color: '#191224',
          icons: [
            { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
            { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
            { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
          ]
        },
        workbox: {
          navigateFallback: `${base}index.html`,
          globPatterns: ['**/*.{js,css,html,ico,svg,woff,woff2,webmanifest,json}'],
          globIgnores: ['**/images/**'],
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
          cleanupOutdatedCaches: true,
          clientsClaim: true,
          skipWaiting: true,
          runtimeCaching: [
            {
              urlPattern: ({ url }) => url.pathname.includes('/images/'),
              handler: 'CacheFirst',
              options: {
                cacheName: 'lab-images',
                expiration: { maxEntries: 500, maxAgeSeconds: 60 * 60 * 24 * 30 },
                cacheableResponse: { statuses: [0, 200] }
              }
            }
          ]
        }
      }),
      {
        name: 'generate-avatars-json',
        buildStart() {
          const avatarDir = path.resolve('public/images/avatar')
          const outputJson = path.resolve(avatarDir, 'avatars.json')
          const filesObject: Record<string, string> = {}
          const walk = (dirPath: string) => {
            for (const file of readdirSync(dirPath)) {
              const fullPath = path.join(dirPath, file)
              if (statSync(fullPath).isDirectory()) walk(fullPath)
              else if (/\.(png|jpe?g)$/i.test(file)) {
                filesObject[path.parse(file).name] = path.relative(avatarDir, fullPath).split(path.sep).join('/')
              }
            }
          }
          if (!existsSync(avatarDir)) return
          walk(avatarDir)
          writeFileSync(outputJson, JSON.stringify(filesObject, null, 2))
        }
      },
      {
        name: 'spa-github-pages-404',
        closeBundle() {
          if (existsSync('dist/index.html')) copyFileSync('dist/index.html', 'dist/404.html')
        }
      }
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
        '@src': fileURLToPath(new URL('./third_party/nerolis-lab/engine/src', import.meta.url)),
        'sleepapi-common': fileURLToPath(new URL('./third_party/nerolis-lab/common/src/index.ts', import.meta.url))
      }
    },
    define: {
      APP_NAME: JSON.stringify('橙花口袋本'),
      APP_VERSION: JSON.stringify('2.71.6-offline'),
      __INTLIFY_JIT_COMPILATION__: true
    },
    build: {
      chunkSizeWarningLimit: 2500
    }
  }
})
