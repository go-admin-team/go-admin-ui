<template>
  <div class="tags-view-container">
    <el-tabs
      v-model="activeTab"
      type="card"
      class="tags-view-tabs"
      @tab-click="handleTabClick"
      @tab-remove="handleTabRemove"
    >
      <el-tab-pane
        v-for="item in visitedViews"
        :key="item.path"
        :label="item.title"
        :name="item.path"
        :closable="!isAffix(item)"
      />
    </el-tabs>
  </div>
</template>

<script>
import path from 'path'

export default {
  name: 'TagsView',
  data() {
    return {
      affixTags: []
    }
  },
  computed: {
    activeTab: {
      get() {
        return this.$route.path
      },
      set() {}
    },
    visitedViews() {
      return this.$store.state.tagsView.visitedViews
    },
    routes() {
      return this.$store.state.permission.routes
    }
  },
  watch: {
    $route() {
      this.addTags()
    }
  },
  mounted() {
    this.initTags()
    this.addTags()
  },
  methods: {
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
      const affixTags = (this.affixTags = this.filterAffixTags(this.routes))
      for (const tag of affixTags) {
        if (tag.name) {
          this.$store.dispatch('tagsView/addVisitedView', tag)
        }
      }
    },
    addTags() {
      const { name } = this.$route
      if (name) {
        this.$store.dispatch('tagsView/addView', this.$route)
      }
    },
    handleTabClick(tab) {
      const targetPath = tab.props.name
      if (targetPath !== this.$route.path) {
        this.$router.push(targetPath)
      }
    },
    handleTabRemove(targetPath) {
      const view = this.visitedViews.find(v => v.path === targetPath)
      if (!view) return

      this.$store.dispatch('tagsView/delView', view).then(({ visitedViews }) => {
        if (targetPath === this.$route.path) {
          const lastView = visitedViews[visitedViews.length - 1]
          if (lastView) {
            this.$router.push(lastView.fullPath || lastView.path)
          } else {
            this.$router.push('/')
          }
        }
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.tags-view-container {
  height: 34px;
  width: 100%;
  background: #fff;
  border-bottom: 1px solid #d8dce5;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.08);

  .tags-view-tabs {
    height: 34px;

    :deep(.el-tabs__header) {
      margin: 0;
      border-bottom: none;
    }

    :deep(.el-tabs__nav-wrap) {
      margin-bottom: 0;
    }

    :deep(.el-tabs__nav) {
      border: none;
    }

    :deep(.el-tabs__item) {
      height: 34px;
      line-height: 34px;
      font-size: 12px;
      color: #495060;
      border: 1px solid #d8dce5;
      border-radius: 3px 3px 0 0;
      margin-right: 4px;
      padding: 0 12px;

      &:first-child {
        margin-left: 4px;
      }

      &.is-active {
        color: #409eff;
        background-color: #fff;
        border-bottom-color: #fff;
      }

      &:not(.is-active):hover {
        color: #409eff;
      }
    }

    :deep(.el-tabs__item .is-icon-close) {
      margin-left: 4px;
    }
  }
}
</style>
