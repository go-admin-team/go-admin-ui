<template>
  <div id="tags-view-container" class="tags-view-container">
    <el-tabs
      v-model="editableTabsValue"
      type="card"
      @tab-remove="closeSelectedTag"
    >
      <el-tab-pane
        v-for="item in visitedViews"
        :key="item.path"
        :closable="item.fullPath === '/dashboard' ? false : true"
        :name="item.fullPath"
      >
        <template #label>
          <router-link
            ref="tag"
            v-slot="{ navigate, href }"
            class="tags-view-item"
            :style="{ color: item.fullPath === $route.fullPath ? theme : '' }"
            :to="{ path: item.path, query: item.query, fullPath: item.fullPath }"
            custom
          >
            <span
              :href="href"
              @click="navigate"
              @contextmenu.prevent="openMenu(item,$event)"
            >
              {{ item.title }}
            </span>
          </router-link>
        </template>
      </el-tab-pane>
    </el-tabs>
    <ul v-show="visible" :style="{left:left+'px',top:top+'px'}" class="contextmenu">
      <li class="tags-item" @click="refreshSelectedTag(selectedTag)" @mouseover="handleTagsOver(1)" @mouseleave="handleTagsLeave(1)">刷新当前标签页</li>
      <li v-if="!isAffix(selectedTag)" class="tags-item" @click="closeSelectedTag(selectedTag)" @mouseover="handleTagsOver(2)" @mouseleave="handleTagsLeave(2)">关闭当前标签页</li>
      <li class="tags-item" @click="closeOthersTags" @mouseover="handleTagsOver(3)" @mouseleave="handleTagsLeave(3)">关闭其他标签页</li>
      <li class="tags-item" @click="closeAllTags(selectedTag)" @mouseover="handleTagsOver(4)" @mouseleave="handleTagsLeave(4)">关闭全部标签页</li>
    </ul>
  </div>
</template>

<script>
import { mapState } from 'pinia'
import path from 'path'
import { useSettingsStore } from '@/stores/settings'
import { useTagsViewStore } from '@/stores/tagsView'
import { usePermissionStore } from '@/stores/permission'

