
<template>
  <BasicLayout>
    <template #wrapper>
      <el-card class="box-card">
        <el-form>
          <el-form-item>
            <el-button type="success" icon="el-icon-search" size="mini">状态</el-button>
            <el-button type="primary" icon="el-icon-search" size="mini">清空</el-button>
          </el-form-item>
        </el-form>
        <el-row ref="log" :gutter="10" class="mb8">
          <el-scrollbar style="height:500px;background-color: black;color: cornflowerblue;">
            <ul
              style="line-height: 25px;padding-top: 15px;padding-bottom: 15px;min-height: 500px; margin: 0;list-style-type: none;"
            >
              <li v-for="(item,index) in arrs" :key="index">

                {{ item }}
              </li>
            </ul>
          </el-scrollbar>
        </el-row>
      </el-card>
    </template>
  </BasicLayout>

</template>

<script>

import { unWsLogout } from '@/api/ws'
export default {
  name: 'SysJobLogManage',
  data() {
    return {
      websock: null,
      arrs: [],
      id: undefined,
      group: undefined
    }
  },
  created() {
    this.id = this.guid()
    this.group = 'log'
    this.initWebSocket()
  },
  destroyed() {
    console.log('断开websocket连接')
    this.websock.close() // 离开路由之后断开websocket连接
    unWsLogout(this.id, this.group).then(response => {
      console.log(response.data)
    }
    )
  },
  methods: {
    initWebSocket() { // 初始化weosocket
      console.log(this.$store.state.user.token)
      const wsuri = 'ws://127.0.0.1:8000/ws/' + this.id + '/' + this.group + '?token=' + this.$store.state.user.token
      this.websock = new WebSocket(wsuri)
      this.websock.onmessage = this.websocketonmessage
      this.websock.onopen = this.websocketonopen
      this.websock.onerror = this.websocketonerror
      this.websock.onclose = this.websocketclose
    },
    websocketonopen() { // 连接建立之后执行send方法发送数据
      console.log('连接打开')
    //   const actions = { 'test': '12345' }
    //   this.websocketsend(JSON.stringify(actions))
    },
    websocketonerror() { // 连接建立失败重连
      this.initWebSocket()
    },
    websocketonmessage(e) { // 数据接收
      console.log(e.data)
      //   console.log(this.binaryAgent(e))
      //   const redata = JSON.parse(e.data)
      //   console.log(redata)
      //   this.$refs.log.innerText = e.data + '\n' + this.$refs.log.innerText
      this.arrs.unshift(e.data)
    },
    websocketsend(Data) { // 数据发送
    //   this.websock.send(Data)
    },
    websocketclose(e) { // 关闭
      unWsLogout(this.id, this.group).then(response => {
        console.log(response.data)
      }
      )
      console.log('断开连接', e)
    },
    guid() {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0; var v = c === 'x' ? r : (r & 0x3 | 0x8)
        return v.toString(16)
      })
    }
  }
}

</script>
