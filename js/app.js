// 创建AngularJS应用
// 创建认证控制器
// 建议将Supabase配置移到模块顶部
var app = angular.module('bookmarkApp', []);
const SUPABASE_URL = 'https://vfwrwhoqkifxlogoavod.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmd3J3aG9xa2lmeGxvZ29hdm9kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM2ODc1NTYsImV4cCI6MjA1OTI2MzU1Nn0.HX_WGCy93SwmrIZjFOxf5Ma86jE3pNITIhZu-r6mbDI';
// 修改supabase初始化配置
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    flowType: 'pkce',
    redirectTo: null  // 明确设置为null防止任何重定向
  }
});

// 然后控制器中可以直接使用supabase变量
app.controller('AuthController', ['$scope', '$http', function($scope, $http) {
    // 初始化变量
    $scope.username = '';
    $scope.password = '';
    $scope.message = '';
    $scope.isLoggedIn = false;
    $scope.bookmarks = [];

    // 修改登录函数
    // 当前错误处理可以更完善
    $scope.login = function(event) {  // 添加event参数
        if (!$scope.username || !$scope.password) {
            $scope.message = '邮箱和密码不能为空';
            return;
        }
        
        if(event) event.preventDefault();  // 安全地阻止默认行为
        
        supabase.auth.signInWithPassword({
            email: $scope.username,
            password: $scope.password
        }).then(({ data, error }) => {
            if (error) {
                $scope.message = error.message || '登录失败，请检查邮箱和密码';
                $scope.$apply();
                return;
            }
            
            // 手动处理登录成功逻辑
            localStorage.setItem('userId', data.user.id);
            $scope.isLoggedIn = true;
            $scope.message = '';
            $scope.loadBookmarks(data.user.id);
            $scope.$apply();
            
            // 可选：手动导航到主页
            // window.location.hash = '/home';
        });
    };
    
    // 修改书签加载函数
    $scope.loadBookmarks = function(userId) {
        supabase.from('bookmarks')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false }) // 添加排序
            .then(({ data, error }) => {
                if (error) {
                    console.error('加载书签失败:', error);
                    $scope.message = '无法加载书签: ' + (error.message || '服务器错误');
                    $scope.$apply();
                    return;
                }
                $scope.bookmarks = data || []; // 确保总是数组
                $scope.$apply();
            });
    };
    
    // 修改登出函数
    $scope.logout = function() {
        supabase.auth.signOut()
            .then(() => {
                localStorage.removeItem('userId');
                $scope.isLoggedIn = false;
                $scope.username = '';
                $scope.password = '';
                $scope.message = '';
                $scope.bookmarks = [];
                $scope.$apply();
                alert('已成功登出');
            });
    };

    // 页面加载时检查登录状态
    var userId = localStorage.getItem('userId');
    if (userId) {
        $scope.isLoggedIn = true;
        $scope.loadBookmarks(userId);
    }
}]);


// 可以考虑将Supabase相关操作封装成服务
app.factory('BookmarkService', function() {
    return {
        getBookmarks: function(userId) {
            return supabase.from('bookmarks')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });
        },
        // 其他Supabase操作方法...
    };
});

// 然后在控制器中注入使用
app.controller('AuthController', ['$scope', 'BookmarkService', 
function($scope, BookmarkService) {
    // 使用BookmarkService.getBookmarks()...
}]);