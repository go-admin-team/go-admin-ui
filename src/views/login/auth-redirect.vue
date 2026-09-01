<template>
  <div class="auth-redirect" />
</template>

<script setup lang="ts">
import { onMounted } from 'vue'

/**
 * Landing page for an OAuth popup.
 *
 * A third-party sign-in opens this route in a popup window; the provider sends
 * the popup back here with an authorization code. Parking that code in
 * localStorage is how it reaches the ORIGINAL window, which does not share this
 * popup's JS heap and picks it up through a `storage` event.
 *
 * Nothing drives a visitor here yet. The Vue 2 form this replaces --
 * `render: function(h) { return h() }` -- stopped working when the project
 * moved to Vue 3, where render receives no `h` and calling it with no arguments
 * throws, and nobody noticed because the only two links to it were the
 * commented-out sample buttons in SocialSignin.vue, removed in this same
 * change. The route and its entry in the whitelist in src/permission.js are
 * kept for whichever provider is wired up first.
 *
 * Deliberately no more than this. Reading the provider back out, choosing
 * between `postMessage` and the `storage` event, showing an error state --
 * those belong to the sign-in framework, and guessing at their shape now would
 * only be something to undo later.
 */
defineOptions({ name: 'AuthRedirect' })

/** Where localStorage carries the code; read by whoever opened the popup. */
const STORAGE_KEY = 'x-admin-oauth-code'

/**
 * The provider's parameters, from whichever half of the URL they arrived in.
 *
 * The Vue 2 version read `location.search` alone, which is right for a
 * redirect URI of the form `https://host/auth-redirect?code=...`. This
 * application routes on the hash (createWebHashHistory in src/router), so that
 * URL does not reach this route at all -- the shape that does is
 * `https://host/#/auth-redirect?code=...`, where the parameters sit after the
 * route inside the hash and `location.search` is empty. Reading both leaves
 * the original behaviour untouched wherever it worked and covers the form this
 * router actually produces.
 *
 * Returned whole rather than parsed: the opener owns the token exchange and
 * knows which parameters its provider sends. This page does not.
 */
const providerQuery = () => {
  const search = window.location.search.slice(1)
  if (search) return search

  const hash = window.location.hash
  const start = hash.indexOf('?')
  return start === -1 ? '' : hash.slice(start + 1)
}

onMounted(() => {
  if (!window.localStorage) return

  const query = providerQuery()
  if (!query) {
    // Still written, so an opener waiting on the storage event learns the
    // popup came back rather than waiting for one that never fires. Said out
    // loud because an empty value is otherwise indistinguishable from a
    // provider that simply sends nothing.
    console.warn(`[auth-redirect] no parameters on ${window.location.href}; storing an empty ${STORAGE_KEY}`)
  }

  window.localStorage.setItem(STORAGE_KEY, query)
  window.close()
})
</script>
