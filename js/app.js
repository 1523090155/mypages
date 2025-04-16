
// 移除import语句
var app = angular.module('bookmarkApp', []);

// 使用全局Supabase变量
const supabaseUrl = window.SUPABASE_URL;
const supabaseKey = window.SUPABASE_KEY;

// 添加详细的配置检查
if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase配置错误:');
  console.error('SUPABASE_URL:', supabaseUrl);
  console.error('SUPABASE_KEY:', supabaseKey ? '已设置(隐藏)' : '未设置');
  throw new Error('缺少Supabase配置参数 - 请在HTML中通过window.SUPABASE_URL和window.SUPABASE_KEY设置');
}

// 检查URL格式
if (!supabaseUrl.startsWith('http')) {
  console.warn('Supabase URL格式可能不正确:', supabaseUrl);
}

// 检查KEY长度
if (supabaseKey.length < 30) {
  console.warn('Supabase KEY长度异常:', supabaseKey.length);
}

const supabase = supabase.createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: true,
    detectSessionInUrl: false,
    flowType: 'pkce',
    redirectTo: null
  }
});

app.factory('AuthService', () => ({
  login: (email, password) => supabase.auth.signInWithPassword({ email, password }),
  logout: () => supabase.auth.signOut(),
  getUser: () => supabase.auth.getUser()
}));

app.factory('BookmarkService', () => ({
  getBookmarks: (userId) => supabase.from('bookmarks')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
}));

app.controller('AuthController', [
  '$scope',
  'AuthService',
  'BookmarkService',
  ($scope, AuthService, BookmarkService) => {
    if (!AuthService || !BookmarkService) {
      console.error('服务初始化失败');
      $scope.message = '系统初始化错误';
      return;
    }

    $scope.sessionChecked = false;
    $scope.isLoggedIn = false;
    $scope.bookmarks = [];

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

    checkSession();

    setInterval(() => {
      if($scope.isLoggedIn) checkSession();
    }, 300000);

    $scope.login = async function(event) {
      event.preventDefault(); // 阻止表单默认提交行为
      event.stopPropagation(); // 阻止事件冒泡
      
      if (!$scope.username || !$scope.password) {
        return $scope.message = '请输入邮箱和密码';
      }
      
      try {
        const { data, error } = await AuthService.login($scope.username, $scope.password);
        if (error) throw error;
        
        const expiresAt = Date.now() + 3600000;
        const { data: bookmarks, error: bookmarkError } = await BookmarkService.getBookmarks(data.user.id);
        
        if (bookmarkError) throw bookmarkError;
        
        $scope.$apply(() => {
          $scope.bookmarks = bookmarks || [];
          $scope.isLoggedIn = true;
          $scope.isRegister = false;
          $scope.sessionExpiresAt = expiresAt;
        });
      } catch (error) {
        $scope.$apply(() => {
          $scope.message = error.message;
        });
      }
    };

    $scope.logout = async function() {
      try {
        await AuthService.logout();
        $scope.isLoggedIn = false;
        $scope.bookmarks = [];
        $scope.$apply();
      } catch (error) {
        console.error('Logout error:', error);
      }
    };

    $scope.showRegister = function() {
      $scope.isRegister = true;
      $scope.message = '';
    };

    $scope.loginWith = function(provider) {
      supabase.auth.signInWithOAuth({ provider })
        .then(({ error }) => {
          if (error) $scope.message = error.message;
          $scope.$apply();
        })
        .catch(err => {
          console.error('OAuth error:', err);
          $scope.message = 'OAuth登录失败';
          $scope.$apply();
        });
    };
  }
]);