<template>
  <BasicLayout>
    <template #wrapper>
      <div class="sys-config-set">

        <div class="config-wrapper">

          <!-- ── 左侧导航 ── -->
          <div class="config-sidebar">
            <div class="sidebar-header">
              <div class="sidebar-icon-box">
                <el-icon :size="18" color="#1677ff"><Setting /></el-icon>
              </div>
              <div>
                <p class="sidebar-header__title">系统配置</p>
                <p class="sidebar-header__sub">基础信息与外观设置</p>
              </div>
            </div>
            <div class="sidebar-divider" />
            <div
              v-for="(item, idx) in navItems"
              :key="idx"
              class="nav-item"
              :class="{ 'is-active': activeSection === idx }"
              @click="activeSection = idx"
            >
              <div class="nav-item__icon-wrap">
                <el-icon :size="15"><component :is="item.icon" /></el-icon>
              </div>
              <div class="nav-item__text">
                <span class="nav-item__label">{{ item.label }}</span>
                <span class="nav-item__sub">{{ item.sub }}</span>
              </div>
            </div>
          </div>

          <!-- ── 右侧主内容 ── -->
          <div class="config-main">

            <!-- 基础信息 -->
            <transition name="fade-slide" mode="out-in">
              <div v-if="activeSection === 0" key="basic" class="config-section">
                <div class="section-head">
                  <div class="section-head__icon-wrap">
                    <el-icon :size="16" color="#1677ff"><OfficeBuilding /></el-icon>
                  </div>
                  <div>
                    <p class="section-head__title">系统基础信息</p>
                    <p class="section-head__desc">配置系统名称、Logo 及用户默认密码</p>
                  </div>
                </div>

                <div class="section-body">
                  <!-- Logo -->
                  <div class="logo-zone">
                    <div class="logo-preview">
                      <img v-if="form.sys_app_logo" :src="form.sys_app_logo" alt="logo" class="logo-img">
                      <div v-else class="logo-empty">
                        <el-icon :size="24" color="#c0c4cc"><Picture /></el-icon>
                        <span>暂无 Logo</span>
                      </div>
                    </div>
                    <div class="logo-meta">
                      <p class="logo-meta__name">系统 Logo</p>
                      <p class="logo-meta__hint">推荐 200×200，支持 JPG / PNG，大小不超过 2MB</p>
                      <el-upload
                        :headers="headers"
                        :file-list="sys_app_logofileList"
                        :action="sys_app_logoAction"
                        :before-upload="sys_app_logoBeforeUpload"
                        :show-file-list="false"
                        :on-success="uploadSuccess"
                      >
                        <el-button size="small" plain type="primary">
                          <el-icon style="margin-right:4px"><Upload /></el-icon>上传图片
                        </el-button>
                      </el-upload>
                    </div>
                  </div>

                  <el-divider style="margin: 16px 0" />

                  <el-form ref="form" :model="form" :rules="rules" label-position="top">
                    <el-row :gutter="20">
                      <el-col :span="12">
                        <el-form-item label="系统名称" prop="sys_app_name">
                          <el-input v-model="form.sys_app_name" placeholder="请输入系统名称" clearable>
                            <template #prefix><el-icon><OfficeBuilding /></el-icon></template>
                          </el-input>
                        </el-form-item>
                      </el-col>
                      <el-col :span="12">
                        <el-form-item label="用户初始密码" prop="sys_user_initPassword">
                          <el-input v-model="form.sys_user_initPassword" placeholder="请输入初始密码" clearable show-password>
                            <template #prefix><el-icon><Lock /></el-icon></template>
                          </el-input>
                        </el-form-item>
                      </el-col>
                    </el-row>
                  </el-form>
                </div>
              </div>

              <!-- 外观设置 -->
              <div v-else-if="activeSection === 1" key="theme" class="config-section">
                <div class="section-head">
                  <div class="section-head__icon-wrap">
                    <el-icon :size="16" color="#1677ff"><Brush /></el-icon>
                  </div>
                  <div>
                    <p class="section-head__title">外观设置</p>
                    <p class="section-head__desc">调整皮肤样式与侧栏主题风格</p>
                  </div>
                </div>

                <div class="section-body">
                  <el-form label-position="top">
                    <el-row :gutter="20">
                      <el-col :span="12">
                        <el-form-item label="皮肤样式">
                          <el-select v-model="form.sys_index_skinName" placeholder="请选择皮肤样式" style="width:100%">
                            <el-option v-for="(item, i) in sys_index_skinNameOptions" :key="i" :label="item.label" :value="item.value" :disabled="item.disabled" />
                          </el-select>
                        </el-form-item>
                      </el-col>
                      <el-col :span="12">
                        <el-form-item label="侧栏主题">
                          <el-select v-model="form.sys_index_sideTheme" placeholder="请选择侧栏主题" style="width:100%">
                            <el-option v-for="(item, i) in sys_index_sideThemeOptions" :key="i" :label="item.label" :value="item.value" :disabled="item.disabled" />
                          </el-select>
                        </el-form-item>
                      </el-col>
                    </el-row>
                  </el-form>

                  <p class="theme-label">点击快速切换主题</p>
                  <div class="theme-row">
                    <div
                      class="theme-card"
                      :class="{ 'is-active': form.sys_index_sideTheme === 'theme-dark' }"
                      @click="form.sys_index_sideTheme = 'theme-dark'"
                    >
                      <div class="tc-preview tc-preview--dark">
                        <div class="tc-sidebar" />
                        <div class="tc-body">
                          <div class="tc-topbar" />
                          <div class="tc-content" />
                        </div>
                      </div>
                      <div class="tc-label">
                        <span>深色主题</span>
                        <el-icon v-if="form.sys_index_sideTheme === 'theme-dark'" color="#1677ff"><Check /></el-icon>
                      </div>
                    </div>
                    <div
                      class="theme-card"
                      :class="{ 'is-active': form.sys_index_sideTheme === 'theme-light' }"
                      @click="form.sys_index_sideTheme = 'theme-light'"
                    >
                      <div class="tc-preview tc-preview--light">
                        <div class="tc-sidebar" />
                        <div class="tc-body">
                          <div class="tc-topbar" />
                          <div class="tc-content" />
                        </div>
                      </div>
                      <div class="tc-label">
                        <span>浅色主题</span>
                        <el-icon v-if="form.sys_index_sideTheme === 'theme-light'" color="#1677ff"><Check /></el-icon>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </transition>

            <!-- 操作栏 -->
            <div class="config-footer">
              <el-button @click="resetForm">重置</el-button>
              <el-button type="primary" :loading="saving" @click="submitForm">保存设置</el-button>
            </div>

          </div>
        </div>

      </div>
    </template>
  </BasicLayout>
