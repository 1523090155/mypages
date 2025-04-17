import { defineStore } from 'pinia'
import useSupabase from '../composables/useSupabase'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    sessionChecked: false,
    isLoggedIn: false,
    bookmarks: [],
    message: '',
    sessionExpiresAt: null
  }),
  actions: {
    async checkSession() {
      const { auth } = useSupabase()
      try {
        const { data: { user }, error } = await auth.getUser()
        if (user && this.sessionExpiresAt && Date.now() < this.sessionExpiresAt) {
          this.user = user
          this.isLoggedIn = true
          await this.fetchBookmarks()
        } else {
          await this.logout()
        }
      } finally {
        this.sessionChecked = true
      }
    },
    async fetchBookmarks() {
      if (!this.user) return
      
      const { db } = useSupabase()
      const { data: bookmarks, error } = await db
        .select('*')
        .eq('user_id', this.user.id)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      this.bookmarks = bookmarks || []
    },
    async login(email, password) {
      const { auth, db } = useSupabase()
      try {
        const { data, error } = await auth.signInWithPassword({ email, password })
        if (error) throw error
        
        this.sessionExpiresAt = Date.now() + 3600000
        this.user = data.user
        this.isLoggedIn = true
        await this.fetchBookmarks()
      } catch (error) {
        this.message = error.message
        throw error
      }
    },
    async logout() {
      const { auth } = useSupabase()
      await auth.signOut()
      this.isLoggedIn = false
      this.bookmarks = []
      this.user = null
      this.message = ''
    }
  }
})
