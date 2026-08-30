<template>
  <div class="drawer-container">
    <div>
      <div class="setting-drawer-content">
        <div class="setting-drawer-title">
          {{ $t('layout.settings.title') }}
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
          {{ $t('layout.settings.theme') }}
        </div>
        <div class="drawer-item">
          <span>{{ $t('layout.settings.themeColor') }}</span>
          <theme-picker style="float: right;height: 26px;margin: -3px 8px 0 0;" @change="themeChange" />
        </div>

        <!-- 明暗配色。与上面的「侧栏风格」是两个维度：这里决定整个界面，
             那里只决定侧栏那一条。跟随系统是默认值，也是唯一会随系统变的选项。 -->
        <div class="drawer-item">
          <span>{{ $t('layout.settings.colorScheme') }}</span>
          <el-radio-group v-model="colorScheme" size="small" class="drawer-color-scheme">
            <el-radio-button value="system">{{ $t('layout.settings.system') }}</el-radio-button>
            <el-radio-button value="light">{{ $t('layout.settings.light') }}</el-radio-button>
            <el-radio-button value="dark">{{ $t('layout.settings.dark') }}</el-radio-button>
          </el-radio-group>
        </div>
      </div>
      <el-divider />
      <div class="setting-drawer-content">
        <div class="setting-drawer-title">
          {{ $t('layout.settings.layout') }}
        </div>

        <div class="drawer-item">
          <span>{{ $t('layout.settings.topNav') }}</span>
          <el-switch v-model="topNav" class="drawer-switch" />
        </div>

        <div class="drawer-item">
          <span>{{ $t('layout.settings.tagsView') }}</span>
          <el-switch v-model="tagsView" :active-color="activeColor" class="drawer-switch" />
        </div>

        <div class="drawer-item">
          <span>{{ $t('layout.settings.fixedHeader') }}</span>
          <el-switch v-model="fixedHeader" :active-color="activeColor" class="drawer-switch" />
        </div>

        <div class="drawer-item">
          <span>{{ $t('layout.settings.sidebarLogo') }}</span>
          <el-switch v-model="sidebarLogo" :active-color="activeColor" class="drawer-switch" />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState } from 'pinia'
import ThemePicker from '@/components/ThemePicker'
import { useSettingsStore } from '@/stores/settings'
import { usePermissionStore } from '@/stores/permission'

/**
 * Two-way binding for one setting. Writes go through changeSetting rather than
 * assigning to state directly, preserving the guard that ignores unknown keys.
 */
const settingModel = key => ({
  get() {
    return useSettingsStore()[key]
  },
  set(value) {
    useSettingsStore().changeSetting({ key, value })
  }
})

export default {
  components: { ThemePicker },
  data() {
    return {
      activeColor: useSettingsStore().theme
    }
  },
  computed: {
    ...mapState(useSettingsStore, ['theme', 'themeStyle']),
    fixedHeader: settingModel('fixedHeader'),
    tagsView: settingModel('tagsView'),
    sidebarLogo: settingModel('sidebarLogo'),
    colorScheme: settingModel('colorScheme'),
    topNav: {
      get() {
        return useSettingsStore().topNav
      },
      set(val) {
        useSettingsStore().changeSetting({ key: 'topNav', value: val })
        if (!val) {
          const permission = usePermissionStore()
          permission.setSidebarRouters(permission.defaultRoutes)
        }
      }
    }
  },
  methods: {
    themeChange(val) {
      this.activeColor = val
      useSettingsStore().changeSetting({ key: 'theme', value: val })
    },
    handleTheme(val) {
      useSettingsStore().changeSetting({ key: 'themeStyle', value: val })
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
    color: var(--ga-text-1);
    font-size: 14px;
    line-height: 22px;
  }

  .drawer-item {
    color: var(--ga-text-2);
    font-size: 14px;
    padding: 12px 0;
  }

  .drawer-switch {
    float: right
  }

  // The three-way control is wider than a switch, so it goes on its own line
  // rather than being crushed against the label at 300px of drawer.
  .drawer-color-scheme {
    display: flex;
    margin-top: 8px;
  }
}
.setting-drawer-content{
  .setting-drawer-title{
    margin-bottom: 12px;
    color: var(--ga-text-1);
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
            color: var(--ga-brand);
            font-weight: 700;
            font-size: 14px;
        }
    }
  }
}
</style>
