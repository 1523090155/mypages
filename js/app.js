var app = angular.module('bookmarkApp', []);

// 从环境变量获取配置
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_KEY || '';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
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
        if (user && $scope.sessionExpiresAt && Date.now() < $scope.sessionExpiresAt) {
          $scope.isLoggedIn = true;
          const { data: bookmarks } = await BookmarkService.getBookmarks(user.id);
          $scope.bookmarks = bookmarks || [];
        } else {
          await AuthService.logout();
          $scope.$apply(() => {
              $scope.isLoggedIn = false;
              $scope.bookmarks = [];
              $scope.message = ''; // 清空消息
          });
        }
      } catch (error) {
        console.error('Session check error:', error);
      } finally {
        $scope.$apply(() => {
            $scope.sessionChecked = true;
        });
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
    // 修改登录方法，添加会话过期时间
    // 可以在登录前添加表单验证
    $scope.login = async function(event) {
      event.preventDefault(); // 阻止默认表单提交行为
      
      if (!$scope.user || !$scope.user.email || !$scope.user.password) {
          $scope.$apply(() => {
              $scope.message = '请输入邮箱和密码';
          });
          return;
      }

      try {
          const { data, error } = await AuthService.login(
              $scope.user.email,
              $scope.user.password
          );
      
          if (error) throw error;
      
          const expiresAt = Date.now() + 3600000;
          const { data: bookmarks } = await BookmarkService.getBookmarks(data.user.id);
      
          $scope.$apply(() => {
              $scope.bookmarks = bookmarks || [];
              $scope.isLoggedIn = true;
              $scope.sessionExpiresAt = expiresAt;
              $scope.message = ''; // 登录成功后清空消息
          });
      } catch (error) {
          $scope.$apply(() => {
              $scope.message = error.message || '登录失败';
              console.error('登录错误:', error);
          });
      }
    };
    
    // 添加会话过期检查
    // 可以添加心跳检测或定时检查会话状态
    setInterval(() => {
      if($scope.isLoggedIn) checkSession();
    }, 300000); // 每5分钟检查一次

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
