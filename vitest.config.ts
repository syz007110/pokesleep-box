import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@src': fileURLToPath(new URL('./third_party/nerolis-lab/engine/src', import.meta.url)),
      'sleepapi-common': fileURLToPath(new URL('./third_party/nerolis-lab/common/src/index.ts', import.meta.url))
    }
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts']
  }
})
