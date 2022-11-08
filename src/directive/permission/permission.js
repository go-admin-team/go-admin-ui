import { useUserStore } from '@/store/userInfo';

export default {
  checkPermission(el, binding) {
    const store = useUserStore();
    const { value } = binding;
    const all_permission = '*:*:*'
    const permissions = store.userInfo && store.userInfo.permissions;

    if (typeof value === 'string') {
      const hasPermission = permissions.some((permission) => {
        return all_permission === permission || value === permission;
      })
  
      if (!hasPermission) {
        el.parentNode && el.parentNode.removeChild(el);
      }
    } else {
      throw new Error(`请设置操作权限标签值`)
    }
  }
}