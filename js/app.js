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
    // 修改会话检查逻辑
    const checkSession = async () => {
      try {
        const { data: { user }, error } = await AuthService.getUser(); // 添加错误捕获
        
        if (error) throw error;  // 新增错误处理
        
        if (user) {
          $scope.isLoggedIn = true;
          await loadBookmarks(user.id); // 添加await确保加载完成
        }
      } catch (error) {
        console.error('会话检查失败:', error); // 新增错误日志
        $scope.message = '会话验证异常，请刷新页面';
      } finally {
        $scope.sessionChecked = true;
        $scope.$apply();  // 确保执行位置正确
      }
    };
    
    // 在控制器初始化部分下方添加超时处理
    setTimeout(() => {
      if (!$scope.sessionChecked) {
        $scope.sessionChecked = true;
        $scope.message = '会话验证超时，请检查网络';
        $scope.$apply();
      }
    }, 5000); // 5秒超时机制
    
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
        $scope.$apply(); // 移除非法HTML注释
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