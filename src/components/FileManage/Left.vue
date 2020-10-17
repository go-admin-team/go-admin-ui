<template>
  <div class="left">
    <el-card>
      <el-scrollbar>
        <el-tree
          ref="tree"
          :data="data"
          :props="defaultProps"
          node-key="id"
          :draggable="drag"
          default-expand-all
          :expand-on-click-node="false"
          :indent="22"
          @node-contextmenu="rightKeyClick"
          @node-click="handleNodeClick"
        >

          <span slot-scope="{ node, data }" class="custom-tree-node">
            <span>
              <i
                v-show="node.childNodes.length > 0"
                class="icon"
                :class="
                  node.expanded ? 'el-icon-folder-opened' : 'el-icon-folder'
                "
              />
              <span v-if="rename.status && rename.node.id === data.id">
                <input
                  ref="nodeInput"
                  v-focus="rename.status"
                  :value="node.label"
                  placeholder="请输入目录名称"
                  type="text"
                  @blur.stop="handleBlur(node, data)"
                  @keyup.enter="handleBlur(node, data)"
                >
              </span>
              <span v-else class="file-name">
                {{ node.label }}
              </span>
            </span>
          </span>
        </el-tree>
      </el-scrollbar>
    </el-card>
    <div
      v-show="visible"
      id="perTreeMenu"
      :style="{ ...rightMenu }"
      class="contextmenu"
    >
      <div
        class="contextMenu-item left-contextMenu-item"
        @click="handleAction(1)"
        @mouseover="handleTagsOver(0)"
        @mouseleave="handleTagsLeave(0)"
      >
        <i class="el-icon-folder-add" />
        <span> 创建目录</span>
      </div>
      <el-divider />
      <div
        class="contextMenu-item left-contextMenu-item"
        @click="handleAction(2)"
        @mouseover="handleTagsOver(1)"
        @mouseleave="handleTagsLeave(1)"
      >
        <i class="el-icon-upload2" />
        <span> 上传</span>
      </div>
      <el-divider />
      <div
        class="contextMenu-item left-contextMenu-item"
        @click="handleAction(3)"
        @mouseover="handleTagsOver(2)"
        @mouseleave="handleTagsLeave(2)"
      >
        <i class="el-icon-edit" />
        <span> 重命名</span>
      </div>
      <el-divider />
      <div
        class="contextMenu-item left-contextMenu-item"
        @click="handleAction(4)"
        @mouseover="handleTagsOver(3)"
        @mouseleave="handleTagsLeave(3)"
      >
        <i class="el-icon-folder-delete" />
        <span> 删除</span>
      </div>
    </div>
    <upload-dialog
      :show="uploadShow"
      @confirm="handleUploadConfirm"
      @cancel="handleUploadCancel"
    />
  </div>
</template>

