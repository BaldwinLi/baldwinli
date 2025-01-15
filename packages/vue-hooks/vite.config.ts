import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'index.ts'),
      name: 'vue-hooks',
      fileName: 'index',
    },
    rollupOptions: {
      external: ['radash', '@baldwinli/core', 'vue'],
    },
    outDir: resolve(__dirname, 'dist'),
  },
  plugins: [
    dts({
      root: __dirname,
      entryRoot: __dirname,
    }),
  ],
});
