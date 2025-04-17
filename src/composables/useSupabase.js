import { createClient } from '@supabase/supabase-js'

export default function useSupabase() {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  const supabaseKey = import.meta.env.VITE_SUPABASE_KEY
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('Supabase配置参数:', {
      VITE_SUPABASE_URL: supabaseUrl,
      VITE_SUPABASE_KEY: supabaseKey ? '*****' : '未设置'
    })
    throw new Error('缺少Supabase配置参数 - 请检查.env文件或部署配置')
  }

  const supabase = createClient(supabaseUrl, supabaseKey)
  
  return {
    supabase,
    auth: supabase.auth,
    db: supabase.from('bookmarks')
  }
}
