import { createWebHashHistory, createRouter, createWebHistory } from 'vue-router';
import Layout from '../layout/index.vue';
import { useUserStore } from '../store/userInfo';
import { usePermissionStore } from '../store/permission';

const routes = [
  {
    path: '/',
    name: '/',
    redirect: 'admin',
    component: Layout,
    children: [
      {
        path: '/profile',
        name: 'profile',
        component: () => import('../views/profile/index.vue'),
        meta: {
          title: '个人设置',
        },
      },
      {
        path: '/403',
        name: '403',
        component: () => import('../views/error-page/403.vue'),
        meta: {
          title: '找不到页面',
        },
      },
      {
        hide: true,
        path: '/:catchAll(.*)',
        component: () => import('../views/error-page/404.vue'),
        meta: {
          title: '找不到页面',
        },
      },
      {
        path: '/500',
        name: '500',
        component: () => import('../views/error-page/500.vue'),
        meta: {
          title: '找不到页面',
        },
      },
    ]
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('../views/login/index.vue'),
  },
];

const router = createRouter({
  // createWebHashHistory URL 带井号
  // createWebHistory URL 去井号
  history: createWebHistory(),
  routes: routes,
});

// beforeEach router
router.beforeEach(async (to, from, next) => {
  const store = useUserStore();

  const permissionStore = usePermissionStore();

  // 获取系统配置信息
  await store.getSysConfig();

  // 判断用户Token是否获取
  if (to.name !== 'login' && !store.token) {
    next({ name: 'login' });
  } else {
    // 判断判断权限有无获取
    if (store.token && store.roles.length === 0) {
      store.getUserInfo();
      await permissionStore.getMenuRole();

      permissionStore.addRouters.forEach((route) => {
        router.addRoute('/', route);
      });
      // next(to.fullPath);
      // 如果 addRoute 并未完成，路由守卫会一层一层的执行执行，直到 addRoute 完成，找到对应的路由
      next({ ...to, replace: true })
    } else {
      next();
    }

  }
});

// afterEach Router
router.afterEach((to) => {
  const store = useUserStore();

  // 修改网页标题
  if (to.name !== 'login') {
    document.title = `${to.meta.title} - ${store.sysConfig.sys_app_name}`;
  } else {
    document.title = store.sysConfig.sys_app_name;
  }
});
export default router;
