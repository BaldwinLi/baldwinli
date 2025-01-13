import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import { resolve } from 'path';
// import copy from 'rollup-plugin-copy';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'index.ts'),
      name: 'core',
      fileName: 'index',
    },
    rollupOptions: {
      external: ['vue', 'radash', 'qs', 'decimal.js'],
    },
    outDir: resolve(__dirname, 'dist'),
  },
  plugins: [
    dts({
      root: __dirname,
      entryRoot: __dirname,
    }),
    // copy({
    //   targets: [
    //     { src: 'packages/core/package.json', dest: 'packages/core/dist' }, //执行拷贝
    //   ],
    // }),
  ],
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
