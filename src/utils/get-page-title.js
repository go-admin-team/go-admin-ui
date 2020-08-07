import storage from '@/utils/storage'

export default function getPageTitle(pageTitle) {
  const app_info = storage.get('app_info')
  const title = app_info ? app_info.name : 'go-admin 后台管理系统'
  if (pageTitle) {
    return `${pageTitle} - ${title}`
  }
  return `${title}`
}
