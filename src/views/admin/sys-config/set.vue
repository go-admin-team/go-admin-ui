<template>
  <PageContainer>
    <div class="sys-config-set">

      <div class="config-wrapper">

        <!-- ── 左侧导航 ── -->
        <div class="config-sidebar">
          <div class="sidebar-header">
            <div class="sidebar-icon-box">
              <el-icon :size="18" class="accent-icon"><Setting /></el-icon>
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
                  <el-icon :size="16" class="accent-icon"><OfficeBuilding /></el-icon>
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
                      <el-icon :size="24"><Picture /></el-icon>
                      <span>暂无 Logo</span>
                    </div>
                  </div>
                  <div class="logo-meta">
                    <p class="logo-meta__name">系统 Logo</p>
                    <p class="logo-meta__hint">推荐 200×200，支持 JPG / PNG，大小不超过 2MB</p>
                    <el-upload
                      :headers="uploadHeaders"
                      :action="uploadAction"
                      :before-upload="beforeLogoUpload"
                      :show-file-list="false"
                      :on-success="onLogoUploaded"
                    >
                      <el-button size="small" plain type="primary">
                        <el-icon style="margin-right:4px"><Upload /></el-icon>上传图片
                      </el-button>
                    </el-upload>
                  </div>
                </div>

                <el-divider style="margin: 16px 0" />

                <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
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
                  <el-icon :size="16" class="accent-icon"><Brush /></el-icon>
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
                          <el-option v-for="(item, i) in sys_index_skinNameOptions" :key="i" :label="item.label" :value="item.value" />
                        </el-select>
                      </el-form-item>
                    </el-col>
                    <el-col :span="12">
                      <el-form-item label="侧栏主题">
                        <el-select v-model="form.sys_index_sideTheme" placeholder="请选择侧栏主题" style="width:100%">
                          <el-option v-for="(item, i) in sys_index_sideThemeOptions" :key="i" :label="item.label" :value="item.value" />
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
                      <el-icon v-if="form.sys_index_sideTheme === 'theme-dark'" class="accent-icon"><Check /></el-icon>
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
                      <el-icon v-if="form.sys_index_sideTheme === 'theme-light'" class="accent-icon"><Check /></el-icon>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </transition>

          <!-- 操作栏 -->
          <div class="config-footer">
            <el-button :loading="loading" @click="load">重置</el-button>
            <el-button type="primary" :loading="saving" @click="submit">保存设置</el-button>
          </div>

        </div>
      </div>

    </div>
  </PageContainer>
</template>

<script setup lang="ts">
import { ref, shallowRef, onMounted } from 'vue'
import type { FormInstance, FormRules, UploadProps } from 'element-plus'
import { ElMessage } from 'element-plus'
import { OfficeBuilding, Lock, Picture, Upload, Brush, Check, Setting } from '@element-plus/icons-vue'

import PageContainer from '@/components/PageContainer/index.vue'
import { getSetConfig, updateSetConfig } from '@/api/admin/sys-config'
import { getToken } from '@/utils/auth'
import { useSystemStore } from '@/stores/system'
import { msgSuccess } from '@/utils/message'

// Must match the menu_name the backend serves, or keep-alive silently misses
defineOptions({ name: 'SysConfigSet' })

/**
 * The settings this page owns, and the only keys it will ever send.
 *
 * The previous version assigned the whole response over `form`. The controls
 * still render either way, so nothing looks wrong -- but `submit` builds its
 * body from the keys the object actually has, so a setting the server happened
 * to omit was silently dropped from the next save. Merging into these defaults
 * keeps the shape fixed no matter what comes back.
 */
const defaults = () => ({
  sys_app_name: '',
  sys_app_logo: '',
  sys_user_initPassword: '',
  sys_index_skinName: '',
  sys_index_sideTheme: ''
})

type ConfigForm = ReturnType<typeof defaults>

