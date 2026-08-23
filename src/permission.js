import router from './router'
import { useUserStore } from '@/stores/user'
import { usePermissionStore } from '@/stores/permission'
import { ElMessage } from 'element-plus'
import NProgress from 'nprogress' // progress bar
import 'nprogress/nprogress.css' // progress bar style
import { getToken } from '@/utils/auth' // get token from cookie
import getPageTitle from '@/utils/get-page-title'
import { trackPageView } from '@/utils/analytics'

NProgress.configure({ showSpinner: false }) // NProgress Configuration

const whiteList = ['/login', '/auth-redirect'] // no redirect whitelist

router.beforeEach(async(to, from, next) => {
  // start progress bar
  NProgress.start()

  // set page title
  document.title = getPageTitle(to.meta.title)

  // determine whether the user has logged in
  const hasToken = getToken()

  if (hasToken) {
    if (to.path === '/login') {
      // if is logged in, redirect to the home page
      next({ path: '/' })
      NProgress.done()
    } else {
      // determine whether the user has obtained his permission roles through getInfo
      const hasRoles = useUserStore().roles.length > 0
      if (hasRoles) {
        next()
      } else {
        try {
          // get user info; roles land on the store rather than being threaded
          // through, since generateRoutes reads the menu the backend already
          // filtered for this user
          await useUserStore().getInfo()

          // generate accessible routes map based on roles
          const accessRoutes = await usePermissionStore().generateRoutes()

          // dynamically add accessible routes
          accessRoutes.forEach(route => router.addRoute(route))

          // hack method to ensure that addRoutes is complete
          // set the replace: true, so the navigation will not leave a history record
          next({ ...to, replace: true })
        } catch(error) {
          // remove token and go to login page to re-login
          // await store.dispatch('user/resetToken')
          // Only report what nobody has reported yet. An HTTP failure here has
          // already produced a toast from the response interceptor; the one
          // failure this catch knows about on its own is a client-side throw,
          // such as getInfo's "roles must be a non-null array".
          //
          // The message is read off `.message` rather than passed as the error:
          // ElMessage treats a non-string argument as its options bag, and an
          // Error's `message` is non-enumerable, so the toast came out empty.
          if (!error?.reported) {
            ElMessage.error(error?.message || 'Has Error')
          }
          next(`/login?redirect=${to.path}`)
          NProgress.done()
        }
      }
    }
  } else {
    /* has no token*/

    if (whiteList.indexOf(to.path) !== -1) {
      // in the free login whitelist, go directly
      next()
    } else {
      // other pages that do not have permission to access are redirected to the login page.
      next(`/login?redirect=${to.path}`)
      NProgress.done()
    }
  }
})

router.afterEach((to, from, failure) => {
  // finish progress bar
  NProgress.done()

  // Report the page view here rather than from the tag, which cannot see a
  // route change. afterEach runs for every navigation the guard above lets
  // through, the login page included, and runs after the guard has set
  // document.title -- so the title reported is the one the user is looking at.
  //
  // A failed navigation is not a page view. The case that reaches this is
  // clicking the sidebar entry for the page you are already on: vue-router
  // answers that with a duplicated-navigation failure, nothing on screen
  // changes, and counting it would put whichever page a user sits on at the top
  // of every report. (A redirect from the guard above does not reach here at
  // all -- vue-router runs afterEach for the navigation that wins, not for the
  // one it replaced.)
  if (!failure) {
    trackPageView(to.fullPath)
  }
})
