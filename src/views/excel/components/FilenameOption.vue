<template>
  <div style="display:inline-block;">
    <label class="radio-label" style="padding-left:0;">Filename: </label>
    <el-input v-model="filename" placeholder="Please enter the file name (default excel-list)" style="width:345px;">
      <template #prefix><i class="ri-file-text-line" /></template>
    </el-input>
  </div>
</template>

<script>
export default {
  name: 'FilenameOptionComponent',
  props: {
    value: {
      type: String,
      default: ''
    }
  },
  emits: ['input'],
  computed: {
    filename: {
      get() {
        return this.value
      },
      set(val) {
        this.$emit('input', val)
      }
    }
  }
}
</script>
