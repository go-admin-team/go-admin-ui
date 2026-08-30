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
import { msgError } from '@/utils/message'

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
const { locale, t } = useI18n()

/**
 * Switching can fail: the pack for another language is a separate chunk, and
 * this project is deployed to intranets and offline networks where a partial
 * deploy is a real possibility. Discarding the promise left the click doing
 * nothing at all, with only an unhandled rejection in a console nobody has
 * open.
 *
 * The message is rendered in the language still in effect -- the switch did not
 * happen -- which is the one the reader can already read.
 */
const choose = async(value: Locale) => {
  try {
    await setLocale(value)
  } catch(error) {
    console.error(`could not load the language pack for ${value}`, error)
    msgError(t('layout.languageFailed'))
  }
}
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
