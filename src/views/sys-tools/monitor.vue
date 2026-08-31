<template>
  <div>
    <BasicLayout>
      <template #wrapper>
        <el-row :gutter="10" class="mb10">
          <el-col :sm="24" :md="8">
            <el-card v-if="info.cpu" class="box-card" shadow="always" :body-style="{paddingTop:'0 !important'}">
              <template #header>
                <div class="clearfix">
                  <el-row :gutter="10">
                    <el-col :sm="24" :md="8">
                      <el-tag
                        type="success"
                        effect="dark"
                      >
                        Runing
                      </el-tag>
                    </el-col>
                    <el-col :sm="24" :md="8" class="" style="line-height:28px;text-align:center;">
                      {{ info.location }}
                    </el-col>
                  </el-row>
                </div>
              </template>
              <div class="monitor" style="padding-top:0px;">
                <div class="monitor-content">
                  <el-row :gutter="10">
                    <el-col :sm="24" :md="12">
                      <Cell :label="$t('sysTools.monitor.system')" :value="info.os.goOs" border />
                      <Cell :label="$t('sysTools.monitor.memory')" :value="`${info.mem.used}MB/${info.mem.total}MB`" border />
                      <Cell :label="$t('sysTools.monitor.swap')" :value="`${info.swap.used}/${info.swap.total}`" border />
                    </el-col>
                    <el-col :sm="24" :md="12">
                      <Cell :label="$t('sysTools.monitor.time')" :value="info.os.time" border />
                      <Cell :label="$t('sysTools.monitor.uptime')" :value="$t('sysTools.monitor.hours', { n: info.bootTime })" border />
                      <Cell :label="$t('sysTools.monitor.disk')" :value="`${info.disk.used}GB/${info.disk.total}GB`" border />
                    </el-col>
                  </el-row>
                  <el-row :gutter="10">
                    <el-col :sm="12" :md="12" class="line">
                      <el-row>
                        <el-col span="12" :sm="8" :md="8" xs="12">
                          {{ $t('sysTools.monitor.download') }}<i class="ri-arrow-down-s-fill" />
                        </el-col>
                        <el-col span="12" :sm="16" :md="16" xs="12" class="line-value">
                          {{ info.net.in }}KB
                        </el-col>
                      </el-row>
                    </el-col>
                    <el-col :sm="12" :md="12" class="line">
                      <el-row border>
                        <el-col span="12" :sm="6" :md="8">
                          {{ $t('sysTools.monitor.upload') }}<i class="ri-arrow-up-s-fill" />
                        </el-col>
                        <el-col span="12" :sm="6" :md="16" class="line-value">
                          {{ info.net.out }}KB
                        </el-col>
                      </el-row>
                    </el-col>
                  </el-row>
                  <el-row :gutter="10" class="monitor-progress">
                    <el-col :sm="24" :md="4">
                      CPU
                    </el-col>
                    <el-col :sm="24" :md="20">
                      <el-progress :color="customColors" :text-inside="true" :stroke-width="24" :percentage="info.cpu.percent" />
                    </el-col>
                  </el-row>
                  <el-row :gutter="10" class="monitor-progress">
                    <el-col :sm="24" :md="4">
                      RAM
                    </el-col>
                    <el-col :sm="24" :md="20">
                      <el-progress :color="customColors" :text-inside="true" :stroke-width="24" :percentage="info.mem.percent" />
                    </el-col>
                  </el-row>
                  <el-row :gutter="10" class="monitor-progress">
                    <el-col :sm="24" :md="4">
                      {{ $t('sysTools.monitor.disk') }}
                    </el-col>
                    <el-col :sm="24" :md="20">
                      <el-progress :color="customColors" :text-inside="true" :stroke-width="24" :percentage="info.disk.percent" />
                    </el-col>
                  </el-row>
                  <!-- <el-progress :color="$store.state.settings.theme" type="circle" :percentage="info.cpu.Percent" /> -->
                </div>
                <!-- <div class="monitor-footer">

                  <Cell :label="$t('sysTools.monitor.cpuFreq')" :value="info.cpu.cpuInfo[0].modelName.split('@ ')[1]" border />
                  <Cell :label="$t('sysTools.monitor.cores')" :value="`${info.cpu.cpuInfo[0].cores}`" />
                </div> -->
              </div>
            </el-card>
          </el-col>

          <!-- <el-card v-if="info.os" class="box-card">
            <div slot="header" class="clearfix">
              <span>{{ $t('sysTools.monitor.goRuntime') }}</span>
            </div>
            <div class="monitor">
              <Cell :label="$t('sysTools.monitor.goVersion')" :value="info.os.version" border />
              <Cell label="Goroutine" :value="`${info.os.numGoroutine}`" border />
              <Cell :label="$t('sysTools.monitor.projectDir')" :value="info.os.projectDir" />
            </div>
          </el-card> -->

          <el-card v-if="info.os" class="box-card">
            <template #header>
              <div class="clearfix">
                <span>{{ $t('sysTools.monitor.serverInfo') }}</span>
              </div>
            </template>
            <div class="monitor">
              <Cell :label="$t('sysTools.monitor.hostName')" :value="info.os.hostName" border />
              <Cell :label="$t('sysTools.monitor.os')" :value="info.os.goOs" border />
              <Cell :label="$t('sysTools.monitor.ip')" :value="info.os.ip" border />
              <Cell :label="$t('sysTools.monitor.arch')" :value="info.os.arch" border />
              <Cell label="CPU" :value="info.cpu.cpuInfo[0].modelName" border />
              <Cell :label="$t('sysTools.monitor.currentTime')" :value="info.os.time" />
            </div>
          </el-card>

        </el-row></template>
    </BasicLayout>
  </div>
</template>

<script>
import Cell from '@/components/Cell/index'
import {
  getServer
} from '@/api/monitor/server'
export default {
  name: 'ServerMonitor',
  components: {
    Cell
  },
  data() {
    return {
      info: {},
      customColors: [
        { color: '#13ce66', percentage: 20 },
        { color: '#1890ff', percentage: 40 },
        { color: '#e6a23c', percentage: 60 },
        { color: '#1989fa', percentage: 80 },
        { color: '#F56C6C', percentage: 100 }
      ],
      timer: null
    }
  },
  created() {
    this.getServerInfo()
    this.timer = setInterval(() => {
      this.getServerInfo()
    }, 1000)
  },
  beforeUnmount() {
    clearInterval(this.timer)
    this.timer = null
  },
  methods: {
    getServerInfo() {
      getServer().then(ret => {
        if (ret.code === 200) {
          this.info = ret
        }
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.line{
  line-height: 49px;
  font-size: 14px ;
  padding-left: 5px !important;
  padding-right: 5px !important;
  border-bottom: 1px solid #e6ebf5;
  .line-value{
    text-align: right;
    color: #969799;
  }
}

.monitor {
  .monitor-header {
    display: flex;
    justify-content: center;
    align-items: center;
  }
  .monitor-progress{
    padding-top: 15px;
  }
}

</style>
