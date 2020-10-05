<template>
  <div>
    <el-dialog
      :visible.sync="dialog"
      width="30%"
      append-to-body
      :before-close="handleClose"
    >
      <div slot="title" class="file-title">
        系统资源选择器(<small>已选择：{{ resultList.length }}个</small>)
      </div>
      <div class="file-header">
        <el-cascader
          v-model="value"
          :options="options"
          clearable
          :props="{ expandTrigger: 'hover', checkStrictly: true, value: 'id' }"
          @change="handleChange"
        />
      </div>
      <div class="file-footer">
        <el-card>
          <el-scrollbar>
            <div class="file-footer-inner">
              <div
                v-for="(item,index) in fileList"
                :key="item.id"
                class="file-footer-item"
                :class=" item.open ? 'file-active' : '' "
                @click="handleChoose(item,index)"
              >
                <div class="file-footer-item-inner">
                  <div class="file-footer-item-icon">
                    <img :src="item.fullUrl | formatFile" alt="">
                  </div>
                  <div class="file-footer-item-title">
                    {{ item.name }}
                  </div>
                  <div class="file-footer-item-mask">
                    <i class="el-icon-check" />
                  </div>
                </div>
              </div>
            </div>
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
        </el-card>
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button @click="handleCancel">取 消</el-button>
        <el-button type="primary" @click="handleConfirm">确 定</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import {
  sysfiledirList,
  sysfileinfoList
} from '@/api/file'
// import { filter } from 'jszip'
export default {
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
  props: {
    multiple: {
      type: Boolean,
      default: true
    },
    dialogFormVisible: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      value: [],
      options: [],
      fileList: [],
      total: 0,
      pageNo: 1,
      pageSize: 12,
      resultList: [],
      dialog: this.dialogFormVisible
    }
  },
  watch: {
    dialogFormVisible(val) {
      this.dialog = val
    }
  },
  created() {
    this.getFileDir()
  },
  methods: {
    handleCancel() {
      this.dialog = false
      this.$emit('close')
    },
    handleConfirm() {
      this.dialog = false
      this.$emit('confirm', this.resultList)
      this.$emit('close')
    },
    getFileDir() {
      sysfiledirList().then(ret => {
        if (ret.code === 200) {
          this.options = ret.data
        }
      })
    },
    getFileInfo(id) {
      sysfileinfoList({
        pId: id,
        pageIndex: this.pageNo,
        pageSize: this.pageSize
      }).then(ret => {
        if (ret.code === 200) {
          this.total = ret.data.count
          this.fileList = ret.data.list.map(item => {
            return {
              ...item,
              open: false
            }
          })
          this.updateStatus()
        }
      })
    },
    handleClose() {
      this.handleCancel()
    },
    handleChange() {
      const id = this.value[this.value.length - 1]
      this.total = 0
      this.pageNo = 1
      this.fileList.length = 0
      if (id) {
        this.getFileInfo(id)
      }
    },
    handlePage(e) {
      this.pageNo = e
      const id = this.value[this.value.length - 1]
      if (id) {
        this.getFileInfo(id)
      }
    },
    handleChoose(e, index) {
      if (this.multiple) {
        const fileIndex = this.resultList.findIndex(item => item.id === e.id)
        if (e.open) {
          if (fileIndex < 0) {
            return false
          }
          this.resultList.splice(fileIndex, 1)
        } else {
          if (fileIndex > 0) {
            return false
          }
          this.resultList.push(e)
          this.resultList = Array.from(new Set(this.resultList))
        }
      } else {
        if (e.open) {
          this.resultList.length = 0
        } else {
          this.resultList.length = 0
          this.resultList.push(e)
        }
      }
      this.updateStatus()
    },
    updateStatus() {
      if (this.multiple) {
        for (let i = 0; i < this.fileList.length; i++) {
          this.fileList[i].open = false
          for (let j = 0; j < this.resultList.length; j++) {
            if (this.resultList[j].id === this.fileList[i].id) {
              this.fileList[i].open = true
            }
            continue
          }
        }
      } else {
        for (let i = 0; i < this.fileList.length; i++) {
          if (this.resultList.every(e => e.id === this.fileList[i].id)) {
            this.fileList[i].open = true
          } else {
            this.fileList[i].open = false
          }
        }
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.file-header {
  .el-cascader {
    width: 100%;
  }
}
.file-footer /deep/ {
  margin-top: 20px;
  height: 440px;
  .el-card {
    height: 100%;
  }
  .el-scrollbar {
    height: 385px;
  }
  .page{
      width: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 35px;
  }
  .file-footer-inner {
    display: flex;
    justify-content: flex-start;
    align-items: center;
    flex-wrap: wrap;
    .file-footer-item {
      width: 25%;
      margin-bottom: 17px;
      cursor: pointer;
      display: flex;
      justify-content: center;
      align-items: center;
      .file-footer-item-inner {
        position: relative;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        width: 100px;
        height: 110px;
        border: 2px solid #f0f1f5;
        padding: 5px 10px;
        border-radius: 5px;
        overflow: hidden;
        transition: all 0.8ms;
        .file-footer-item-icon {
          width: 70px;
          height: 70px;
          img {
            width: 100%;
            height: 100%;
          }
        }
        .file-footer-item-title {
          font-size: #737373;
          width: 100%;
          text-align: center;
          height: 20px;
          line-height: 20px;
          overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
        }
        .file-footer-item-mask {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba($color: #0f82ff, $alpha: 0.3);
          display: flex;
          justify-content: center;
          align-items: center;
          opacity: 0;
          i {
            color: #fff;
            font-weight: bolder;
            font-size: 35px;
          }
        }
      }
    }
  }
  .el-card__body {
    height: 100%;
    padding: 20px 10px 0 10px !important;
  }
  .el-scrollbar__wrap::-webkit-scrollbar {
    display: none;
  }
  .el-scrollbar__wrap {
    margin-right: 0 !important;
  }
  .file-active {
    .file-footer-item-inner {
      border-color: #0f82ff !important;
    }
    .file-footer-item-mask{
        opacity: 1!important;
    }
  }
}
.file-title{
    small{
        color: #0f82ff !important;;
    }
}
</style>
