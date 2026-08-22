import { ElMessage } from 'element-plus'

/**
 * Global message helpers.
 *
 * These were previously defined inline in main.js and could only be reached via
 * `this.msgSuccess(...)`. Extracting them into a module also allows
 * `import { msgSuccess } from '@/utils/message'`.
 *
 * `<script setup>` has no `this`, so components migrated to the Composition API
 * must use the import form. main.js still registers them on globalProperties for
 * the Options API components that have not been migrated yet; drop that
 * registration once every page is migrated.
 */

export const msgSuccess = (msg: string) =>
  ElMessage({ showClose: true, message: msg, type: 'success' })

export const msgError = (msg: string) =>
  ElMessage({ showClose: true, message: msg, type: 'error' })

export const msgInfo = (msg: string) => ElMessage.info(msg)
