/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      vue: 'vue/dist/vue.esm-bundler.js',
      '@vue/runtime-dom': 'vue/dist/vue.runtime-dom.esm-bundler.js'
    }
    config.module.rules.push({
      test: /\.vue$/,
      loader: 'vue-loader',
    })
    return config
  },
}

export default nextConfig
