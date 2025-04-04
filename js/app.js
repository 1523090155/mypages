var app = angular.module('bookmarkApp', []);

// Supabase 配置
const SUPABASE_URL = 'https://vfwrwhoqkifxlogoavod.supabase.co';
const SUPABASE_KEY = 'eyJhbGci...'; // 保持您的原始密钥
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    flowType: 'pkce',
    redirectTo: null
  }
});

// 认证服务
app.factory('AuthService', () => ({
  login: (email, password) => supabase.auth.signInWithPassword({ email, password }),
  register: (email, password) => supabase.auth.signUp({ email, password }),
  logout: () => supabase.auth.signOut(),
  getUser: () => supabase.auth.getUser(),
  resetPassword: (email) => supabase.auth.resetPasswordForEmail(email)
}));

// 书签服务
app.factory('BookmarkService', () => ({
  getBookmarks: (userId) => supabase.from('bookmarks')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false }),
  addBookmark: (bookmark) => supabase.from('bookmarks').insert(bookmark)
}));

// 认证控制器
app.controller('AuthController', [
  '$scope', 
  'AuthService',
  'BookmarkService',
  ($scope, AuthService, BookmarkService) => {
    // 初始化状态
    $scope.sessionChecked = false;
    $scope.isLoggedIn = false;
    $scope.authType = 'login';
    $scope.bookmarks = [];
    
    // 会话检查
    const checkSession = async () => {
      try {
        const { data: { user } } = await AuthService.getUser();
        if (user) {
          $scope.isLoggedIn = true;
          loadBookmarks(user.id);
        }
      } finally {
        $scope.sessionChecked = true;
        $scope.$apply();
      }
    };

    // 加载书签
    const loadBookmarks = async (userId) => {
      const { data } = await BookmarkService.getBookmarks(userId);
      $scope.bookmarks = data;
      $scope.$apply();
    };

    // 登录/注册
    $scope.handleAuth = async () => {
      try {
        const { data, error } = $scope.authType === 'login' 
          ? await AuthService.login($scope.username, $scope.password)
          : await AuthService.register($scope.username, $scope.password);

        if (error) throw error;
        
        localStorage.setItem('userId', data.user.id);
        await loadBookmarks(data.user.id);
        $scope.isLoggedIn = true;
        $scope.message = $scope.authType === 'login' ? '登录成功' : '注册成功，请查收验证邮件';
      } catch (error) {
        $scope.message = error.message;
      } finally {
        $scope.$apply();
      }
    };

    // 密码重置
    $scope.resetPassword = async () => {
      try {
        const { error } = await AuthService.resetPassword($scope.username);
        $scope.message = error?.message || '重置邮件已发送，请查收';
      } finally {
        $scope.$apply();
      }
    };

    // 登出
    $scope.logout = async () => {
      await AuthService.logout();
      localStorage.removeItem('userId');
      $scope.isLoggedIn = false;
      $scope.bookmarks = [];
      $scope.$apply();
    };

    // 初始化
    checkSession();
  }
]);