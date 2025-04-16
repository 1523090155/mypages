// 前端环境变量处理
window.__env = {
  SUPABASE_URL: window.__SUPABASE_CONFIG__?.url || 'https://vfwrwhoqkifxlogoavod.supabase.co',
  SUPABASE_KEY: window.__SUPABASE_CONFIG__?.key || ''
};

// 从GitHub Pages的URL参数获取（可选）
if(window.location.search.includes('env=prod')) {
  window.__env.SUPABASE_URL = 'https://vfwrwhoqkifxlogoavod.supabase.co';
}
