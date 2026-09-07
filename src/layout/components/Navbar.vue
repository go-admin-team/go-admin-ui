<template>
  <div class="navbar">
    <hamburger id="hamburger-container" :is-active="sidebar.opened" class="hamburger-container" @toggle-click="toggleSideBar" />

    <breadcrumb v-if="!topNav" id="breadcrumb-container" class="breadcrumb-container" />
    <top-nav v-if="topNav" id="topmenu-container" class="breadcrumb-container" />

    <div class="right-menu">
      <template v-if="device!=='mobile'">
        <header-search id="header-search" class="right-menu-item" />

        <screenfull id="screenfull" class="right-menu-item hover-effect" />

        <settings-trigger
          v-if="showSettings"
          id="layout-settings"
          class="right-menu-item hover-effect"
          @click="$emit('open-settings')"
        />

      </template>

      <lang-select id="lang-select" class="right-menu-item hover-effect" />

      <el-dropdown class="avatar-container right-menu-item hover-effect" trigger="hover">
        <div class="avatar-wrapper">
          <img :src="avatar+'?imageView2/1/w/80/h/80'" class="user-avatar">
          <i class="ri-arrow-down-s-fill" />
        </div>
        <template #dropdown>
          <el-dropdown-menu>
            <router-link to="/profile/index">
              <el-dropdown-item>{{ $t('route.profile') }}</el-dropdown-item>
            </router-link>
            <el-dropdown-item divided>
              <span style="display:block;" @click="logout">{{ $t('layout.logout') }}</span>
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </div>
</template>

<script>
import { mapState } from 'pinia'
import { useSettingsStore } from '@/stores/settings'
import { useAppStore } from '@/stores/app'
import { useUserStore } from '@/stores/user'
import Breadcrumb from '@/components/Breadcrumb'
import TopNav from '@/components/TopNav'
import Hamburger from '@/components/Hamburger'
import Screenfull from '@/components/Screenfull'
import HeaderSearch from '@/components/HeaderSearch'
import SettingsTrigger from '@/components/SettingsTrigger'
import LangSelect from '@/components/LangSelect'

export default {
  components: {
    Breadcrumb,
    TopNav,
    Hamburger,
    Screenfull,
    HeaderSearch,
    SettingsTrigger,
    LangSelect
  },
  // The layout owns the drawer's open state; the navbar only asks for it
  emits: ['open-settings'],
  computed: {
    ...mapState(useUserStore, ['avatar']),
    ...mapState(useAppStore, ['sidebar', 'device']),
    ...mapState(useSettingsStore, ['topNav', 'showSettings']),
    setting: {
      get() {
        return useSettingsStore().showSettings
      },
      set(val) {
        useSettingsStore().changeSetting({ key: 'showSettings', value: val })
      }
    }
  },
  methods: {
    toggleSideBar() {
      useAppStore().toggleSideBar()
    },
    async logout() {
      this.$confirm(this.$t('layout.logoutConfirm'), this.$t('common.notice'), {
        confirmButtonText: this.$t('common.confirm'),
        cancelButtonText: this.$t('common.cancel'),
        type: 'warning'
      }).then(() => {
        useUserStore().LogOut().then(() => {
          location.reload()
        })
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.navbar {
  height: var(--ga-header-h);
  overflow: hidden;
  position: relative;
  background: var(--ga-bg-container);
  border-bottom: 1px solid var(--ga-border-light);
  box-shadow: var(--ga-shadow-sm);

  // No accent line under the navbar. It was 2px of the most saturated colour in
  // the interface, drawn across the main column only -- so once the logo block
  // and this one were the same height, the seam under the header read as one
  // grey line on the left and a blue bar on the right. A page header divides;
  // the 1px border does that, and the brand colour is better spent on things
  // that can be clicked. It also sat 2px above the tab strip's own top border,
  // which is close enough that a missing border there read as this covering it.

  .hamburger-container {
    line-height: 46px;
    height: 100%;
    float: left;
    cursor: pointer;
    transition: background .3s;
    -webkit-tap-highlight-color: transparent;
    color: var(--ga-brand);

    &:hover {
      background: var(--ga-bg-hover)
    }
  }

  .breadcrumb-container {
    float: left;
  }

  .errLog-container {
    display: inline-block;
    vertical-align: top;
  }

  .right-menu {
    float: right;
    height: 100%;
    line-height: 50px;

    &:focus {
      outline: none;
    }

    .right-menu-item {
      display: inline-block;
      padding: 0 10px;
      height: 100%;
      font-size: 18px;
      color: var(--ga-text-2);
      vertical-align: text-bottom;

      &.hover-effect {
        cursor: pointer;
        transition: background .3s, color .3s;
        border-radius: 4px;

        &:hover {
          background: var(--ga-bg-hover);
          color: var(--ga-brand);
        }
      }
    }

    .avatar-container {
      margin-right: 20px;

      .avatar-wrapper {
        margin-top: 5px;
        position: relative;
        display: flex;
        align-items: center;
        gap: 6px;

        .user-avatar {
          cursor: pointer;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: 2px solid var(--el-color-primary-light-7);
          box-shadow: 0 0 0 2px var(--ga-bg-container);
        }

        .ri-arrow-down-s-fill {
          cursor: pointer;
          position: absolute;
          right: -18px;
          top: 16px;
          font-size: 12px;
          color: var(--ga-text-3);
        }
      }
    }
  }
}
</style>
