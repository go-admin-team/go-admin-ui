<template>
  <div class="file">
    <BasicLayout>
      <template #wrapper>
        <DragColumn>
          <div slot="left" class="left">
            <el-card>
              <el-scrollbar>
                <el-tree ref="tree" :data="data" :props="defaultProps" node-key="id" :draggable="drag" default-expand-all :indent="22" @node-contextmenu="rightKeyClick">
                  <span slot-scope="{ node, data }" class="custom-tree-node">
                    <span>
                      <i v-show="node.childNodes.length > 0" class="icon" :class=" node.expanded ? 'el-icon-folder-opened' : 'el-icon-folder' " />
                      <span v-if="rename.status && rename.node === node.label">
                        <input ref="nodeInput" v-focus="rename.status" :value="node.label" placeholder="请输入目录名称" type="text" @blur.stop="handleBlur(node, data)" @keyup.enter="handleBlur(node, data)">
                      </span>
                      <span v-else>
                        {{ node.label }}
                      </span>
                    </span>
                  </span>
                </el-tree>
              </el-scrollbar>
            </el-card>
          </div>
          <div slot="right" class="right">
            <el-card class="box-card">
              <div slot="header" class="clearfix">
                <el-row>
                  <el-col :span="20">
                    <el-breadcrumb separator-class="el-icon-arrow-right" class="dir">
                      <el-breadcrumb-item :to="{ path: '/' }">一级1</el-breadcrumb-item>
                      <el-breadcrumb-item>二级 1-1</el-breadcrumb-item>
                      <el-breadcrumb-item>三级 1-1-1</el-breadcrumb-item>
                    </el-breadcrumb>
                  </el-col>
                  <el-col :span="4">
                    <el-input v-model="searchFile" placeholder="请输入内容" class="input-with-select">
                      <el-button slot="append" icon="el-icon-search" />
                    </el-input>

                  </el-col>
                </el-row>
              </div>
              <div class="file-container">
                <el-scrollbar>
                  <div class="file-container-inner">
                    <div v-for="(item,index) in fileList" :key="index" v-dragging="{ item: item, list: fileList, group: 'item' }" class="file-item-inner">
                      <div class="file-item">
                        <div class="file-item-icon">
                          <i class="el-icon-picture-outline" />
                        </div>
                        <div class="file-item-title">
                          {{ item }}文件.png
                        </div>
                      </div>
                    </div>

                  </div>

                </el-scrollbar>
              </div>
            </el-card>
          </div>
        </DragColumn>
      </template>
    </BasicLayout>
    <div v-show="visible" id="perTreeMenu" :style="{...rightMenu}" class="contextmenu">
      <div class="contextMenu-item" @click="handleAction(1)">
        <i class="el-icon-folder-add" />
        <span> 创建目录</span>
      </div>
      <el-divider />
      <div class="contextMenu-item" @click="handleAction(2)">
        <i class="el-icon-upload2" />
        <span> 上传</span>
      </div>
      <el-divider />
      <div class="contextMenu-item" @click="handleAction(3)">
        <i class="el-icon-edit" />
        <span> 重命名</span>
      </div>
      <el-divider />
      <div class="contextMenu-item" @click="handleAction(4)">
        <i class="el-icon-folder-delete" />
        <span> 删除</span>
      </div>
    </div>
  </div>
</template>

