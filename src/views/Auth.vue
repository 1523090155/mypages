<template>
  <div class="auth-section">
    <!-- 登录表单 -->
    <div v-if="!authStore.isLoggedIn && authStore.sessionChecked" class="login-container">
      <form @submit.prevent="handleLogin">
        <div class="form-container">
          <div class="form-group">
            <input type="email" v-model="email" placeholder="邮箱" required>
          </div>
          <div class="form-group">
            <input type="password" v-model="password" placeholder="密码" required>
          </div>
          <button type="submit" class="login-btn">登录</button>
        </div>
      </form>
      <div class="message">{{ authStore.message }}</div>
    </div>

    <!-- 书签区域 -->
    <div v-if="authStore.isLoggedIn" class="bookmarks-section">
      <div class="bookmark-header">
        <h2>个人书签</h2>
        <button @click="authStore.logout()" class="logout-btn">退出登录</button>
      </div>
      <div class="bookmark-list">
        <div v-for="bookmark in authStore.bookmarks" :key="bookmark.id" class="bookmark">
          <a :href="bookmark.url" target="_blank">{{ bookmark.title }}</a>
        </div>
        <div v-if="authStore.bookmarks.length === 0" class="no-bookmarks">
          暂无书签，请添加书签。
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const email = ref('')
const password = ref('')

onMounted(() => {
  authStore.checkSession()
})

const handleLogin = async () => {
  if (!email.value || !password.value) {
    authStore.message = '请输入邮箱和密码'
    return
  }
  
  try {
    await authStore.login(email.value, password.value)
  } catch (error) {
    console.error('Login error:', error)
  }
}
</script>
