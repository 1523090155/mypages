const getConfig = () => {
    const url = window.SUPABASE_URL;
    const key = window.SUPABASE_KEY;
    
    if (!url || !key || url.includes('__SUPABASE_URL__') || key.includes('__SUPABASE_KEY__')) {
        console.error('Supabase 配置无效');
        return null;
    }
    return { url, key };
};

var app = angular.module('bookmarkApp', []);

const supabaseClient = (() => {
    const config = getConfig();
    if (!config) return null;
    
    try {
        return supabase.createClient(config.url, config.key);
    } catch (error) {
        console.error('Supabase 客户端初始化失败:', error);
        return null;
    }
})();

// 统一服务定义
app.factory('AuthService', () => ({
    login: async (email, password) => {
        if (!supabaseClient) throw new Error('服务未初始化');
        return supabaseClient.auth.signInWithPassword({ email, password });
    },
    logout: async () => {
        if (!supabaseClient) throw new Error('服务未初始化');
        return supabaseClient.auth.signOut();
    },
    getUser: async () => {
        if (!supabaseClient) throw new Error('服务未初始化');
        return supabaseClient.auth.getUser();
    }
}));

app.factory('BookmarkService', () => ({
    getBookmarks: async (userId) => {
        if (!supabaseClient) throw new Error('服务未初始化');
        return supabaseClient.from('bookmarks')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
    }
}));

app.controller('AuthController', [
    '$scope',
    'AuthService',
    'BookmarkService',
    '$timeout',
    ($scope, AuthService, BookmarkService, $timeout) => {
        $scope.checkingConnection = true;
        $scope.sessionChecked = false;
        $scope.isLoggedIn = false;
        $scope.bookmarks = [];
        $scope.message = '';

        const safeApply = (fn) => {
            try {
                const phase = $scope.$root.$$phase;
                if (phase === '$apply' || phase === '$digest') {
                    if (fn && typeof fn === 'function') {
                        fn();
                    }
                } else {
                    $scope.$apply(fn);
                }
            } catch (e) {
                console.error('safeApply error:', e);
            }
        };

        const initialize = async () => {
            try {
                if (!supabaseClient) {
                    throw new Error('服务未初始化');
                }
                
                const config = getConfig();
                if (!config) {
                    throw new Error('配置无效');
                }

                safeApply(() => {
                    $scope.checkingConnection = false;
                });

                await checkSession();
            } catch (error) {
                console.error('初始化错误:', error);
                safeApply(() => {
                    $scope.message = error.message || '系统初始化失败';
                    $scope.checkingConnection = false;
                });
            }
        };

        const checkSession = async () => {
            try {
                const { data: { user }, error } = await AuthService.getUser();
                
                safeApply(() => {
                    if (user) {
                        $scope.isLoggedIn = true;
                        BookmarkService.getBookmarks(user.id)
                            .then(({ data: bookmarks }) => {
                                safeApply(() => {
                                    $scope.bookmarks = bookmarks || [];
                                });
                            });
                    } else {
                        $scope.isLoggedIn = false;
                        $scope.bookmarks = [];
                    }
                    $scope.sessionChecked = true;
                });
            } catch (error) {
                console.error('Session check error:', error);
                safeApply(() => {
                    $scope.isLoggedIn = false;
                    $scope.sessionChecked = true;
                    $scope.message = '会话检查失败';
                });
            }
        };

        $scope.login = async (event) => {
            event && event.preventDefault();
            
            if (!$scope.user?.email || !$scope.user?.password) {
                safeApply(() => {
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
            
                safeApply(() => {
                    $scope.isLoggedIn = true;
                    $scope.message = '';
                });

                const { data: bookmarks } = await BookmarkService.getBookmarks(data.user.id);
                safeApply(() => {
                    $scope.bookmarks = bookmarks || [];
                });
            } catch (error) {
                console.error('登录错误:', error);
                safeApply(() => {
                    $scope.message = error.message || '登录失败';
                });
            }
        };

        $scope.logout = async () => {
            try {
                await AuthService.logout();
                safeApply(() => {
                    $scope.isLoggedIn = false;
                    $scope.bookmarks = [];
                    $scope.message = '';
                });
            } catch (error) {
                console.error('退出错误:', error);
                safeApply(() => {
                    $scope.message = '退出失败';
                });
            }
        };

        initialize();

        // 定期检查会话
        const sessionCheckInterval = setInterval(() => {
            if ($scope.isLoggedIn) {
                checkSession();
            }
        }, 300000);

        $scope.$on('$destroy', () => {
            clearInterval(sessionCheckInterval);
        });
    }
]);
