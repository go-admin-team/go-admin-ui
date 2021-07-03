<template>
  <div>
    <el-dialog
      v-dialogDrag
      :append-to-body="true"
      :show-close="false"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      :title="title"
      :width="width"
      :visible.sync="dialog"
    >
      <span>
        <slot name="content" />
      </span>
      <span slot="footer" class="dialog-footer">
        <el-button v-show="cancel" @click="handleCancel">{{ cancelText }}</el-button>
        <el-button v-show="confirm" type="primary" @click="handleConfirm">{{ confirmText }}</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
export default {
  name: 'CustomDialog',
  props: {
    dialog: {
      type: Boolean,
      default: false
    },
    cancel: {
      type: Boolean,
      default: false
    },
    cancelText: {
      type: String,
      default: '取 消'
    },
    confirm: {
      type: Boolean,
      default: true
    },
    confirmText: {
      type: String,
      default: '确 定'
    },
    width: {
      type: String,
      default: '30%'
    },
    title: {
      type: String,
      default: ''
    }
  },
  methods: {
    handleCancel() {
      this.$emit('cancel')
    },
    handleConfirm() {
      this.$emit('confirm')
    }
  }
}
</script>

<style lang="scss" scoped>
  ::v-deep .el-dialog__body{
    padding: 20px!important;
  }

  .el-dialog{
    margin: 0!important;
  }

  ::v-deep .el-dialog__header {
    border-bottom: 1px solid #e8e8e8;
  }

  ::v-deep .el-dialog__footer{
    border-top: 1px solid #e8e8e8;
    padding: 10px 20px!important;
    box-sizing: border-box;
  }

  ::v-deep .el-dialog__title{
    font-size: 16px;
  }
</style>
