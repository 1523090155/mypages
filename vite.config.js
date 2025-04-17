import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  base: process.env.NODE_ENV === 'production' ? '/mypages/' : '/',
  plugins: [vue()],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: path.resolve(__dirname, 'index.html'),
      output: {
        format: 'es', // 确保输出ES模块
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js'
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      'vue': 'vue/dist/vue.esm-bundler.js' // 添加Vue别名解析
    }
  }
})
