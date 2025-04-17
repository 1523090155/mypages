import { createClient } from '@supabase/supabase-js'

export default function useSupabase() {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  const supabaseKey = import.meta.env.VITE_SUPABASE_KEY
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('缺少Supabase配置参数')
  }

  const supabase = createClient(supabaseUrl, supabaseKey)
  
  return {
    supabase,
    auth: supabase.auth,
    db: supabase.from('bookmarks')
  }
}