export default {
  data() {
    return {
      editableTabsValue: '/',
      top: 0,
      left: 0,
      selectedTag: {},
      affixTags: [],
      visible: false
    }
  },
  computed: {
    ...mapState(useTagsViewStore, ['visitedViews']),
    ...mapState(usePermissionStore, ['routes']),
    ...mapState(useSettingsStore, ['theme'])
  },
  watch: {
    $route() {
      this.addTags()
    },
    visible(value) {
      if (value) {
        document.body.addEventListener('click', this.closeMenu)
      } else {
        document.body.removeEventListener('click', this.closeMenu)
      }
    }
  },
  mounted() {
    this.initTags()
    this.addTags()
    this.isActive()
    this.beforeUnload()
  },
  methods: {
    // 刷新前缓存tab
    beforeUnload() {
      // 监听页面刷新
      window.addEventListener('beforeunload', () => {
        const tabViews = this.visitedViews.map(item => {
          return {
            fullPath: item.fullPath,
            hash: item.hash,
            meta: { ...item.meta },
            name: item.name,
            params: { ...item.params },
            path: item.path,
            query: { ...item.query },
            title: item.title
          }
        })
        sessionStorage.setItem('tabViews', JSON.stringify(tabViews))
      })
      // 页面初始化加载判断缓存中是否有数据
      const oldViews = JSON.parse(sessionStorage.getItem('tabViews')) || []
      if (oldViews.length > 0) {
        useTagsViewStore().setVisitedViews(oldViews)
      }
    },
    handleTagsOver(index) {
      const tags = document.querySelectorAll('.tags-item')
      const item = tags[index - 1]
      item.style.cssText = `color:${this.theme};background:${
        this.theme.colorRgb()
      }`
    },
    handleTagsLeave(index) {
      const tags = document.querySelectorAll('.tags-item')
      const item = tags[index - 1]
      item.style.cssText = `color:var(--ga-text-2)`
    },
    isActive() {
      const index = this.visitedViews.findIndex(item => item.fullPath === this.$route.fullPath)
      const pathIndex = index > -1 ? index : 0
      this.editableTabsValue = this.visitedViews[pathIndex].fullPath
    },
    isAffix(tag) {
      return tag.meta && tag.meta.affix
    },
    filterAffixTags(routes, basePath = '/') {
      let tags = []
      routes.forEach(route => {
        if (route.meta && route.meta.affix) {
          const tagPath = path.resolve(basePath, route.path)
          tags.push({
            fullPath: tagPath,
            path: tagPath,
            name: route.name,
            meta: { ...route.meta }
          })
        }
        if (route.children) {
          const tempTags = this.filterAffixTags(route.children, route.path)
          if (tempTags.length >= 1) {
            tags = [...tags, ...tempTags]
          }
        }
      })
      return tags
    },
    initTags() {
      const affixTags = this.affixTags = this.filterAffixTags(this.routes)
      for (const tag of affixTags) {
        // Must have tag name
        if (tag.name) {
          useTagsViewStore().addVisitedView(tag)
        }
      }
    },
    addTags() {
      const { name } = this.$route
      if (name) {
        useTagsViewStore().addView(this.$route)
        this.isActive()
      }
      return false
    },
    moveToCurrentTag() {
      const tags = this.$refs.tag
      this.$nextTick(() => {
        for (const tag of tags) {
          if (tag.to.path === this.$route.path) {
            // this.$refs.scrollPane.moveToTarget(tag)
            // when query is different then update
            if (tag.to.fullPath !== this.$route.fullPath) {
              useTagsViewStore().updateVisitedView(this.$route)
            }
            break
          }
        }
      })
    },
    refreshSelectedTag(view) {
      useTagsViewStore().delCachedView(view)
      const { fullPath } = view
      this.$nextTick(() => {
        this.$router.replace({
          path: '/redirect' + fullPath
        })
      })
    },
    closeSelectedTag(view) {
      const routerPath = view.fullPath ? view.fullPath : view
      const index = this.visitedViews.findIndex(item => item.fullPath === routerPath)
      if (index > -1) {
        const path = this.visitedViews[index]
        const { visitedViews } = useTagsViewStore().delView(path)
        if (this.editableTabsValue === path.fullPath) {
          this.toLastView(visitedViews, path)
        }
      }
    },
    closeOthersTags() {
      this.$router.push(this.selectedTag.path).catch(e => e)
      useTagsViewStore().delOthersViews(this.selectedTag)
      this.moveToCurrentTag()
    },
    closeAllTags(view) {
      const { visitedViews } = useTagsViewStore().delAllViews()
      if (this.affixTags.some(tag => tag.path === view.path)) {
        return
      }
      this.toLastView(visitedViews, view)
    },
    toLastView(visitedViews, view) {
      const latestView = visitedViews.slice(-1)[0]
      if (latestView) {
        this.$router.push(latestView.fullPath).catch(err => err)
      } else {
        // now the default is to redirect to the home page if there is no tags-view,
        // you can adjust it according to your needs.
        if (view.name === 'Dashboard') {
          // to reload home page
          this.$router.replace({ path: '/redirect' + view.fullPath })
        } else {
          this.$router.push('/')
        }
      }
    },
    openMenu(tag, e) {
      const menuMinWidth = 105
      const offsetLeft = this.$el.getBoundingClientRect().left // container margin left
      const offsetWidth = this.$el.offsetWidth // container width
      const maxLeft = offsetWidth - menuMinWidth // left boundary
      const left = e.clientX - offsetLeft + 15 // 15: margin right

      if (left > maxLeft) {
        this.left = maxLeft
      } else {
        this.left = left
      }

      this.top = e.clientY
      this.visible = true
      this.selectedTag = tag
    },
    closeMenu() {
      this.visible = false
    }
  }
}

