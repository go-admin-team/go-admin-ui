<template>
  <!-- Element Plus reads its own locale from an injected config, so its date
       picker, pagination and empty states only follow a language change when
       the app is wrapped like this. Passing `locale` to app.use(ElementPlus)
       fixes it at boot instead. -->
  <el-config-provider :locale="elementLocale">
    <div id="app">
      <router-view />
    </div>
  </el-config-provider>
</template>

<script>
import { elementLocale } from '@/lang'

export default {
  name: 'App',
  setup() {
    return { elementLocale }
  },
  mounted() {
    // 声明: 百度统计统计相关下载使用量无别的用途
    // 可自行删除
    var _hmt = _hmt || []
    ;(function() {
      var hm = document.createElement('script')
      hm.src = 'https://hm.baidu.com/hm.js?1d2d61263f13e4b288c8da19ad3ff56d'
      var s = document.getElementsByTagName('script')[0]
      s.parentNode.insertBefore(hm, s)
    })()
  }
}
</script>

