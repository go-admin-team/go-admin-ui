<template>
  <el-form>
    <el-form-item label="Name">
      <el-input v-model.trim="userForm.name" />
    </el-form-item>
    <el-form-item label="Email">
      <el-input v-model.trim="userForm.email" />
    </el-form-item>
    <el-form-item>
      <el-button type="primary" @click="submit">Update</el-button>
    </el-form-item>
  </el-form>
</template>

<script>
export default {
  name: 'UserAccount',
  props: {
    user: {
      type: Object,
      default: () => {
        return {
          name: '',
          email: ''
        }
      }
    }
  },
  data() {
    return {
      userForm: { ...this.user }
    }
  },
  methods: {
    submit() {
      this.$message({
        message: 'User information has been updated successfully',
        type: 'success',
        duration: 5 * 1000
      })
    }
  }
}
</script>