</template>

<script>
import { getSetConfig, updateSetConfig } from '@/api/admin/sys-config'
import { getToken } from '@/utils/auth'
import { Setting, OfficeBuilding, Lock, Picture, Upload, Brush, Check } from '@element-plus/icons-vue'

export default {
  name: 'SysConfigSet',
  setup() {
    return { Setting, OfficeBuilding, Lock, Picture, Upload, Brush, Check }
  },
  data() {
    return {
      activeSection: 0,
      saving: false,
      loading: false,
      configList: [],
      headers: { 'Authorization': 'Bearer ' + getToken() },
      form: {
        sys_app_name: undefined,
        sys_app_logo: null,
        sys_user_initPassword: undefined,
        sys_index_skinName: undefined,
        sys_index_sideTheme: undefined
      },
      rules: {
        sys_app_name: [{ required: true, message: '请输入系统名称', trigger: 'blur' }],
        sys_user_initPassword: [{ required: true, message: '请输入初始密码', trigger: 'blur' }]
      },
      sys_app_logoAction: process.env.VUE_APP_BASE_API + '/api/v1/public/uploadFile',
      sys_app_logofileList: [],
      sys_index_skinNameOptions: [{ label: '蓝色', value: 'skin-blue' }],
      sys_index_sideThemeOptions: [
        { label: '深色主题', value: 'theme-dark' },
        { label: '浅色主题', value: 'theme-light' }
      ]
    }
  },
  computed: {
    navItems() {
      return [
        { label: '基础信息', sub: '名称、Logo、密码', icon: this.OfficeBuilding },
        { label: '外观设置', sub: '皮肤与主题风格', icon: this.Brush }
      ]
    }
  },
  created() {
    this.getList()
  },
  methods: {
    getList() {
      this.loading = true
      getSetConfig().then(response => {
        this.form = response.data
        this.loading = false
      })
    },
    submitForm() {
      this.$refs['form'].validate(valid => {
        if (!valid) return
        this.saving = true
        const list = Object.keys(this.form).map(key => ({ configKey: key, configValue: this.form[key] }))
        updateSetConfig(list).then(response => {
          if (response.code === 200) {
            this.msgSuccess(response.msg)
            this.getList()
            const { sys_app_name, sys_app_logo } = this.form
            this.$store.commit('system/SET_INFO', { sys_app_logo, sys_app_name })
          } else {
            this.msgError(response.msg)
          }
        }).finally(() => { this.saving = false })
      })
    },
    resetForm() {
      this.$refs['form'].resetFields()
    },
    sys_app_logoBeforeUpload(file) {
      const ok = file.size / 1024 / 1024 < 2
      if (!ok) this.$message.error('文件大小超过 2MB')
      return ok
    },
    uploadSuccess(response) {
      this.form.sys_app_logo = process.env.VUE_APP_BASE_API + response.data.full_path
    }
  }
}
</script>

<style lang="scss" scoped>
// ── 页面容器 ──────────────────────────────────────────────
.sys-config-set {
  padding: 0;
}

.config-wrapper {
  display: flex;
  gap: 16px;
  align-items: flex-start;
}

// ══════════════════════════════
//  左侧导航卡
// ══════════════════════════════
.config-sidebar {
  width: 188px;
  flex-shrink: 0;
  background: #fff;
  border-radius: 8px;
  border: 1px solid #f0f0f0;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
  overflow: hidden;
}

