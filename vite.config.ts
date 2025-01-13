import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'index.ts'),
      name: 'common-util',
      fileName: 'index',
    },
    rollupOptions: {
      external: ['@angular/core', 'axios', 'lodash', 'rxjs'],
    },
    outDir: resolve(__dirname, '..', 'dist', 'common-util'),
  },
  plugins: [dts()],
});
//   ({
//   build: {
//     outDir: 'dist',
//     rollupOptions: {
//       input: {
//         core: path.resolve(__dirname, 'core/src/index.ts'),
//         vueHooks: path.resolve(__dirname, 'vue-hooks/index.ts'),
//       },
//       output: {
//         entryFileNames: 'dist/[name].js',
//         chunkFileNames: 'dist/[name]-[hash].js',
//         assetFileNames: 'dist/[name]-[hash][extname]',
//       },
//       external: ['vue', 'radash', 'qs', 'decimal.js', '@probe/core'],
//       preserveEntrySignatures: 'strict',
//     },
//   },
//   plugins: [dts()],
// });
