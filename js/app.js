// 从构建环境变量读取配置
try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;

    if (!supabaseUrl || !supabaseKey) {
        throw new Error('缺少Supabase配置参数 - 请在构建时设置VITE_SUPABASE_URL和VITE_SUPABASE_KEY');
    }

    console.log('Supabase配置检查:', {
        url: supabaseUrl ? '已设置 ✓' : '未设置 ×',
        key: supabaseKey ? '已设置 ✓' : '未设置 ×'
    });

    // 初始化supabase客户端
    const { createClient } = supabase;
    const supabaseClient = createClient(supabaseUrl, supabaseKey);

    var app = angular.module('bookmarkApp', []);

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
          supabaseClient.auth.signInWithOAuth({ provider })
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
} catch (error) {
    console.error('Supabase初始化错误:', error.message);
    throw error;
}