import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'

// 从环境变量读取GitHub Actions secrets
const githubToken = import.meta.env.VITE_GITHUB_TOKEN
const otherSecret = import.meta.env.VITE_OTHER_SECRET

console.log('GitHub Token:', githubToken ? '*****' : '未设置') // 安全起见不打印真实token
console.log('Other Secret:', otherSecret ? '*****' : '未设置')

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.mount('#app')