<template>
  <div class="right">
    <el-card class="box-card">
      <div slot="header" class="clearfix">
        <el-row>
          <el-col :span="18">
            <el-breadcrumb separator-class="el-icon-arrow-right" class="dir">
              <el-breadcrumb-item :to="{ path: '/' }">一级1</el-breadcrumb-item>
              <el-breadcrumb-item>二级 1-1</el-breadcrumb-item>
              <el-breadcrumb-item>三级 1-1-1</el-breadcrumb-item>
            </el-breadcrumb>
          </el-col>
          <el-col :span="6">
            <div class="file-action">
              <el-input v-model="searchFile" placeholder="请输入内容" class="input-with-select">
                <el-button slot="append" type="primary">搜索</el-button>
              </el-input>
              <div class="file-btn">
                <div v-for="(item,index) in rightBtn" :key="index" class="file-btn-item" :class=" index === rightIndex ? 'file-btn-item-active' : '' " @click="handleRightBtn(index)">
                  <i :class="item.icon" />
                </div>
              </div>
            </div>
          </el-col>
        </el-row>
      </div>
      <div class="file-container">
        <el-scrollbar v-if="rightIndex === 0">
          <div class="file-container-inner">
            <div v-for="(item,index) in tableData" :key="index" v-dragging="{ item: item, list: tableData, group: 'item' }" class="file-item-inner">
              <div class="file-item" @contextmenu.prevent.stop="rightClick(item,'',$event)">
                <div class="file-item-icon">
                  <img src="../../assets/icons/Zip.png" alt="">
                </div>
                <div class="file-item-title" v-if="!item.open">
                  {{ item.value }}
                </div>
                <div class="file-item-title" v-else>
                  <el-input v-model="item.value" placeholder="请输入内容"></el-input>
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
            @row-contextmenu="rightClick"
            style="width: 100%">
            <el-table-column
              prop="value"
              align="center"
              label="文件名">
              <template slot-scope="scope">
                <span v-if="!scope.row.open" v-text="renderSize(scope.row.value)" />
                <el-input v-else v-model="scope.row.value" placeholder="请输入内容"></el-input>
              </template>
            </el-table-column>
            <el-table-column
              prop="date"
              align="center"
              label="上传日期"
            />
            <el-table-column
              prop="type"
              align="center"
              label="文件类型"
            />
            <el-table-column
              prop="size"
              align="center"
              label="文件大小"
            >
              <template slot-scope="scope">
                <span v-text="renderSize(scope.row.size)" />
              </template>
            </el-table-column>
          </el-table>
        </el-scrollbar>
      </div>
    </el-card>
    <div v-show="visible" id="perTreeMenu" :style="{...rightMenu}" class="contextmenu">
      <div class="right-contextMenu-item contextMenu-item" @click="handleAction(1)" @mouseover="handleTagsOver(0)" @mouseleave="handleTagsLeave(0)">
        <i class="el-icon-folder-add" />
        <span> 上传</span>
      </div>
      <el-divider />
      <div class="right-contextMenu-item contextMenu-item" @click="handleAction(2)" @mouseover="handleTagsOver(1)" @mouseleave="handleTagsLeave(1)">
        <i class="el-icon-edit" />
        <span> 重命名</span>
      </div>
      <el-divider />
      <div class="right-contextMenu-item contextMenu-item" @click="handleAction(3)" @mouseover="handleTagsOver(2)" @mouseleave="handleTagsLeave(2)">
        <i class="el-icon-folder-delete" />
        <span> 删除</span>
      </div>
      <el-divider />
      <div class="right-contextMenu-item contextMenu-item" @click="handleAction(4)" @mouseover="handleTagsOver(3)" @mouseleave="handleTagsLeave(3)">
        <i class="el-icon-download" />
        <span> 下载</span>
      </div>
    </div>
    <upload-dialog :show="uploadShow" @confirm="handleUploadConfirm" @cancel="handleUploadCancel"/>
  </div>
</template>

