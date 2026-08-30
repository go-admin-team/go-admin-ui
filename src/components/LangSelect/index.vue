<template>
  <el-dropdown trigger="click" @command="choose">
    <div class="lang-select" :title="$t('layout.language')">
      <i class="ri-translate-2" />
    </div>
    <template #dropdown>
      <el-dropdown-menu>
        <el-dropdown-item
          v-for="option in LOCALES"
          :key="option.value"
          :command="option.value"
          :disabled="option.value === locale"
        >
          {{ option.label }}
        </el-dropdown-item>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { LOCALES, setLocale, type Locale } from '@/lang'

/**
 * The language switcher.
 *
 * Shown on phones as well as desktop, unlike the search and fullscreen buttons
 * beside it: someone whose interface is in the wrong language has no other way
 * back, and the switcher is exactly what they are looking for.
 *
 * The current language is disabled rather than hidden so the list does not
 * reshuffle as you switch, and each entry is written in its own language --
 * "English", not "英语" -- because the person reading it may not read the
 * current one.
 */
const { locale } = useI18n()

const choose = (value: Locale) => { void setLocale(value) }
</script>

<style lang="scss" scoped>
.lang-select {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  font-size: 18px;
  cursor: pointer;
}
</style>
