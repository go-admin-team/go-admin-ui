<template>
  <BasicLayout>
    <template #wrapper>
      <el-row :gutter="10">
        <el-col :span="6" :xs="24">
          <el-card class="box-card">
            <template #header>
              <div class="clearfix">
                <span>{{ $t('profile.title') }}</span>
              </div>
            </template>
            <div>
              <div class="text-center">
                <userAvatar :user="user" />
              </div>
              <ul class="list-group list-group-striped">
                <li class="list-group-item">
                  <svg-icon icon-class="user" />{{ $t('profile.username') }}
                  <div class="pull-right">{{ user.username }}</div>
                </li>
                <li class="list-group-item">
                  <svg-icon icon-class="phone" />{{ $t('profile.phone') }}
                  <div class="pull-right">{{ user.phone }}</div>
                </li>
                <li class="list-group-item">
                  <svg-icon icon-class="email" />{{ $t('profile.email') }}
                  <div class="pull-right">{{ user.email }}</div>
                </li>
                <li class="list-group-item">
                  <svg-icon icon-class="tree" />{{ $t('profile.dept') }}
                  <div class="pull-right">{{ deptName }}</div>
                </li>
                <li class="list-group-item">
                  <svg-icon icon-class="peoples" />{{ $t('profile.role') }}
                  <div class="pull-right">{{ roleName }}</div>
                </li>
                <li class="list-group-item">
                  <svg-icon icon-class="date" />{{ $t('profile.createdAt') }}
                  <div class="pull-right">{{ user.createdAt }}</div>
                </li>
              </ul>
            </div>
          </el-card>
        </el-col>
        <el-col :span="18" :xs="24">
          <el-card>
            <template #header>
              <div class="clearfix">
                <span>{{ $t('profile.basic') }}</span>
              </div>
            </template>
            <el-tabs v-model="activeTab">
              <el-tab-pane :label="$t('profile.tabs.info')" name="userinfo">
                <userInfo :user="user" />
              </el-tab-pane>
              <el-tab-pane :label="$t('profile.tabs.password')" name="resetPwd">
                <resetPwd :user="user" />
              </el-tab-pane>
            </el-tabs>
          </el-card>
        </el-col>
      </el-row>
    </template>
  </BasicLayout>
</template>

<script>
import userAvatar from './userAvatar'
import userInfo from './userInfo'
import resetPwd from './resetPwd'
import { getUserProfile } from '@/api/admin/sys-user'

export default {
  name: 'Profile',
  components: { userAvatar, userInfo, resetPwd },
  data() {
    return {
      user: {},
      roleGroup: {},
      postGroup: {},
      deptGroup: {},
      activeTab: 'userinfo',
      roleIds: undefined,
      postIds: undefined,
      roleName: undefined,
      postName: undefined,
      dept: {},
      deptName: undefined
    }
  },
  created() {
    this.getUser()
  },
  methods: {
    getUser() {
      getUserProfile().then(response => {
        this.user = response.data.user
        this.roleIds = response.data.user.roleIds
        this.roleGroup = response.data.roles

        if (this.roleIds[0]) {
          for (const key in this.roleGroup) {
            if (this.roleIds[0] === this.roleGroup[key].roleId) {
              this.roleName = this.roleGroup[key].roleName
            }
          }
        } else {
          this.roleName = this.$t('profile.noRole')
        }
        this.dept = response.data.user.dept
        this.deptName = this.dept.deptName
      })
    }
  }
}
</script>

<style lang="scss" scoped>
  .list-group-item{
    padding: 18px 0;
  }
  .svg-icon{
    margin-right: 5px;
  }
</style>
