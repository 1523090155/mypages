import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig(({ mode }) => {
  // 加载环境变量
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [vue()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '~@': path.resolve(__dirname, './src')
      }
    },
    define: {
      'process.env': env
    },
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: `@import "@/assets/css/style.css";`
        }
      }
    }
  }
})
