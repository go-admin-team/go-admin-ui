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
        <router-link
          ref="tag"
          slot="label"
          tag="span"
          class="tags-view-item"
          :style="{ color: item.fullPath === $route.fullPath ? theme : '' }"
          :to="{ path: item.path, query: item.query, fullPath: item.fullPath }"
          @contextmenu.prevent.native="openMenu(item,$event)"
        >
          {{ item.title }}
        </router-link>
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
import path from 'path'

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
    visitedViews() {
      return this.$store.state.tagsView.visitedViews
    },
    routes() {
      return this.$store.state.permission.routes
    },
    theme() {
      return this.$store.state.settings.theme
    }
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
  },
  methods: {
    handleTagsOver(index) {
      const tags = document.querySelectorAll('.tags-item')
      const item = tags[index - 1]
      item.style.cssText = `color:${this.$store.state.settings.theme};background:${
        this.$store.state.settings.theme.colorRgb()
      }`
    },
    handleTagsLeave(index) {
      const tags = document.querySelectorAll('.tags-item')
      const item = tags[index - 1]
      item.style.cssText = `color:#606266`
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
          this.$store.dispatch('tagsView/addVisitedView', tag)
        }
      }
    },
    addTags() {
      const { name } = this.$route
      if (name) {
        this.$store.dispatch('tagsView/addView', this.$route)
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
              this.$store.dispatch('tagsView/updateVisitedView', this.$route)
            }
            break
          }
        }
      })
    },
    refreshSelectedTag(view) {
      this.$store.dispatch('tagsView/delCachedView', view).then(() => {
        const { fullPath } = view
        this.$nextTick(() => {
          this.$router.replace({
            path: '/redirect' + fullPath
          })
        })
      })
    },
    closeSelectedTag(view) {
      const routerPath = view.fullPath ? view.fullPath : view
      const index = this.visitedViews.findIndex(item => item.fullPath === routerPath)
      if (index > -1) {
        const path = this.visitedViews[index]
        this.$store.dispatch('tagsView/delView', path).then(({ visitedViews }) => {
          if (this.editableTabsValue === path.fullPath) {
            this.toLastView(visitedViews, path)
          }
        })
      }
    },
    closeOthersTags() {
      this.$router.push(this.selectedTag.path).catch(e => e)
      this.$store.dispatch('tagsView/delOthersViews', this.selectedTag).then(() => {
        this.moveToCurrentTag()
      })
    },
    closeAllTags(view) {
      this.$store.dispatch('tagsView/delAllViews').then(({ visitedViews }) => {
        if (this.affixTags.some(tag => tag.path === view.path)) {
          return
        }
        this.toLastView(visitedViews, view)
      })
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

<style lang="scss" scoped>
.tags-view-container ::v-deep{
  height: 43px;
  width: 100%;
  background: #fff;
  border-bottom: 1px solid #d8dce5;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, .12), 0 0 3px 0 rgba(0, 0, 0, .04);
  padding: 0 15px;
  box-sizing: border-box;
  .el-tabs__item{
    &:hover{
      color: #000;
    }
  }
  .tags-view-item{
    height: 40px;
    display: inline-block;
  }
  .tags-view-wrapper {
    .tags-view-item {
      display: inline-block;
      position: relative;
      cursor: pointer;
      height: 26px;
      line-height: 26px;
      border: 1px solid #d8dce5;
      color: #495060;
      background: #fff;
      padding: 0 8px;
      font-size: 12px;
      margin-left: 5px;
      margin-top: 4px;
      &:first-of-type {
        margin-left: 15px;
      }
      &:last-of-type {
        margin-right: 15px;
      }
      &.active {
        background-color: #42b983;
        color: #fff;
        border-color: #42b983;
        &::before {
          content: '';
          background: #fff;
          display: inline-block;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          position: relative;
          margin-right: 2px;
        }
      }
    }
  }
  .contextmenu {
    margin: 0;
    background: #fff;
    z-index: 3000;
    position: absolute;
    list-style-type: none;
    padding: 5px 0;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 400;
    color: #333;
    box-shadow: 1px 2px 10px #ccc;
    -moz-user-select:none;
    -webkit-user-select:none;
    user-select:none;
    li {
      list-style: none;
      line-height: 36px;
      padding: 2px 20px;
      margin: 0;
      font-size: 14px;
      color: #606266;
      cursor: pointer;
      outline: 0;
      cursor: pointer;
      &:hover {
        background: #eee;
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
        background-color: #b4bccc;
        color: #fff;
      }
    }
  }
}
</style>
