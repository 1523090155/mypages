import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path' // 添加path模块导入

export default defineConfig({
  base: process.env.NODE_ENV === 'production' ? '/mypages/' : '/', // 匹配仓库名称
  plugins: [vue()],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'), // 添加HTML入口
        app: './src/main.js' // 保留JS入口
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src') // 确保别名配置正确
    }
  }
})
