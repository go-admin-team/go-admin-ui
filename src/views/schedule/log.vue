<template>
  <PageContainer>
    <div class="job-log">
      <div class="job-log__bar">
        <span class="job-log__state" :class="`is-${state}`">
          <i class="job-log__dot" />{{ STATE_LABEL[state] }}
        </span>
        <span class="job-log__count">{{ lines.length }} 行</span>
        <div class="job-log__actions">
          <el-button :disabled="!lines.length" @click="lines = []">清空</el-button>
          <el-button v-if="state === 'closed'" type="primary" @click="connect">重连</el-button>
        </div>
      </div>

      <div ref="viewport" class="job-log__viewport">
        <p v-if="!lines.length" class="job-log__empty">
          {{ state === 'open' ? '已连接，等待任务输出…' : '未连接' }}
        </p>
        <!-- Newest last, so the stream reads the way a terminal does. The
             previous version unshifted, which put the newest line on top and
             then scrolled nowhere. -->
        <p v-for="line in lines" :key="line.id" class="job-log__line">
          <span class="job-log__time">{{ line.at }}</span>{{ line.text }}
        </p>
      </div>
    </div>
  </PageContainer>
</template>

<script setup lang="ts">
import { ref, nextTick, onMounted, onBeforeUnmount } from 'vue'
import PageContainer from '@/components/PageContainer/index.vue'
import { unWsLogout } from '@/api/ws'
import { useUserStore } from '@/stores/user'

defineOptions({ name: 'JobLog' })

type State = 'connecting' | 'open' | 'closed'

const STATE_LABEL: Record<State, string> = {
  connecting: '连接中',
  open: '已连接',
  closed: '已断开'
}

const state = ref<State>('connecting')
const lines = ref<Array<{ id: number, at: string, text: string }>>([])
const viewport = ref<HTMLElement>()

let socket: WebSocket | null = null
let closing = false
let seq = 0

const channel = { id: crypto.randomUUID(), group: 'log' }

/**
 * The stream lives on the API host, so its address comes from the same place
 * every request does.
 *
 * This used to be the literal `ws://127.0.0.1:8000`, which worked on the machine
 * it was written on and nowhere else -- and never on https, where a browser
 * refuses a plaintext ws:// from a secure page. An empty VUE_APP_BASE_API means
 * same-origin, which is how the production build is configured.
 */
const streamUrl = () => {
  const base = process.env.VUE_APP_BASE_API || window.location.origin
  const url = new URL(base, window.location.origin)
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
  url.pathname = `/ws/${channel.id}/${channel.group}`
  url.searchParams.set('token', useUserStore().token ?? '')
  return url.toString()
}

/**
 * How many lines the viewport keeps.
 *
 * A busy job can push thousands, and every one of them is a live DOM node with
 * its own layout state -- which then makes each scrollHeight read more
 * expensive than the last. A console keeps a window, not a transcript.
 */
const MAX_LINES = 2000

let scrollQueued = false

const append = (text: string) => {
  lines.value.push({
    id: seq++,
    at: new Date().toLocaleTimeString('zh-CN', { hour12: false }),
    text
  })
  if (lines.value.length > MAX_LINES) lines.value.splice(0, lines.value.length - MAX_LINES)

  // Follow the tail, the way `tail -f` does. One scroll per burst: a flush of a
  // thousand messages would otherwise queue a thousand callbacks that each
  // force a layout to land on the same final position.
  if (scrollQueued) return
  scrollQueued = true
  void nextTick(() => {
    scrollQueued = false
    if (viewport.value) viewport.value.scrollTop = viewport.value.scrollHeight
  })
}

const connect = () => {
  if (socket && socket.readyState <= WebSocket.OPEN) return
  state.value = 'connecting'
  socket = new WebSocket(streamUrl())
  socket.onopen = () => { state.value = 'open' }
  socket.onmessage = event => append(String(event.data))
  // Deliberately no reconnect here. The previous version called initWebSocket
  // from onerror, so a server that was simply down became an unbounded loop of
  // failed connections; reconnecting is now the user's call.
  socket.onerror = () => { state.value = 'closed' }
  socket.onclose = () => {
    state.value = 'closed'
    if (!closing) void unWsLogout(channel.id, channel.group).catch(() => {})
  }
}

onMounted(connect)

onBeforeUnmount(async() => {
  closing = true
  // The socket may never have been created, if the page unmounted first
  socket?.close()
  try {
    await unWsLogout(channel.id, channel.group)
  } catch {
    // Reported by the interceptor; the server drops the channel on close anyway
  }
})
</script>

<style lang="scss" scoped>
.job-log {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.job-log__bar {
  display: flex;
  align-items: center;
  gap: 12px;
}

.job-log__state {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--ga-text-2);
}

.job-log__dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--ga-text-3);
}

.is-open .job-log__dot { background: var(--ga-success); }
.is-closed .job-log__dot { background: var(--ga-danger); }
.is-connecting .job-log__dot { background: var(--ga-warning); }

.job-log__count {
  font-size: 12px;
  color: var(--ga-text-3);
  font-variant-numeric: tabular-nums;
}

.job-log__actions {
  margin-left: auto;
  display: flex;
  gap: 8px;
}

/* A console, so it keeps a console's ground in either theme rather than
   following the page surface. */
.job-log__viewport {
  height: 520px;
  overflow-y: auto;
  padding: 12px 14px;
  border-radius: var(--ga-radius-lg);
  border: 1px solid var(--ga-border);
  background: #0f1720;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 12px;
  line-height: 1.7;
}

.job-log__line {
  margin: 0;
  color: #cfe3f5;
  white-space: pre-wrap;
  word-break: break-all;
}

.job-log__time {
  margin-right: 10px;
  color: #5d768c;
  font-variant-numeric: tabular-nums;
}

.job-log__empty {
  margin: 0;
  color: #5d768c;
}
</style>
