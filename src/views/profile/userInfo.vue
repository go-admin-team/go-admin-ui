<template>
  <el-form ref="form" :model="userForm" :rules="rules" label-width="80px">
    <el-form-item :label="$t('profile.info.nickName')" prop="nickName">
      <el-input v-model="userForm.nickName" />
    </el-form-item>
    <el-form-item :label="$t('profile.info.phone')" prop="phone">
      <el-input v-model="userForm.phone" maxlength="11" />
    </el-form-item>
    <el-form-item :label="$t('profile.info.email')" prop="email">
      <el-input v-model="userForm.email" maxlength="50" />
    </el-form-item>
    <el-form-item :label="$t('profile.info.sex')">
      <el-radio-group v-model="userForm.sex">
        <el-radio label="0">{{ $t('profile.info.male') }}</el-radio>
        <el-radio label="1">{{ $t('profile.info.female') }}</el-radio>
      </el-radio-group>
    </el-form-item>
    <el-form-item>
      <el-button type="primary" size="mini" @click="submit">{{ $t('profile.save') }}</el-button>
      <el-button type="danger" size="mini" @click="close">{{ $t('profile.close') }}</el-button>
    </el-form-item>
  </el-form>
</template>

<script>
import { useTagsViewStore } from '@/stores/tagsView'
import { updateUser } from '@/api/admin/sys-user'

export default {
  props: {
    // eslint-disable-next-line vue/require-default-prop
    user: { type: Object }
  },
  data() {
    return {
      userForm: { ...this.user }
    }
  },
  computed: {
    /**
     * Rebuilt per render rather than held in data(), which runs once: a message
     * built from t() there keeps whichever language the page was opened in,
     * including one already displayed under a field.
     */
    rules() {
      return {
        nickName: [
          { required: true, message: this.$t('profile.info.rules.nickName'), trigger: 'blur' }
        ],
        email: [
          { required: true, message: this.$t('profile.info.rules.emailRequired'), trigger: 'blur' },
          {
            type: 'email',
            message: this.$t('profile.info.rules.emailFormat'),
            trigger: ['blur', 'change']
          }
        ],
        phone: [
          { required: true, message: this.$t('profile.info.rules.phoneRequired'), trigger: 'blur' },
          {
            pattern: /^1[3|4|5|6|7|8|9][0-9]\d{8}$/,
            message: this.$t('profile.info.rules.phoneFormat'),
            trigger: 'blur'
          }
        ]
      }
    }
  },
  methods: {
    submit() {
      this.$refs['form'].validate(valid => {
        if (valid) {
          updateUser(this.userForm).then(response => {
            if (response.code === 200) {
              this.msgSuccess(response.msg)
            } else {
              this.msgError(response.msg)
            }
          })
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
