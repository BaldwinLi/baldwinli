import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'
import path from 'path'

export default defineConfig({
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        core: path.resolve(__dirname, 'core/src/index.ts'),
        vueHooks: path.resolve(__dirname, 'vue-hooks/index.ts')
      },
      output: {
        entryFileNames: '[name]/dist/[name].js',
        chunkFileNames: '[name]/dist/[name]-[hash].js',
        assetFileNames: '[name]/dist/[name]-[hash][extname]'
      },
      external: ['vue', 'radash', 'qs', 'decimal.js', '@probe/core'],
      preserveEntrySignatures: 'strict'
    }
  },
  plugins: [dts()]
})
