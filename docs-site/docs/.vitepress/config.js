import { defineConfig } from 'vitepress'
import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  title: 'DeekSeek Docs',
  description: 'Documentation for DeekSeek project',
  themeConfig: {
    nav: [
      { text: 'Guide', link: '/guide/' }
    ],
    sidebar: [
      {
        text: 'Guide',
        items: [
          { text: 'Introduction', link: '/guide/' },
          { text: 'Features', link: '/guide/features' }
        ]
      }
    ]
  },
  vite: {
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('../../src', import.meta.url))
      }
    },
    plugins: [
      vue()
    ]
  }
})
