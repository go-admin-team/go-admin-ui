<template>
  <div class="app-probe">probe</div>
</template>

<script setup lang="ts">
/**
 * The one page under src/apps/ that is committed rather than synced.
 *
 * src/apps/ is otherwise build output -- .gitignore excludes it and
 * scripts/sync-apps.mjs fills it -- but import.meta.glob is a compile-time
 * macro evaluated against the real filesystem, so a test for the apps branch of
 * loadView needs a file that is genuinely there when the suite runs. The
 * .gitignore carries a matching negation for this directory alone.
 *
 * What it protects: if the glob key loadView builds for an app page ever stops
 * matching what import.meta.glob produces, every app page silently falls back
 * to the AppNotInstalled placeholder -- which looks exactly like an app that
 * was never installed, so nobody would report it as a bug.
 *
 * Nothing else may depend on this file; scripts/sync-apps.mjs leaves it alone.
 */
defineOptions({ name: 'AppFixtureProbe' })
</script>