.sidebar-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 14px 12px;
}

.sidebar-icon-box {
  width: 34px;
  height: 34px;
  border-radius: 8px;
  background: #e6f4ff;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.sidebar-header__title {
  margin: 0 0 2px;
  font-size: 14px;
  font-weight: 600;
  color: #000000d9;
  line-height: 1;
}

.sidebar-header__sub {
  margin: 0;
  font-size: 11px;
  color: #00000073;
  line-height: 1;
}

.sidebar-divider {
  height: 1px;
  background: #f0f0f0;
  margin: 0;
}

// 导航项
.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 11px 14px;
  cursor: pointer;
  border-left: 2px solid transparent;
  transition: all 0.15s;

  &:hover:not(.is-active) { background: #fafafa; }

  &.is-active {
    background: #e6f4ff;
    border-left-color: #1677ff;

    .nav-item__icon-wrap { color: #1677ff; background: rgba(22,119,255,0.1); }
    .nav-item__label { color: #1677ff; font-weight: 600; }
  }

  &:not(:last-child) { border-bottom: 1px solid #f5f5f5; }
}

.nav-item__icon-wrap {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #00000073;
  flex-shrink: 0;
  transition: all 0.15s;
}

.nav-item__text {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.nav-item__label {
  font-size: 13px;
  color: #000000d9;
  font-weight: 500;
  line-height: 1.3;
}

.nav-item__sub {
  font-size: 11px;
  color: #00000045;
  line-height: 1;
}

// ══════════════════════════════
//  右侧主内容
// ══════════════════════════════
.config-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

// 内容分区卡片
.config-section {
  background: #fff;
  border-radius: 8px;
  border: 1px solid #f0f0f0;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
  overflow: hidden;
}

// 分区头部
.section-head {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px;
  border-bottom: 1px solid #f0f0f0;
  background: #fafafa;
}

.section-head__icon-wrap {
  width: 30px;
  height: 30px;
  border-radius: 6px;
  background: #e6f4ff;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.section-head__title {
  margin: 0 0 2px;
  font-size: 14px;
  font-weight: 600;
  color: #000000d9;
  line-height: 1;
}

.section-head__desc {
  margin: 0;
  font-size: 12px;
  color: #00000073;
  line-height: 1;
}

// 分区内容体
.section-body {
  padding: 16px;
}

// ── Logo 区域 ──────────────────────────────────────────
.logo-zone {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 14px;
  background: #fafafa;
  border-radius: 6px;
  border: 1px dashed #d9d9d9;
}

.logo-preview {
  width: 72px;
  height: 72px;
  border-radius: 8px;
  border: 1px solid #e8e8e8;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  overflow: hidden;
}

.logo-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.logo-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  color: #c0c4cc;
  font-size: 11px;
}

.logo-meta { flex: 1; }

.logo-meta__name {
  margin: 0 0 3px;
  font-size: 13px;
  font-weight: 500;
  color: #000000d9;
}

.logo-meta__hint {
  margin: 0 0 10px;
  font-size: 12px;
  color: #00000073;
  line-height: 1.5;
}

// ── 主题选择 ─────────────────────────────────────────────
.theme-label {
  margin: 12px 0 10px;
  font-size: 12px;
  color: #00000073;
}

.theme-row {
  display: flex;
  gap: 12px;
}

.theme-card {
  width: 160px;
  border: 1px solid #e8e8e8;
  border-radius: 6px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s;

  &:hover { border-color: #4096ff; box-shadow: 0 2px 8px rgba(22,119,255,0.12); }

  &.is-active {
    border-color: #1677ff;
    box-shadow: 0 2px 8px rgba(22,119,255,0.2);
  }
}

.tc-preview {
  display: flex;
  height: 80px;
}

.tc-preview--dark {
  background: #1e2a3b;
  .tc-sidebar  { background: #001529; }
  .tc-topbar   { background: #162131; height: 16px; }
  .tc-content  { flex: 1; background: #1e2a3b; }
}

.tc-preview--light {
  background: #f5f5f5;
  .tc-sidebar  { background: #fff; border-right: 1px solid #f0f0f0; }
  .tc-topbar   { background: #fff; height: 16px; border-bottom: 1px solid #f0f0f0; }
  .tc-content  { flex: 1; background: #f5f5f5; }
}

.tc-sidebar {
  width: 36px;
  height: 100%;
  flex-shrink: 0;
}

.tc-body {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.tc-label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 10px;
  font-size: 12px;
  color: #000000d9;
  background: #fff;
  border-top: 1px solid #f0f0f0;
}

// ── 底部操作栏 ────────────────────────────────────────────
.config-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px 16px;
  background: #fff;
  border-radius: 8px;
  border: 1px solid #f0f0f0;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
}

// ── 过渡动画 ─────────────────────────────────────────────
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: opacity 0.15s, transform 0.15s;
}

.fade-slide-enter-from { opacity: 0; transform: translateY(6px); }
.fade-slide-leave-to   { opacity: 0; transform: translateY(-6px); }
</style>