const form = ref<ConfigForm>(defaults())
const formRef = ref<FormInstance>()
const loading = ref(false)
const saving = ref(false)
const activeSection = ref(0)

const rules: FormRules = {
  sys_app_name: [{ required: true, message: '请输入系统名称', trigger: 'blur' }],
  sys_user_initPassword: [{ required: true, message: '请输入初始密码', trigger: 'blur' }]
}

// shallowRef: these are component definitions, and making them deeply reactive
// buys nothing while costing a walk of every icon's internals
const navItems = shallowRef([
  { label: '基础信息', sub: '名称、Logo、密码', icon: OfficeBuilding },
  { label: '外观设置', sub: '皮肤与主题风格', icon: Brush }
])

const sys_index_skinNameOptions = [{ label: '蓝色', value: 'skin-blue' }]
const sys_index_sideThemeOptions = [
  { label: '深色主题', value: 'theme-dark' },
  { label: '浅色主题', value: 'theme-light' }
]

/**
 * Doubles as the reset button.
 *
 * Reset refetches rather than calling resetFields. Both put the saved values
 * back today, but resetFields restores what each item held when it mounted,
 * which is only the saved state because the request happens to land first --
 * and it covers only the two fields inside the el-form, leaving the theme
 * cards and the logo on whatever the user last clicked.
 */
const load = async() => {
  if (loading.value) return
  loading.value = true
  try {
    const response = await getSetConfig()
    form.value = { ...defaults(), ...(response.data ?? {}) }
    formRef.value?.clearValidate()
  } catch {
    // Reported by the interceptor
  } finally {
    loading.value = false
  }
}

onMounted(load)

const submit = async() => {
  if (saving.value) return
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  saving.value = true
  try {
    const entries = Object.entries(form.value)
      .map(([configKey, configValue]) => ({ configKey, configValue }))
    const response = await updateSetConfig(entries)
    msgSuccess(response.msg || '保存成功')

    // The name and logo are in the shell, so the store has to hear about it
    useSystemStore().setInfo({
      sys_app_name: form.value.sys_app_name,
      sys_app_logo: form.value.sys_app_logo
    })
    // No refetch: the interceptor already rejected anything but a 200, and the
    // endpoint answers with an ack rather than the stored record, so a GET here
    // would return the values just sent
    formRef.value?.clearValidate()
  } catch {
    // Reported by the interceptor
  } finally {
    saving.value = false
  }
}

// ── Logo upload ───────────────────────────────────────────────────
const uploadHeaders = { Authorization: 'Bearer ' + getToken() }
const uploadAction = process.env.VUE_APP_BASE_API + '/api/v1/public/uploadFile'

const beforeLogoUpload: UploadProps['beforeUpload'] = file => {
  const withinLimit = file.size / 1024 / 1024 < 2
  if (!withinLimit) ElMessage.error('文件大小超过 2MB')
  return withinLimit
}

const onLogoUploaded: UploadProps['onSuccess'] = response => {
  form.value.sys_app_logo = process.env.VUE_APP_BASE_API + response.data.full_path
}
</script>

<style lang="scss" scoped>
/* Every colour below comes from the token set, so the page follows the app's
   light and dark themes. It used to hardcode #fff panels and near-black text,
   which made it a white slab in dark mode. */

.accent-icon {
  color: var(--ga-brand);
}

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
  background: var(--ga-bg-container);
  border-radius: 8px;
  border: 1px solid var(--ga-border-light);
  box-shadow: 0 1px 2px var(--ga-shadow-1, rgba(0,0,0,0.05));
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
  background: var(--ga-bg-hover);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.sidebar-header__title {
  margin: 0 0 2px;
  font-size: 14px;
  font-weight: 600;
  color: var(--ga-text-1);
  line-height: 1;
}

.sidebar-header__sub {
  margin: 0;
  font-size: 11px;
  color: var(--ga-text-2);
  line-height: 1;
}

