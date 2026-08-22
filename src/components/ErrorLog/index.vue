<template>
  <div v-if="errorLogs.length>0">
    <el-badge :is-dot="true" style="line-height: 25px;margin-top: -5px;" @click="dialogTableVisible=true">
      <el-button style="padding: 8px 10px;" size="small" type="danger">
        <svg-icon icon-class="bug" />
      </el-button>
    </el-badge>

    <el-dialog v-model="showDialog" width="80%" append-to-body>
      <template #header>
        <span style="padding-right: 10px;">Error Log</span>
        <el-button size="mini" type="primary" @click="clearAll"><i class="ri-delete-bin-line" style="margin-right:4px;" />Clear All</el-button>
      </template>
      <el-table :data="errorLogs" border>
        <el-table-column label="Message">
          <template #default="{row}">
            <div>
              <span class="message-title">Msg:</span>
              <el-tag type="danger">
                {{ row.err.message }}
              </el-tag>
            </div>
            <br>
            <div>
              <span class="message-title" style="padding-right: 10px;">Info: </span>
              <el-tag type="warning">
                {{ row.vm.$vnode.tag }} error in {{ row.info }}
              </el-tag>
            </div>
            <br>
            <div>
              <span class="message-title" style="padding-right: 16px;">Url: </span>
              <el-tag type="success">
                {{ row.url }}
              </el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="Stack">
          <template #default="scope">
            {{ scope.row.err.stack }}
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>
  </div>
</template>

<script>
import { mapState, mapActions } from 'pinia'
import { useErrorLogStore } from '@/stores/errorLog'

export default {
  name: 'ErrorLog',
  data() {
    return {
      dialogTableVisible: false
    }
  },
  computed: {
    // Pinia's mapState works in the Options API, so consuming a ported store
    // does not force this component to move to <script setup> yet.
    ...mapState(useErrorLogStore, { errorLogs: 'logs' })
  },
  methods: {
    ...mapActions(useErrorLogStore, ['clearErrorLog']),
    clearAll() {
      this.dialogTableVisible = false
      this.clearErrorLog()
    }
  }
}
</script>

<style scoped>
.message-title {
  font-size: 16px;
  color: #333;
  font-weight: bold;
  padding-right: 8px;
}
</style>