<script>
import { v1 as uuidv1 } from 'uuid'
import DragColumn from '@/components/DragColumn/index'
export default {
  name: 'FileManage',
  components: {
    DragColumn
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
      visible: false,
      fileList: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29],
      rightData: {},
      rename: {
        status: false,
        node: ''
      },
      searchFile: '',
      drag: false,
      rightMenu: {

      },
      data: [
        {
          id: 1,
          label: '一级 1',
          rename: false,
          children: [{
            label: '二级 1-1',
            id: 2,
            rename: false,
            children: [{
              id: 3,
              label: '三级 1-1-1',
              rename: false
            }]
          }]
        }, {
          label: '一级 2',
          id: 4,
          rename: false,
          children: [{
            label: '二级 2-1',
            id: 5,
            rename: false,
            children: [{
              label: '三级 2-1-1',
              id: 6,
              rename: false
            }]
          }, {
            id: 7,
            label: '二级 2-2',
            rename: false,
            children: [{
              id: 8,
              label: '三级 2-2-1',
              rename: false
            }]
          }]
        }, {
          id: 9,
          label: '一级 3',
          rename: false,
          children: [{
            label: '二级 3-1',
            id: 10,
            rename: false,
            children: [{
              id: 11,
              label: '三级 3-1-1',
              rename: false
            }]
          }, {
            id: 12,
            label: '二级 3-2',
            rename: false,
            children: [{
              id: 13,
              label: '三级 3-2-1',
              rename: false
            }]
          }]
        }],
      defaultProps: {
        children: 'children',
        label: 'label'
      }
    }
  },
  mounted() {
  },
  methods: {
    handleBlur(n, d) {
      this.rename = {
        status: false,
        node: ''
      }
      d.label = this.$refs.nodeInput.value
      this.$refs.tree.updateKeyChildren(n.id, defaultStatus)
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
          this.$refs.tree.append({
            id: uuidv1(),
            label: '新建文件夹',
            rename: false
          }, this.rightData.currentData.id)
          break
        case 2:
          break
        case 3:
          this.rename = {
            status: true,
            node: this.rightData.currentData.label
          }
          break
        case 4:
          this.$refs.tree.remove(this.rightData.currentNode)
          break
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.dir{
      height: 36px;
      line-height: 36px;
    }
    .file-container /deep/ {
        .el-scrollbar__wrap::-webkit-scrollbar{
        display: none;
      }
      .file-item-inner{
        width: 10%;
        display: flex;
        justify-content: center;
        align-items: center;
        cursor: move;
      }
      .file-container-inner{
        display: flex;
        justify-content: flex-start;
        align-items: center;
        flex-wrap: wrap;
      }
      .file-item{
        width: 100px;
        height: 100px;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        .file-item-icon{
          font-size: 50px;
        }
        .file-item-title{
          word-break: break-all;
          font-size: 14px;
          line-height: 20px;
          text-align: center;
        }
      }
       .el-scrollbar{
        height: calc(100vh - 200px);
      }
    }
  .left /deep/{
    height: 100%;

    .el-card{
        height: 100%;
        overflow: hidden;
    }
    .el-card__body{
      padding: 10px!important
    }
    .el-scrollbar{
      height: calc(100vh - 133px);
    }
    .el-tree-node__content{
      height: 35px;
    }
    .custom-tree-node{
        .icon{
          margin-right: 5px;
          font-size: 15px;
        }
    }
   .el-tree-node :nth-child(2) {
    padding: 1px;
    overflow: visible;
  }
    .el-scrollbar__wrap::-webkit-scrollbar{
      display: none;
    }
    input{
      padding: 3px 8px;
      box-sizing: border-box;
      &:focus{
         outline: none;
         border-color: rgb(24, 144, 255);
         box-shadow: 0 0 10px rgb(24, 144, 255);
      }
    }
  }
  .right{
    height: 100%;
    .el-card{
        height: 100%;
    }
  }
  .file{
    position: relative;
  }
 .contextmenu {
    background: #fff;
    z-index: 3000;
    position: fixed;
    list-style-type: none;
    border-radius: 4px;
    box-shadow: 0 3px 10px 0 rgba(0, 0, 0, 0.1), 0 1px 7px 0 rgba(0, 0, 0, 0.1);
    -moz-user-select:none;
    -webkit-user-select:none;
    user-select:none;
    .el-divider--horizontal{
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
      i{
        color: #8a8a8a;
      }
      span{
        margin-left: 6px;
        font-size: 14.3px;
        color: #333;
      }
      &:hover {
        background: #eee;
      }
    }
  }
</style>
