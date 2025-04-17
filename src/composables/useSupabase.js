import { createClient } from '@supabase/supabase-js'

export default function useSupabase() {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  const supabaseKey = import.meta.env.VITE_SUPABASE_KEY
  
  if (!supabaseUrl || !supabaseKey) {
    console.warn('Supabase 配置缺失，请检查 .env 文件或部署配置')
    return null
  }

  const supabase = createClient(supabaseUrl, supabaseKey)
  
  return {
    supabase,
    auth: supabase.auth,
    db: supabase.from('bookmarks')
  }
}
