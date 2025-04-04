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

    // 添加：检查会话状态
    async function checkSession() {
      try {
        const { data: { user }, error } = await AuthService.getUser();
        if (user) {
          $scope.isLoggedIn = true;
          const { data: bookmarks } = await BookmarkService.getBookmarks(user.id);
          $scope.bookmarks = bookmarks || [];
        }
      } catch (error) {
        console.error('Session check error:', error);
      } finally {
        $scope.sessionChecked = true;
        $scope.$apply();
      }
    }

    // 页面加载时检查会话
    checkSession();

    // 添加：退出登录方法
    $scope.logout = async function() {
      try {
        await AuthService.logout();
        $scope.isLoggedIn = false;
        $scope.bookmarks = [];
        localStorage.removeItem('userId');
        $scope.$apply();
      } catch (error) {
        console.error('Logout error:', error);
      }
    };

    // 统一登录方法
    $scope.login = async function(event) {
      if (event) event.preventDefault();
      try {
        const { data, error } = await AuthService.login(
          $scope.username,
          $scope.password
        );

        if (error) throw error;

        localStorage.setItem('userId', data.user.id);

        // 调试日志：检查用户 ID
        console.log('User ID:', data.user.id);

        const { data: bookmarks, error: bookmarkError } = await BookmarkService.getBookmarks(data.user.id);

        // 调试日志：检查书签数据
        console.log('Bookmarks fetched from Supabase:', bookmarks);

        if (bookmarkError) throw bookmarkError;

        $scope.$apply(() => {
          $scope.bookmarks = bookmarks || []; // 确保书签数据为数组
          console.log('Bookmarks assigned to $scope:', $scope.bookmarks);

          $scope.isLoggedIn = true; // 更新登录状态
          $scope.isRegister = false; // 确保登录框消失
        });
      } 
      catch (error) {
        $scope.$apply(() => {
          $scope.message = error.message;
          console.error('Error during login or fetching bookmarks:', error);
        });
      }
    };

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