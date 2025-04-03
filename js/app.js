// 创建AngularJS应用
var app = angular.module('bookmarkApp', []);

// 定义新的服务端地址
const SERVER_URL = 'https://marks.111600.xyz';

// 创建认证控制器
app.controller('AuthController', ['$scope', '$http', function($scope, $http) {
    // 初始化变量
    $scope.username = '';
    $scope.password = '';
    $scope.message = '';
    $scope.isLoggedIn = false;
    $scope.bookmarks = [];

    // 替换原有的SERVER_URL配置
    const SUPABASE_URL = 'https://vfwrwhoqkifxlogoavod.supabase.co';
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmd3J3aG9xa2lmeGxvZ29hdm9kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM2ODc1NTYsImV4cCI6MjA1OTI2MzU1Nn0.HX_WGCy93SwmrIZjFOxf5Ma86jE3pNITIhZu-r6mbDI';
    // 问题：supabase变量未定义，需要先引入Supabase库
    // 修改index.html，在AngularJS库之后添加：
    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
    const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    
    // 修改登录函数
    // 当前错误处理可以更完善
    $scope.login = function() {
        if (!$scope.username || !$scope.password) {
            $scope.message = '邮箱和密码不能为空';
            return;
        }
        
        supabase.auth.signInWithPassword({
            email: $scope.username,
            password: $scope.password
        }).then(({ data, error }) => {
            if (error) {
                $scope.message = error.message || '登录失败，请检查邮箱和密码';
                $scope.$apply();
                return;
            }
            localStorage.setItem('userId', data.user.id);
            $scope.isLoggedIn = true;
            $scope.message = '';
            $scope.loadBookmarks(data.user.id);
            $scope.$apply();
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

// 当前登录逻辑使用username，但Supabase使用email
// 建议修改登录表单的placeholder：
<input type="text" ng-model="username" placeholder="邮箱" required>