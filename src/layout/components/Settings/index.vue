<template>
  <div class="drawer-container">
    <div>
      <div class="setting-drawer-content">
        <div class="setting-drawer-title">
          页面设置
        </div>
        <div class="setting-drawer-block-checbox">
          <div class="setting-drawer-block-checbox-item" @click="handleTheme('light')">
            <img src="@/assets/light.svg" alt="light">
            <div v-if="themeStyle === 'light'" class="setting-drawer-block-checbox-selectIcon" style="display: block;">
              <i aria-label="图标: check" class="anticon anticon-check">
                <svg viewBox="64 64 896 896" data-icon="check" width="1em" height="1em" :fill="theme" aria-hidden="true" focusable="false" class=""><path d="M912 190h-69.9c-9.8 0-19.1 4.5-25.1 12.2L404.7 724.5 207 474a32 32 0 0 0-25.1-12.2H112c-6.7 0-10.4 7.7-6.3 12.9l273.9 347c12.8 16.2 37.4 16.2 50.3 0l488.4-618.9c4.1-5.1.4-12.8-6.3-12.8z" />
                </svg>
              </i>
            </div>
          </div>
          <div class="setting-drawer-block-checbox-item" @click="handleTheme('dark')">
            <img src="@/assets/dark.svg" alt="dark">
            <div v-if="themeStyle === 'dark'" class="setting-drawer-block-checbox-selectIcon" style="display: block;">
              <i aria-label="图标: check" class="anticon anticon-check">
                <svg viewBox="64 64 896 896" data-icon="check" width="1em" height="1em" :fill="theme" aria-hidden="true" focusable="false" class=""><path d="M912 190h-69.9c-9.8 0-19.1 4.5-25.1 12.2L404.7 724.5 207 474a32 32 0 0 0-25.1-12.2H112c-6.7 0-10.4 7.7-6.3 12.9l273.9 347c12.8 16.2 37.4 16.2 50.3 0l488.4-618.9c4.1-5.1.4-12.8-6.3-12.8z" />
                </svg>
              </i>
            </div>
          </div>
        </div>
      </div>
      <el-divider />
      <div class="setting-drawer-content">
        <div class="setting-drawer-title">
          主题设置
        </div>
        <div class="drawer-item">
          <span>主题颜色</span>
          <theme-picker style="float: right;height: 26px;margin: -3px 8px 0 0;" @change="themeChange" />
        </div>
      </div>
      <el-divider />
      <div class="setting-drawer-content">
        <div class="setting-drawer-title">
          布局设置
        </div>

        <div class="drawer-item">
          <span>开启 TopNav</span>
          <el-switch v-model="topNav" class="drawer-switch" />
        </div>

        <div class="drawer-item">
          <span>开启任务栏</span>
          <el-switch v-model="tagsView" :active-color="activeColor" class="drawer-switch" />
        </div>

        <div class="drawer-item">
          <span>Header 固定</span>
          <el-switch v-model="fixedHeader" :active-color="activeColor" class="drawer-switch" />
        </div>

        <div class="drawer-item">
          <span>侧边栏Logo</span>
          <el-switch v-model="sidebarLogo" :active-color="activeColor" class="drawer-switch" />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import ThemePicker from '@/components/ThemePicker'

export default {
  components: { ThemePicker },
  data() {
    return {
      activeColor: this.$store.state.settings.theme
    }
  },
  computed: {
    theme() {
      return this.$store.state.settings.theme
    },
    themeStyle() {
      return this.$store.state.settings.themeStyle
    },
    fixedHeader: {
      get() {
        return this.$store.state.settings.fixedHeader
      },
      set(val) {
        this.$store.dispatch('settings/changeSetting', {
          key: 'fixedHeader',
          value: val
        })
      }
    },
    topNav: {
      get() {
        return this.$store.state.settings.topNav
      },
      set(val) {
        this.$store.dispatch('settings/changeSetting', {
          key: 'topNav',
          value: val
        })
        if (!val) {
          this.$store.commit('permission/SET_SIDEBAR_ROUTERS', this.$store.state.permission.defaultRoutes)
        }
      }
    },
    tagsView: {
      get() {
        return this.$store.state.settings.tagsView
      },
      set(val) {
        this.$store.dispatch('settings/changeSetting', {
          key: 'tagsView',
          value: val
        })
      }
    },
    sidebarLogo: {
      get() {
        return this.$store.state.settings.sidebarLogo
      },
      set(val) {
        this.$store.dispatch('settings/changeSetting', {
          key: 'sidebarLogo',
          value: val
        })
      }
    }
  },
  methods: {
    themeChange(val) {
      this.activeColor = val
      this.$store.dispatch('settings/changeSetting', {
        key: 'theme',
        value: val
      })
    },
    handleTheme(val) {
      this.$store.dispatch('settings/changeSetting', {
        key: 'themeStyle',
        value: val
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.drawer-container {
  padding: 24px;
  font-size: 14px;
  line-height: 1.5;
  word-wrap: break-word;

  .drawer-title {
    margin-bottom: 12px;
    color: rgba(0, 0, 0, .85);
    font-size: 14px;
    line-height: 22px;
  }

  .drawer-item {
    color: rgba(0, 0, 0, .65);
    font-size: 14px;
    padding: 12px 0;
  }

  .drawer-switch {
    float: right
  }
}
.setting-drawer-content{
  .setting-drawer-title{
    margin-bottom: 12px;
    color: rgba(0,0,0,.85);
    font-size: 14px;
    line-height: 22px;
    font-weight: bold;
  }
  .setting-drawer-block-checbox{
    display: flex;
    justify-content: flex-start;
    align-items: center;
    .setting-drawer-block-checbox-item {
        position: relative;
        margin-right: 16px;
        border-radius: 2px;
        cursor: pointer;
        img{
          width: 48px;
          height: 48px;
        }
        .setting-drawer-block-checbox-selectIcon{
            position: absolute;
            top: 0;
            right: 0;
            width: 100%;
            height: 100%;
            padding-top: 15px;
            padding-left: 24px;
            color: #1890ff;
            font-weight: 700;
            font-size: 14px;
        }
    }
  }
}
</style>
