<template>
  <div id="lpc-quill">
    <quill-editor
      ref="myQuillEditor"
      v-model="content"
      class="ql-container"
      :options="editorOption"
    />

    <el-upload
      v-show="false"
      ref="upload"
      :data="{type:'1'}"
      class="upload-demo"
      :action="url"
      :on-success="upScuccess"
    />
  </div>
</template>

<script>
// 引入富文本编辑器
import { quillEditor } from 'vue-quill-editor'
import 'quill/dist/quill.core.css'
import 'quill/dist/quill.snow.css'
import 'quill/dist/quill.bubble.css'
export default {
  name: 'Richtext',
  components: {
    quillEditor
  },
  data() {
    return {
      url: process.env.VUE_APP_BASE_API + '/api/v1/public/uploadFile',
      content: null,
      // 富文本编辑器配置
      editorOption: {
        placeholder: '请在这里输入',
        modules: {
          toolbar: {
            container: [
              ['bold', 'italic', 'underline', 'strike'], // 加粗，斜体，下划线，删除线
              ['blockquote', 'code-block'], // 引用，代码块
              [{ header: 1 }, { header: 2 }], // 标题，键值对的形式；1、2表示字体大小
              [{ list: 'ordered' }, { list: 'bullet' }], // 列表
              [{ script: 'sub' }, { script: 'super' }], // 上下标
              [{ indent: '-1' }, { indent: '+1' }], // 缩进
              [{ direction: 'rtl' }], // 文本方向
              [{ size: ['small', false, 'large', 'huge'] }], // 字体大小
              [{ header: [1, 2, 3, 4, 5, 6, false] }], // 几级标题
              [{ color: [] }, { background: [] }], // 字体颜色，字体背景颜色
              [{ font: [] }], // 字体
              [{ align: [] }], // 对齐方式
              ['clean'], // 清除字体样式
              ['image'] // 上传图片、上传视频
            ],
            handlers: {
              image: value => {
                if (value) {
                  document.querySelector('#lpc-quill .upload-demo input').click()
                } else {
                  this.quill.format('image', false)
                }
              }
            }
          }
        },
        theme: 'snow'
      }
    }
  },
  methods: {
    upScuccess(res, file) {
      // 附件上传
      // 富文本图片上传
      const quill = this.$refs.myQuillEditor.quill
      if (res.code === 200) {
        const length = quill.getSelection().index // 获取光标所在位置
        quill.insertEmbed(
          length,
          'image',
          res.data.full_path
        ) // 插入图片
        quill.setSelection(length + 1) // 调整光标位置到最后
      }
    },
    getValue(e) {
      return this.content
    }
  }
}
</script>

<style lang="scss" scoped>
</style>