<script>
// eslint-disable-next-line no-unused-vars
import { v1 as uuidv1 } from 'uuid'
import UploadDialog from '@/components/UploadDialog/index'
import {
  sysfiledirList,
  sysfiledirAcionAdd,
  sysfiledirAcionEdit,
  sysfiledirAcionDel
} from '@/api/file'
import eventBus from '@/utils/eventbus'
export default {
  name: 'Left',
  components: {
    UploadDialog
  },
  directives: {
    focus: {
      inserted: function(el, { value }) {
        if (value) {
          el.focus()
          el.select()
        }
      }
    }
  },
  data() {
    return {
      rename: {
        status: false,
        node: ''
      },
      uploadShow: false,
      drag: false,
      data: [],
      defaultProps: {
        children: 'children',
        label: 'label'
      },
      rightMenu: {},
      visible: false
    }
  },
  mounted() {
    this.getDirList()
  },
  methods: {
    handleNodeClick(e) {
      const result = this.treeFindPath(this.data, node => node.id === e.id)
      eventBus.$emit('treeNodeClick', {
        treeNodePath: result,
        currentNode: e
      })
    },
    treeFindPath(tree, func, path = []) {
      if (!tree) return []
      for (const data of tree) {
        path.push(data)
        if (func(data)) return path
        if (data.children) {
          const findChildren = this.treeFindPath(data.children, func, path)
          if (findChildren.length) return findChildren
        }
        path.pop()
      }
      return []
    },
    getDirList() {
      sysfiledirList().then(ret => {
        if (ret.code === 200) {
          this.data = ret.data
          eventBus.$emit('treeNodeClick', {
            treeNodePath: ret.data,
            currentNode: ret.data[0]
          })
        }
      })
    },
    handleUploadConfirm() {
      this.uploadShow = false
    },
    handleUploadCancel() {
      this.uploadShow = false
    },
    handleTagsOver(index) {
      const tags = document.querySelectorAll('.left-contextMenu-item')
      const item = tags[index]
      item.style.cssText = `color:${
        this.$store.state.settings.theme
      };background:${this.$store.state.settings.theme.colorRgb()}`
    },
    handleTagsLeave(index) {
      const tags = document.querySelectorAll('.left-contextMenu-item')
      const item = tags[index]
      item.style.cssText = `color:#606266`
    },
    handleBlur(n, d) {
      this.rename = {
        status: false,
        node: ''
      }
      d.label = this.$refs.nodeInput.value
      console.log(d)
      sysfiledirAcionEdit({
        id: d.id,
        label: d.label,
        pId: d.pId
      }).then(ret => {
        if (ret.code === 200) {
          this.$refs.tree.updateKeyChildren(n.id, d)
        }
      })
    },
    rightKeyClick(e, a, c) {
      this.rightMenu = { top: e.pageY + 'px', left: e.pageX + 'px' }
      this.visible = true
      this.rightData = {
        currentNode: c,
        currentData: a
      }
      document.onclick = ev => {
        if (ev.target !== document.getElementById('perTreeMenu')) {
          this.visible = false
        }
      }
    },
    handleAction(e) {
      switch (e) {
        case 1:
          sysfiledirAcionAdd({
            label: '新建文件夹',
            pId: this.rightData.currentData.id
          }).then(ret => {
            if (ret.code === 200) {
              this.$refs.tree.append(ret.data, this.rightData.currentData.id)
              this.getDirList()
            }
          })
          break
        case 2:
          this.uploadShow = true
          break
        case 3:
          this.rename = {
            status: true,
            node: this.rightData.currentData
          }
          console.log(this.rename)
          break
        case 4:
          sysfiledirAcionDel(this.rightData.currentData.id).then(ret => {
            if (ret.code === 200) {
              this.$refs.tree.remove(this.rightData.currentNode)
            }
          })
          break
      }
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
.left /deep/ {
  height: 100%;
  .el-card {
    height: 100%;
    overflow: hidden;
  }
    .el-tree-node:focus>.el-tree-node__content{
          background-color: rgba(24, 144, 255,0.9);
        .icon{
          color: #fff!important;
        }
        .file-name{
          color: #fff!important;
        }
    }
  .el-card__body {
    padding: 10px !important;
  }
  .el-scrollbar {
    height: calc(100vh - 133px);
  }
  .file-name {
    color: rgb(71, 84, 102);
    font-size: 14px;
  }
  .el-tree-node__content {
    height: 35px;
  }
  .custom-tree-node {
    .icon {
      font-size: 16px;
      color: #709fbe;
    }
  }
  .el-tree-node :nth-child(2) {
    padding: 1px;
    overflow: visible;
  }
  .el-scrollbar__wrap::-webkit-scrollbar {
    display: none;
  }
  input {
    padding: 3px 8px;
    box-sizing: border-box;
    &:focus {
      outline: none;
      border-color: rgb(24, 144, 255);
      box-shadow: 0 0 10px rgb(24, 144, 255);
    }
  }
}
.contextmenu {
  background: #fff;
  z-index: 3000;
  position: fixed;
  list-style-type: none;
  border-radius: 4px;
  box-shadow: 0 3px 10px 0 rgba(0, 0, 0, 0.1), 0 1px 7px 0 rgba(0, 0, 0, 0.1);
  -moz-user-select: none;
  -webkit-user-select: none;
  user-select: none;
  .el-divider--horizontal {
    margin: 0;
  }
  .contextMenu-item {
    height: 46px;
    cursor: pointer;
    line-height: 46px;
    width: 180px;
    padding: 0 0 0 20px;
    display: flex;
    justify-content: flex-start;
    align-items: center;
    span {
      margin-left: 6px;
      font-size: 14.3px;
    }
  }
}
</style>
