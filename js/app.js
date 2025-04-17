var app = angular.module('bookmarkApp', []);

// 更新为 Worker 代理配置
const WORKER_URL = 'https://base.111600.xyz';
const supabaseClient = supabase.createClient(WORKER_URL, 'dummy-key', {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
    flowType: 'pkce',
    redirectTo: 'https://my.111600.xyz'  // 确保与前端域名一致
  },
  global: {
    headers: {
      'X-Custom-Origin': window.location.hostname
    }
  }
})

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
    .then(({ data, error }) => {
      if (error) throw error;
      return { data, error };
    })
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

    // 修改后的检查会话方法
    async function checkSession() {
      try {
        const { data: { user }, error } = await AuthService.getUser();
        if (user) {
          $scope.isLoggedIn = true;
          const { data: bookmarks, error: bookmarkError } = await BookmarkService.getBookmarks(user.id);
          if (bookmarkError) throw bookmarkError;
          $scope.bookmarks = bookmarks || [];
          console.log('获取到的书签数据:', bookmarks); // 添加调试日志
        }
      } catch (error) {
        console.error('检查会话错误:', error);
      } finally {
        $scope.sessionChecked = true;
        $scope.$apply();
      }
    }

    // 修改后的登录方法
    $scope.login = async function(event) {
      if (event) event.preventDefault();
      if (!$scope.username || !$scope.password) {
        return $scope.message = '请输入邮箱和密码';
      }
      try {
        const { data, error } = await AuthService.login($scope.username, $scope.password);
        if (error) throw error;
        
        console.log('登录成功，用户ID:', data.user.id); // 调试日志
        
        const { data: bookmarks, error: bookmarkError } = await BookmarkService.getBookmarks(data.user.id);
        if (bookmarkError) throw bookmarkError;
        
        console.log('获取到的书签数据:', bookmarks); // 调试日志
        
        $scope.$apply(() => {
          $scope.bookmarks = bookmarks || [];
          $scope.isLoggedIn = true;
          $scope.message = '';
        });
      } catch (error) {
        $scope.$apply(() => {
          $scope.message = error.message;
          console.error('登录或获取书签错误:', error);
        });
      }
    };
    
    // 添加会话过期检查
    // 可以添加心跳检测或定时检查会话状态
    setInterval(() => {
      if($scope.isLoggedIn) checkSession();
    }, 300000); // 每5分钟检查一次
    async function checkSession() {
      try {
        const { data: { user }, error } = await AuthService.getUser();
        if (user && $scope.sessionExpiresAt && Date.now() < $scope.sessionExpiresAt) {
          $scope.isLoggedIn = true;
          const { data: bookmarks } = await BookmarkService.getBookmarks(user.id);
          $scope.bookmarks = bookmarks || [];
        } else {
          await AuthService.logout();
          $scope.isLoggedIn = false;
          $scope.bookmarks = [];
        }
      } catch (error) {
        console.error('Session check error:', error);
      } finally {
        $scope.sessionChecked = true;
        $scope.$apply();
      }
    }

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
