var app = angular.module('bookmarkApp', []);

// Supabase 配置
const SUPABASE_URL = 'https://vfwrwhoqkifxlogoavod.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmd3J3aG9xa2lmeGxvZ29hdm9kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM2ODc1NTYsImV4cCI6MjA1OTI2MzU1Nn0.HX_WGCy93SwmrIZjFOxf5Ma86jE3pNITIhZu-r6mbDI'; // 保持您的原始密钥
// 修改变量名避免冲突
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    flowType: 'pkce',
    redirectTo: null
  }
});

// 统一服务定义
app.factory('AuthService', () => ({
  login: (email, password) => supabaseClient.auth.signInWithPassword({ email, password }),
  logout: () => supabaseClient.auth.signOut(),
  getUser: () => supabaseClient.auth.getUser()
}));

app.factory('BookmarkService', () => ({
  getBookmarks: (userId) => supabaseClient.from('bookmarks')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
}));

// 唯一控制器定义
app.controller('AuthController', [
  '$scope',
  'AuthService',
  'BookmarkService',
  ($scope, AuthService, BookmarkService) => {
    // 初始化状态
    $scope.sessionChecked = false;
    $scope.isLoggedIn = false;
    $scope.bookmarks = [];

    // 统一登录方法
    $scope.login = async function(event) {
      if(event) event.preventDefault();
      try {
        const { data, error } = await AuthService.login(
          $scope.username,
          $scope.password
        );
        
        if (error) throw error;
        
        localStorage.setItem('userId', data.user.id);
        const { data: bookmarks } = await BookmarkService.getBookmarks(data.user.id);
        $scope.bookmarks = bookmarks;
        $scope.isLoggedIn = true;
        $scope.$apply();
      } catch (error) {
        $scope.message = error.message;
        $scope.$apply();
      }
    };

    // 其他方法保持不变...
    // 需要补充的方法
    // 在控制器中添加
    $scope.showRegister = function() {
        $scope.isRegister = true;
        $scope.message = '';
    };
    
    $scope.loginWith = function(provider) {
        supabaseClient.auth.signInWithOAuth({ provider })
            .then(({ error }) => {
                if (error) $scope.message = error.message;
                $scope.$apply();
            });
    };
  }
]);