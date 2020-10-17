<template>
  <div class="right">
    <el-card class="box-card">
      <div slot="header" class="clearfix">
        <el-row>
          <el-col :span="18">
            <el-breadcrumb separator-class="el-icon-arrow-right" class="dir">
              <el-breadcrumb-item
                v-for="item in treePath.treeNodePath"
                :key="item.id"
              >{{ item.label }}</el-breadcrumb-item>
            </el-breadcrumb>
          </el-col>
          <el-col :span="6">
            <div class="file-action">
              <!-- <el-input
                v-model="searchFile"
                placeholder="请输入内容"
                class="input-with-select"
              >
                <el-button slot="append" type="primary">搜索</el-button>
              </el-input> -->
              <div class="file-btn">
                <div
                  v-for="(item, index) in rightBtn"
                  :key="index"
                  class="file-btn-item"
                  :class="index === rightIndex ? 'file-btn-item-active' : ''"
                  @click="handleRightBtn(index)"
                >
                  <i :class="item.icon" />
                </div>
              </div>
            </div>
          </el-col>
        </el-row>
      </div>
      <div
        class="file-container"
        @contextmenu.prevent="rightClick('', '', $event, 1)"
      >
        <el-scrollbar v-if="rightIndex === 0">
          <div class="file-container-inner">
            <div
              v-for="(item, index) in tableData"
              :key="index"
              v-dragging="{ item: item, list: tableData, group: 'item' }"
              class="file-item-inner"
            >
              <div
                class="file-item"
                @contextmenu.prevent.stop="rightClick(item, '', $event, 2)"
              >
                <div class="file-item-icon">
                  <img :src="item.fullUrl | formatFile" alt="">
                </div>
                <div v-if="!item.open" class="file-item-title">
                  {{ item.name }}
                </div>
                <div v-else class="file-item-title">
                  <el-input
                    v-model="item.name"
                    placeholder="请输入内容"
                    @blur="handleBlur($event, item)"
                  />
                </div>
              </div>
            </div>
          </div>
        </el-scrollbar>
        <el-scrollbar v-else>
          <el-table
            :data="tableData"
            highlight-current-row
            border
            style="width: 100%"
          >
            <el-table-column prop="name" align="center" label="文件名">
              <template slot-scope="scope">
                <span v-if="!scope.row.open" v-text="scope.row.name" />
                <el-input
                  v-else
                  v-model="scope.row.name"
                  placeholder="请输入内容"
                  @blur="handleBlur($event, scope.row)"
                />
              </template>
            </el-table-column>
            <el-table-column prop="createdAt" align="center" label="上传日期">
              <template slot-scope="scope">
                <span
                  v-if="!scope.row.open"
                  v-text="parseTime(scope.row.createdAt)"
                />
              </template>
            </el-table-column>
            <el-table-column prop="type" align="center" label="文件类型">
              <template slot-scope="scope">
                <div class="type">
                  <img :src="scope.row.fullUrl | formatFile" alt="">
                  <span v-text="scope.row.type" />
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="size" align="center" label="文件大小">
              <template slot-scope="scope">
                <span v-text="renderSize(scope.row.size)" />
              </template>
            </el-table-column>
            <el-table-column prop="action" align="center" label="操作">
              <template slot-scope="scope">
                <el-dropdown trigger="click">
                  <span class="el-dropdown-link">
                    操作<i class="el-icon-arrow-down el-icon--right" />
                  </span>
                  <el-dropdown-menu slot="dropdown">
                    <el-dropdown-item icon="el-icon-folder-add" @click.native.stop="handleTableAction(scope.row,1)">上传</el-dropdown-item>
                    <el-dropdown-item icon="el-icon-edit" @click.native.stop="handleTableAction(scope.row,2)">重命名</el-dropdown-item>
                    <el-dropdown-item icon="el-icon-folder-delete" @click.native.stop="handleTableAction(scope.row,3)">删除</el-dropdown-item>
                    <el-dropdown-item icon="el-icon-download" @click.native.stop="handleTableAction(scope.row,4)">下载</el-dropdown-item>
                  </el-dropdown-menu>
                </el-dropdown>
              </template>
            </el-table-column>
          </el-table>
        </el-scrollbar>
        <div class="page">
          <el-pagination
            layout="prev, pager, next, jumper, total"
            prev-text="上一页"
            next-text="下一页"
            :current-page="pageNo"
            :page-size="pageSize"
            :total="total"
            @current-change="handlePage"
          />
        </div>
      </div>
    </el-card>
    <div
      v-show="visible"
      id="perTreeMenu"
      :style="{ ...rightMenu }"
      class="contextmenu"
    >
      <div
        class="right-contextMenu-item contextMenu-item"
        @click="handleAction(1)"
        @mouseover="handleTagsOver(0)"
        @mouseleave="handleTagsLeave(0)"
      >
        <i class="el-icon-folder-add" />
        <span> 上传</span>
      </div>
      <el-divider />
      <div
        v-show="!isBlank"
        class="right-contextMenu-item contextMenu-item"
        @click="handleAction(2)"
        @mouseover="handleTagsOver(1)"
        @mouseleave="handleTagsLeave(1)"
      >
        <i class="el-icon-edit" />
        <span> 重命名</span>
      </div>
      <el-divider />
      <div
        v-show="!isBlank"
        class="right-contextMenu-item contextMenu-item"
        @click="handleAction(3)"
        @mouseover="handleTagsOver(2)"
        @mouseleave="handleTagsLeave(2)"
      >
        <i class="el-icon-folder-delete" />
        <span> 删除</span>
      </div>
      <el-divider />
      <div
        v-show="!isBlank"
        class="right-contextMenu-item contextMenu-item"
        @click="handleAction(4)"
        @mouseover="handleTagsOver(3)"
        @mouseleave="handleTagsLeave(3)"
      >
        <i class="el-icon-download" />
        <span> 下载</span>
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
import Sortable from 'sortablejs'
import UploadDialog from '@/components/UploadDialog/index'
import eventBus from '@/utils/eventbus'
// import { parseTime } from '@/utils'
import {
  // sysfileinfo,
  sysfileinfoList,
  sysfileinfoAdd,
  sysfileinfoEdit,
  sysfileinfoDelete
} from '@/api/file'
export default {
  name: 'Right',
  components: {
    UploadDialog
  },
  filters: {
    formatFile(pic) {
      const type = pic.substring(pic.lastIndexOf('.') + 1, pic.length)
      const FileIcons = [
        {
          icon: '',
          matchList: ['bmp', 'jpg', 'png', 'jpeg', 'gif', 'webp']
        },
        {
          icon: require('../../assets/icons/txtbeifen.png'),
          matchList: ['text', 'txt']
        },
        {
          icon: require('../../assets/icons/Zip.png'),
          matchList: ['zip', 'tar', '7z']
        },
        {
          icon: require('../../assets/icons/rar.png'),
          matchList: ['rar']
        },
        {
          icon: require('../../assets/icons/Word.png'),
          matchList: ['doc', 'docx']
        },
        {
          icon: require('../../assets/icons/pptbeifen.png'),
          matchList: ['ppt', 'pptx']
        },
        {
          icon: require('../../assets/icons/Excel.png'),
          matchList: ['xlsx', 'xls']
        },
        {
          icon: require('../../assets/icons/PDFbeifen.png'),
          matchList: ['pdf', 'pdfx']
        },
        {
          icon: require('../../assets/icons/Idea.png'),
          matchList: ['java', 'class', 'jar', 'kt']
        },
        {
          icon: require('../../assets/icons/tubiaozhizuomoban-01.png'),
          matchList: ['psd']
        },
        {
          icon: require('../../assets/icons/tubiaozhizuomoban2-01-01.png'),
          matchList: ['ai']
        },
        {
          icon: require('../../assets/icons/Web.png'),
          matchList: ['ts', 'html', 'css', 'js']
        },
        {
          icon: require('../../assets/icons/video2.png'),
          matchList: ['mp4']
        },
        {
          icon: require('../../assets/icons/voice.png'),
          matchList: ['mp3']
        },
        {
          icon: require('../../assets/icons/AwesomeVue.png'),
          matchList: ['vue']
        },
        {
          icon: require('../../assets/icons/Pycharm.png'),
          matchList: ['py']
        },
        {
          icon: require('../../assets/icons/Phpstorm-01.png'),
          matchList: ['php']
        }
      ]
      const UnknowIcon = require('../../assets/icons/Unknow.png')
      if (FileIcons[0].matchList.includes(type)) {
        return pic
      } else {
        const file = FileIcons.filter(item => item.matchList.includes(type))
        if (file.length > 0) {
          return file[0].icon
        } else {
          return UnknowIcon
        }
      }
    }
  },
  data() {
    return {
      uploadShow: false,
      pageNo: 1,
      pageSize: 50,
      total: 0,
      rightBtn: [
        {
          icon: 'el-icon-s-grid'
        },
        {
          icon: 'ri-table-fill'
        }
      ],
      rightIndex: 0,
      rightData: {},
      tableData: [],
      searchFile: '',
      height: 0,
      visible: false,
      rightMenu: {},
      treePath: {},
      isBlank: false
    }
  },
  mounted() {
    eventBus.$on('treeNodeClick', e => {
      this.treePath = e
      this.getList()
    })
    this.rowDrop()
    this.height = document.querySelector('.layout-right').clientHeight - 107
  },
  destroyed() {
    eventBus.$off('treeNodeClick')
  },
  methods: {
    handlePage(e) {
      this.pageNo = e
      this.getList()
    },
    getList() {
      const pId = this.treePath.currentNode.id
      if (pId) {
        sysfileinfoList({
          pId,
          pageIndex: this.pageNo,
          pageSize: this.pageSize
        }).then(ret => {
          if (ret.code === 200) {
            this.total = ret.data.count
            this.tableData = ret.data.list.map(item => {
              return {
                ...item,
                open: false
              }
            })
          }
        })
      }
    },
    handleUploadConfirm(e) {
      this.uploadMultiple(e).then(ret => {
        if (ret) {
          this.getList()
        }
      })
      this.uploadShow = false
    },
    uploadMultiple(e) {
      const path = e.map(item => {
        return sysfileinfoAdd({
          type: item.type,
          name: item.name,
          size: `${item.size}`,
          url: item.path,
          fullUrl: item.full_path,
          pId: this.treePath.currentNode.id
        })
      })
      return Promise.all(path)
    },
    handleUploadCancel() {
      this.uploadShow = false
    },
    handleTableAction(a, b) {
      console.log(typeof b)
      console.log(a)
      this.rightData.currentData = a
      this.handleAction(b)
    },
    handleAction(e) {
      switch (e) {
        case 1:
          this.uploadShow = true
          break
        case 2:
          this.tableData.forEach((item, index) => {
            if (item.id === this.rightData.currentData.id) {
              this.tableData[index].open = true
            }
          })
          break
        case 3:
          sysfileinfoDelete(this.rightData.currentData.id).then(ret => {
            if (ret.code === 200) {
              this.getList()
            }
          })
          break
        case 4:
          window.open(this.rightData.currentData.fullUrl)
          break
      }
    },
    handleTagsOver(index) {
      const tags = document.querySelectorAll('.right-contextMenu-item')
      const item = tags[index]
      item.style.cssText = `color:${
        this.$store.state.settings.theme
      };background:${this.$store.state.settings.theme.colorRgb()}`
    },
    handleTagsLeave(index) {
      const tags = document.querySelectorAll('.right-contextMenu-item')
      const item = tags[index]
      item.style.cssText = `color:#606266`
    },
    rightClick(a, b, c, d) {
      c.preventDefault()
      this.rightMenu = { top: c.pageY + 'px', left: c.pageX + 'px' }
      this.visible = true
      if (!a) {
        this.isBlank = true
      } else {
        this.isBlank = false
      }
      this.rightData = {
        currentNode: b,
        currentData: a
      }
      document.onclick = ev => {
        if (ev.target !== document.getElementById('perTreeMenu')) {
          this.visible = false
        }
      }
    },
    handleBlur(a, b) {
      console.log(a, b)
      if (this.tableData.length > 0) {
        this.tableData.forEach(item => {
          item.open = false
        })
        sysfileinfoEdit({
          ...b
        })
      }
    },
    rowDrop() {
      const tbody = document.querySelector('.el-table__body-wrapper tbody')
      if (tbody) {
        const _this = this
        Sortable.create(tbody, {
          onEnd({ newIndex, oldIndex }) {
            const currRow = _this.tableData.splice(oldIndex, 1)[0]
            _this.tableData.splice(newIndex, 0, currRow)
          }
        })
      }
    },
    handleRightBtn(e) {
      this.rightIndex = e
    },
    renderSize(value) {
      if (value === null || value === '') {
        return '0 Bytes'
      }
      const unitArr = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
      let index = 0
      const srcsize = parseFloat(value)
      index = Math.floor(Math.log(srcsize) / Math.log(1024))
      let size = srcsize / Math.pow(1024, index)
      size = size.toFixed(2)
      return size + unitArr[index]
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
.file-btn {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin-left: 8px;
  .file-btn-item {
    width: 35px;
    height: 35px;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    border-radius: 3px;
    i {
      font-size: 20px;
      border-color: #ccc;
      color: #8a8a8a;
    }
  }
}
.file-btn-item-active {
  background-color: #e6e6e6;
}
.file-action {
  display: flex;
  justify-content: flex-end;
  align-items: center;
}
.dir {
  height: 36px;
  line-height: 36px;
}
.file-container /deep/ {
  .el-scrollbar__wrap::-webkit-scrollbar {
    display: none;
  }
  .el-table .cell {
    line-height: 35px;
  }
  .el-table thead {
    tr {
      background-color: #d8e5f0 !important;
    }
  }
  .el-table .el-table__header-wrapper th {
    background-color: transparent;
  }
  .file-item-inner {
    width: 12%;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: move;
  }
  .file-container-inner {
    display: flex;
    justify-content: flex-start;
    align-items: center;
    flex-wrap: wrap;
  }
  .file-item {
    width: 130px;
    height: 130px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    .file-item-icon {
      margin-bottom: 5px;
      img {
        width: 50px;
        height: 50px;
      }
    }
    .file-item-title {
      word-break: break-all;
      font-size: 14px;
      line-height: 20px;
      text-align: center;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      width: 60%;
    }
    &:active {
      background-color: #f0f1f5;
    }
  }
  .el-scrollbar {
    height: calc(100vh - 280px);
  }
  .page {
    height: 60rpx;
    display: flex;
    justify-content: center;
    align-items: center;
  }
}
.right {
  height: 100%;
  .el-card {
    height: 100%;
  }
}
.file {
  position: relative;
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
    color: #333;
    span {
      margin-left: 6px;
      font-size: 14.3px;
    }
    //&:hover {
    //  color: currentColor;
    //  background: currentColor;
    //}
  }
}

.type {
  display: flex;
  justify-content: center;
  align-items: center;
  img {
    width: 20px;
    height: 20px;
    margin-right: 5px;
  }
}
</style>