<script>
import Sortable from 'sortablejs'
import UploadDialog from '@/components/UploadDialog/index'
export default {
  name: 'Right',
  components: {
    UploadDialog,

  },
  data() {
    return {
      uploadShow: false,
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
      tableData: [
        {
          'id': '/usr/upload/userfiles/1/程序附件/oa/notify/2020/7/2.pdf',
          'value': '2.pdf',
          'open': false,
          'type': 'pdf',
          'date': 1595495846,
          'size': '108223',
          'pId': '7',
          'data': {
          }
        },
        {
          'id': '/usr/upload/userfiles/1/程序附件/oa/notify/2020/7/1.pdf',
          'value': '1.pdf',
          'open': false,
          'type': 'pdf',
          'date': 1595495841,
          'size': '100767',
          'pId': '7',
          'data': {
          }
        },
        {
          'id': '/usr/upload/userfiles/1/程序附件/oa/notify/2020/7/202.jpg',
          'value': '202.jpg',
          'open': false,
          'type': 'image',
          'date': 1595495698,
          'size': '132449',
          'pId': '7',
          'data': {
          }
        },
        {
          'id': '/usr/upload/userfiles/1/程序附件/oa/notify/2020/7/微信截图_20200723171830.png',
          'value': '微信截图_20200723171830.png',
          'open': false,
          'type': 'image',
          'date': 1595495932,
          'size': '39883',
          'pId': '7',
          'data': {
          }
        },
        {
          'id': '/usr/upload/userfiles/1/程序附件/oa/notify/2020/7/微信截图_20200723171830(1).png',
          'value': '微信截图_20200723171830(1).png',
          'open': false,
          'type': 'image',
          'date': 1595495964,
          'size': '39883',
          'pId': '7',
          'data': {
          }
        },
        {
          'id': '/usr/upload/userfiles/1/程序附件/oa/notify/2020/7/huihui.png',
          'value': 'huihui.png',
          'open': false,
          'type': 'image',
          'date': 1595495712,
          'size': '601685',
          'pId': '7',
          'data': {
          }
        },
        {
          'id': '/usr/upload/userfiles/1/程序附件/oa/notify/2020/7/101.jpg',
          'value': '101.jpg',
          'open': false,
          'type': 'image',
          'date': 1595495690,
          'size': '123723',
          'pId': '7',
          'data': {
          }
        },
        {
          'id': '/usr/upload/userfiles/1/程序附件/oa/notify/2020/7/LUC ERP系统计划进度表20200722.xlsx',
          'value': 'LUC ERP系统计划进度表20200722.xlsx',
          'open': false,
          'type': 'excel',
          'date': 1595495614,
          'size': '10624',
          'pId': '7',
          'data': {
          }
        },
        {
          'id': '/usr/upload/userfiles/1/程序附件/test/pic/testPic/2020/8/5eb50393be56e.jpg',
          'value': '5eb50393be56e.jpg',
          'open': false,
          'type': 'image',
          'date': 1597072709,
          'size': '1528457',
          'pId': '8',
          'data': {
          }
        },
        {
          'id': '/usr/upload/userfiles/1/程序附件/test/pic/testPic/2020/8/流程图0810.png',
          'value': '流程图0810.png',
          'open': false,
          'type': 'image',
          'date': 1597825927,
          'size': '1765168',
          'pId': '8',
          'data': {
          }
        },
        {
          'id': '/usr/upload/userfiles/1/程序附件/test/pic/testPic/2020/8/新建文本文档.txt',
          'value': '新建文本文档.txt',
          'open': false,
          'type': 'text',
          'date': 1597669232,
          'size': '273',
          'pId': '8',
          'data': {
          }
        },
        {
          'id': '/usr/upload/userfiles/1/程序附件/test/pic/testPic/2020/8/新建文本文档 (2).txt',
          'value': '新建文本文档 (2).txt',
          'open': false,
          'type': 'text',
          'date': 1597669240,
          'size': '105',
          'pId': '8',
          'data': {
          }
        },
        {
          'id': '/usr/upload/userfiles/1/程序附件/test/pic/testPic/2020/8/city tower.jpg',
          'value': 'city tower.jpg',
          'open': false,
          'type': 'image',
          'date': 1596881075,
          'size': '342069',
          'pId': '8',
          'data': {
          }
        },
        {
          'id': '/usr/upload/userfiles/1/程序附件/test/pic/testPic/2020/8/earth-2581631_1280.jpg',
          'value': 'earth-2581631_1280.jpg',
          'open': false,
          'type': 'image',
          'date': 1596784952,
          'size': '279848',
          'pId': '8',
          'data': {
          }
        },
        {
          'id': '/usr/upload/userfiles/1/程序附件/test/pic/testPic/2020/8/Yukon-Yukon-River-Canadian-Culture-Landscape-Canada-_photocredit-istock_royalty-free.jpg',
          'value': 'Yukon-Yukon-River-Canadian-Culture-Landscape-Canada-_photocredit-istock_royalty-free.jpg',
          'open': false,
          'type': 'image',
          'date': 1596807750,
          'size': '643859',
          'pId': '8',
          'data': {
          }
        },
        {
          'id': '/usr/upload/userfiles/1/程序附件/test/pic/testPic/2020/8/1.png',
          'value': '1.png',
          'open': false,
          'type': 'image',
          'date': 1597817011,
          'size': '6978',
          'pId': '8',
          'data': {
          }
        },
        {
          'id': '/usr/upload/userfiles/1/程序附件/oa/notify/2020/7/2.txt',
          'value': '2.txt',
          'open': false,
          'type': 'text',
          'date': 1595922370,
          'size': '11',
          'pId': '7',
          'data': {
          }
        },
        {
          'id': '/usr/upload/userfiles/1/程序附件/oa/notify/2020/6/ReadMe(1).txt',
          'value': 'ReadMe(1).txt',
          'open': false,
          'type': 'text',
          'date': 1591000829,
          'size': '7861',
          'pId': '6',
          'data': {
          }
        },
        {
          'id': '/usr/upload/userfiles/1/程序附件/oa/notify/2020/6/呼市招生办.png',
          'value': '呼市招生办.png',
          'open': false,
          'type': 'image',
          'date': 1591067881,
          'size': '268729',
          'pId': '6',
          'data': {
          }
        },
        {
          'id': '/usr/upload/userfiles/1/程序附件/oa/notify/2020/6/商业版本功能白皮书.pdf',
          'value': '商业版本功能白皮书.pdf',
          'open': false,
          'type': 'pdf',
          'date': 1593400457,
          'size': '8251975',
          'pId': '6',
          'data': {
          }
        },
        {
          'id': '/usr/upload/userfiles/1/程序附件/oa/notify/2020/6/12_1585150133246.jpg',
          'value': '12_1585150133246.jpg',
          'open': false,
          'type': 'image',
          'date': 1591067843,
          'size': '7006',
          'pId': '6',
          'data': {
          }
        },
        {
          'id': '/usr/upload/userfiles/1/程序附件/oa/notify/2020/6/ReadMe.txt',
          'value': 'ReadMe.txt',
          'open': false,
          'type': 'text',
          'date': 1591000809,
          'size': '7861',
          'pId': '6',
          'data': {
          }
        },
        {
          'id': '/usr/upload/userfiles/1/程序附件/oa/notify/2020/6/GAT人脸识别回调接口文档 V1.0.7.docx',
          'value': 'GAT人脸识别回调接口文档 V1.0.7.docx',
          'open': false,
          'type': 'file',
          'date': 1593400440,
          'size': '87520',
          'pId': '6'
        }
      ],
      searchFile: '',
      height: 0,
      visible: false,
      rightMenu: {}
    }
  },
  mounted() {
    this.rowDrop()
    this.height = document.querySelector('.layout-right').clientHeight - 107
  },
  methods: {
    handleUploadConfirm() {
      this.uploadShow = false
    },
    handleUploadCancel() {
      this.uploadShow = false
    },
    handleAction(e) {
      switch (e) {
        case 1:
          this.uploadShow = true
          break
        case 2:
          break
        case 3:
          break
        case 4:
          break
      }
    },
    handleTagsOver(index) {
      const tags = document.querySelectorAll('.right-contextMenu-item')
      const item = tags[index]
      item.style.cssText = `color:${this.$store.state.settings.theme};background:${
        this.$store.state.settings.theme.colorRgb()
      }`
    },
    handleTagsLeave(index) {
      const tags = document.querySelectorAll('.right-contextMenu-item')
      const item = tags[index]
      item.style.cssText = `color:#606266`
    },
    rightClick(a, b, c) {
      c.preventDefault()
      this.rightMenu = { top: c.pageY + 'px', left: c.pageX + 'px' }
      this.visible = true
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
.file-btn{
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin-left: 8px;
  .file-btn-item{
    width: 35px;
    height: 35px;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    border-radius: 3px;
    i{
      font-size: 20px;
      border-color: #ccc;
      color: #8a8a8a;
    }
  }
}
.file-btn-item-active{
  background-color: #e6e6e6;
}
.file-action{
  display: flex;
  justify-content: flex-end;
  align-items: center;
}
.dir{
  height: 36px;
  line-height: 36px;
}
.file-container /deep/ {
  .el-scrollbar__wrap::-webkit-scrollbar{
    display: none;
  }
  .el-table .cell{
    line-height: 35px;
  }
  .el-table thead{
    tr{
      background-color: #d8e5f0!important;
    }
  }
  .el-table .el-table__header-wrapper th{
    background-color: transparent;
  }
  .file-item-inner{
    width: 12%;
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
    width: 130px;
    height: 130px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    .file-item-icon{
      margin-bottom: 5px;
       img{
         width: 50px;
         height: 50px;
       }
    }
    .file-item-title{
      word-break: break-all;
      font-size: 14px;
      line-height: 20px;
      text-align: center;
      overflow: hidden;
      text-overflow:ellipsis;
      white-space: nowrap;
      width: 60%;
    }
    &:active{
      background-color: #f0f1f5;
    }
  }
  .el-scrollbar{
    height: calc(100vh - 220px);
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
    color: #333;
    span{
      margin-left: 6px;
      font-size: 14.3px;
    }
    //&:hover {
    //  color: currentColor;
    //  background: currentColor;
    //}
  }
}

</style>
