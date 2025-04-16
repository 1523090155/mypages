var app = angular.module('bookmarkApp', []);


// 从配置文件获取 Supabase 配置
const SUPABASE_URL = window.__SUPABASE_CONFIG__?.url;
const SUPABASE_KEY = window.__SUPABASE_CONFIG__?.key;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Supabase配置不完整', { SUPABASE_URL, SUPABASE_KEY });
  throw new Error('Supabase URL或KEY未配置');
}

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
        flowType: 'pkce',
        redirectTo: window.location.origin
    }
});

const checkConnection = async () => {
    try {
        const response = await fetch(SUPABASE_URL, { method: 'HEAD' });
        return response.ok;
    } catch (e) {
        return false;
    }
};

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
    $scope.checkingConnection = true;

    const initialize = async () => {
        try {
            $scope.checkingConnection = true;
            const isConnected = await checkConnection();
            
            if (!isConnected) {
                $scope.$apply(() => {
                    $scope.message = '连接服务器失败，请检查网络';
                    $scope.checkingConnection = false;
                });
                return;
            }

            await checkSession();
        } catch (error) {
            console.error('初始化错误:', error);
            $scope.$apply(() => {
                $scope.message = '系统初始化失败，请刷新页面重试';
            });
        } finally {
            $scope.$apply(() => {
                $scope.checkingConnection = false;
            });
        }
    };

    initialize();

    // 初始化状态
    $scope.sessionChecked = false;  // 确保已初始化
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
        console.log('登录按钮被点击'); // 调试日志
        event && event.preventDefault();
        
        if (!$scope.user || !$scope.user.email || !$scope.user.password) {
            console.log('缺少邮箱或密码'); // 调试日志
            $scope.$apply(() => {
                $scope.message = '请输入邮箱和密码';
            });
            return;
        }
    
        try {
            console.log('正在发送登录请求', $scope.user.email); // 调试日志
            const { data, error } = await AuthService.login(
                $scope.user.email,
                $scope.user.password
            );
        
            if (error) throw error;
            console.log('登录成功', data); // 调试日志
        
            const expiresAt = Date.now() + 3600000;
            const { data: bookmarks } = await BookmarkService.getBookmarks(data.user.id);
        
            $scope.$apply(() => {
                $scope.bookmarks = bookmarks || [];
                $scope.isLoggedIn = true;
                $scope.sessionExpiresAt = expiresAt;
                $scope.message = '';
            });
        } catch (error) {
            console.error('登录错误:', error); // 调试日志
            $scope.$apply(() => {
                $scope.message = error.message || '登录失败';
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
