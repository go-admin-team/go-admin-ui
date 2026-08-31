<template>
  <el-form ref="form" :model="user" :rules="rules" label-width="80px">
    <el-form-item :label="$t('profile.password.old')" prop="oldPassword">
      <el-input v-model="user.oldPassword" :placeholder="$t('profile.password.oldPlaceholder')" type="password" />
    </el-form-item>
    <el-form-item :label="$t('profile.password.new')" prop="newPassword">
      <el-input v-model="user.newPassword" :placeholder="$t('profile.password.newPlaceholder')" type="password" />
    </el-form-item>
    <el-form-item :label="$t('profile.password.confirm')" prop="confirmPassword">
      <el-input v-model="user.confirmPassword" :placeholder="$t('profile.password.confirmPlaceholder')" type="password" />
    </el-form-item>
    <el-form-item>
      <el-button type="primary" size="mini" @click="submit">{{ $t('profile.save') }}</el-button>
      <el-button type="danger" size="mini" @click="close">{{ $t('profile.close') }}</el-button>
    </el-form-item>
  </el-form>
</template>

<script>
import { useTagsViewStore } from '@/stores/tagsView'
import { updateUserPwd } from '@/api/admin/sys-user'

export default {
  data() {
    return {
      test: '1test',
      user: {
        oldPassword: undefined,
        newPassword: undefined,
        confirmPassword: undefined
      }
    }
  },
  computed: {
    /**
     * Rebuilt per render rather than held in data().
     *
     * data() runs once, so messages built from t() there would keep whichever
     * language the page was opened in -- including the one already displayed
     * under a field. el-form revalidates when its rules change, which is what
     * repaints a message that is on screen.
     *
     * The validator is a different case: it is called at validation time, so
     * the Error it raises is already resolved then.
     */
    rules() {
      const equalToPassword = (rule, value, callback) => {
        if (this.user.newPassword !== value) {
          callback(new Error(this.$t('profile.password.rules.mismatch')))
        } else {
          callback()
        }
      }
      return {
        oldPassword: [
          { required: true, message: this.$t('profile.password.rules.oldRequired'), trigger: 'blur' }
        ],
        newPassword: [
          { required: true, message: this.$t('profile.password.rules.newRequired'), trigger: 'blur' },
          { min: 6, max: 20, message: this.$t('profile.password.rules.length'), trigger: 'blur' }
        ],
        confirmPassword: [
          { required: true, message: this.$t('profile.password.rules.confirmRequired'), trigger: 'blur' },
          { required: true, validator: equalToPassword, trigger: 'blur' }
        ]
      }
    }
  },
  methods: {
    submit() {
      this.$refs['form'].validate(valid => {
        if (valid) {
          updateUserPwd(this.user.oldPassword, this.user.newPassword).then(
            response => {
              if (response.code === 200) {
                this.msgSuccess(response.msg)
              } else {
                this.msgError(response.msg)
              }
            }
          )
        }
      })
    },
    close() {
      useTagsViewStore().delView(this.$route)
      this.$router.push({ path: '/index' })
    }
  }
}
</script>
