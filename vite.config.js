import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  root: './src', // or wherever your entry file is located
  plugins: [vue()],
})