.sidebar-divider {
  height: 1px;
  background: var(--ga-border-light);
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

  &:hover:not(.is-active) { background: var(--ga-bg-subtle); }

  &.is-active {
    background: var(--ga-bg-hover);
    border-left-color: var(--ga-brand);

    .nav-item__icon-wrap { color: var(--ga-brand); background: var(--ga-bg-hover); }
    .nav-item__label { color: var(--ga-brand); font-weight: 600; }
  }

  &:not(:last-child) { border-bottom: 1px solid var(--ga-bg-subtle); }
}

.nav-item__icon-wrap {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  background: var(--ga-bg-subtle);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--ga-text-2);
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
  color: var(--ga-text-1);
  font-weight: 500;
  line-height: 1.3;
}

.nav-item__sub {
  font-size: 11px;
  color: var(--ga-text-3);
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
  background: var(--ga-bg-container);
  border-radius: 8px;
  border: 1px solid var(--ga-border-light);
  box-shadow: 0 1px 2px var(--ga-shadow-1, rgba(0,0,0,0.05));
  overflow: hidden;
}

// 分区头部
.section-head {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px;
  border-bottom: 1px solid var(--ga-border-light);
  background: var(--ga-bg-subtle);
}

.section-head__icon-wrap {
  width: 30px;
  height: 30px;
  border-radius: 6px;
  background: var(--ga-bg-hover);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.section-head__title {
  margin: 0 0 2px;
  font-size: 14px;
  font-weight: 600;
  color: var(--ga-text-1);
  line-height: 1;
}

.section-head__desc {
  margin: 0;
  font-size: 12px;
  color: var(--ga-text-2);
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
  background: var(--ga-bg-subtle);
  border-radius: 6px;
  border: 1px dashed var(--ga-border);
}

.logo-preview {
  width: 72px;
  height: 72px;
  border-radius: 8px;
  border: 1px solid var(--ga-border);
  background: var(--ga-bg-container);
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
  color: var(--ga-text-3);
  font-size: 11px;
}

.logo-meta { flex: 1; }

.logo-meta__name {
  margin: 0 0 3px;
  font-size: 13px;
  font-weight: 500;
  color: var(--ga-text-1);
}

.logo-meta__hint {
  margin: 0 0 10px;
  font-size: 12px;
  color: var(--ga-text-2);
  line-height: 1.5;
}

// ── 主题选择 ─────────────────────────────────────────────
.theme-label {
  margin: 12px 0 10px;
  font-size: 12px;
  color: var(--ga-text-2);
}

.theme-row {
  display: flex;
  gap: 12px;
}

.theme-card {
  width: 160px;
  border: 1px solid var(--ga-border);
  border-radius: 6px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s;

  &:hover { border-color: var(--ga-brand); box-shadow: 0 2px 8px color-mix(in oklab, var(--ga-brand) 18%, transparent); }

  &.is-active {
    border-color: var(--ga-brand);
    box-shadow: 0 2px 8px color-mix(in oklab, var(--ga-brand) 28%, transparent);
  }
}

.tc-preview {
  display: flex;
  height: 80px;
}

// The two previews draw what each sidebar theme looks like, so their colours
// are content, not chrome: they must stay literal in either app theme.
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
  color: var(--ga-text-1);
  background: var(--ga-bg-container);
  border-top: 1px solid var(--ga-border-light);
}

// ── 底部操作栏 ────────────────────────────────────────────
.config-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px 16px;
  background: var(--ga-bg-container);
  border-radius: 8px;
  border: 1px solid var(--ga-border-light);
  box-shadow: 0 1px 2px var(--ga-shadow-1, rgba(0,0,0,0.05));
}

// ── 过渡动画 ─────────────────────────────────────────────
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: opacity 0.15s, transform 0.15s;
}

.fade-slide-enter-from { opacity: 0; transform: translateY(6px); }
.fade-slide-leave-to   { opacity: 0; transform: translateY(-6px); }
</style>
