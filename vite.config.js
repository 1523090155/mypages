import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  base: '/mypages/', // 匹配仓库名称
  plugins: [vue()],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: './src/main.js' // 明确指定JS入口
    }
  }
})