// eslint-disable-next-line no-extend-native
String.prototype.colorRgb = function() {
  let sColor = this.toLowerCase()
  const reg = /^#([0-9a-fA-f]{3}|[0-9a-fA-f]{6})$/
  if (sColor && reg.test(sColor)) {
    if (sColor.length === 4) {
      let sColorNew = '#'
      for (let i = 1; i < 4; i += 1) {
        sColorNew += sColor.slice(i, i + 1).concat(sColor.slice(i, i + 1))
      }
      sColor = sColorNew
    }
    const sColorChange = []
    for (let i = 1; i < 7; i += 2) {
      sColorChange.push(parseInt('0x' + sColor.slice(i, i + 2)))
    }
    return 'rgba(' + sColorChange.join(',') + ',0.2)'
  } else {
    return sColor
  }
}
</script>

<style lang="scss">
.tags-view-container {
  height: 40px;
  width: 100%;
  background: var(--ga-bg-container);
  border-bottom: 1px solid var(--ga-border-light);
  box-shadow: var(--ga-shadow-sm);
  padding: 0 8px;
  box-sizing: border-box;
  display: flex;
  align-items: flex-end;
  // el-tabs__header 固定 40px，而容器含 1px 下边框后内容区仅 39px，
  // 底部对齐会使其向上溢出 1px 并压在 navbar 边框上，形成一条贯穿的横线
  overflow: hidden;

  // el-tabs 整体铺满容器
  .el-tabs {
    flex: 1;
    overflow: hidden;
  }

  // 去掉 el-tabs 自带上边距和底部 border
  .el-tabs__header {
    margin: 0;
    border-bottom: none !important;
    // 默认固定 40px，会超出容器内容区（40px 减去 1px 下边框）并向上压住
    // navbar 的边框；改为自适应高度并让页签底部对齐
    height: 100%;
    display: flex;
    align-items: flex-end;
  }

  .el-tabs__nav-wrap {
    margin-bottom: 0;
    &::after { display: none; }
  }

  .el-tabs__nav {
    border: none !important;
  }

  .el-tabs__item {
    height: 32px;
    line-height: 32px;
    font-size: 12px;
    color: var(--ga-text-2);
    border: 1px solid var(--ga-border) !important;
    border-radius: 3px 3px 0 0;
    margin-right: 3px;
    padding: 0 10px !important;
    background: var(--ga-bg-subtle);
    transition: color 0.2s, background 0.2s;

    &:first-child { margin-left: 4px; }

    &.is-active {
      color: var(--ga-brand);
      background: var(--ga-bg-container);
      border-color: var(--el-color-primary-light-5) !important;
      border-bottom-color: var(--ga-bg-container) !important;
      font-weight: 500;
    }

    &:not(.is-active):hover {
      color: var(--ga-brand);
      background: var(--el-color-primary-light-9);
    }

    .is-icon-close {
      margin-left: 4px;
      width: 14px;
      height: 14px;
      line-height: 14px;
      border-radius: 50%;
      &:hover {
        background-color: var(--ga-text-3);
        color: #fff;
      }
    }
  }

  // 右键菜单
  .contextmenu {
    margin: 0;
    background: var(--ga-bg-container);
    z-index: 3000;
    position: fixed;
    list-style-type: none;
    padding: 4px 0;
    border-radius: 4px;
    font-size: 12px;
    color: var(--ga-text-1);
    box-shadow: var(--ga-shadow-lg);
    border: 1px solid var(--ga-border);
    user-select: none;

    li {
      list-style: none;
      line-height: 34px;
      padding: 0 16px;
      margin: 0;
      font-size: 13px;
      color: var(--ga-text-2);
      cursor: pointer;

      &:hover {
        background: var(--el-color-primary-light-9);
        color: var(--ga-brand);
      }
    }
  }
}
</style>

<style lang="scss">
//reset element css of el-icon-close
.tags-view-wrapper {
  .tags-view-item {
    .el-icon-close {
      width: 16px;
      height: 16px;
      vertical-align: 2px;
      border-radius: 50%;
      text-align: center;
      transition: all .3s cubic-bezier(.645, .045, .355, 1);
      transform-origin: 100% 50%;
      &:before {
        transform: scale(.6);
        display: inline-block;
        vertical-align: -3px;
      }
      &:hover {
        background-color: var(--ga-text-3);
        color: #fff;
      }
    }
  }
}
</style>
