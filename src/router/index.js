import { createWebHashHistory, createRouter } from 'vue-router';
import Layout from '../layout/index.vue';
import { useUserStore } from '../store/userInfo';
import { usePermissionStore } from '../store/permission';

const routes = [
  {
    path: '/',
    name: '/',
    redirect: 'admin',
    component: Layout,
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('../views/login/index.vue'),
  },
  {
    path: '/404',
    name: '404',
    component: () => import('../views/error-page/404.vue'),
  },
  {
    path: '/profile',
    name: 'profile',
    component: () => import('../views/profile/index.vue'),
    meta: {
      name: '个人信息',
    },
  },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
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
      next(to.fullPath);
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
    document.title = `${to.meta.title}-${store.sysConfig.sys_app_title}`;
  } else {
    document.title = store.sysConfig.sys_app_title;
  }
});
export default router;
