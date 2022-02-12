<template>
  <div>
    <BasicLayout>
      <template #wrapper>
        <el-row :gutter="10" class="mb10">
          <el-col :sm="24" :md="8">
            <el-card v-if="info.cpu" class="box-card" shadow="always" :body-style="{paddingTop:'0 !important'}">
              <div slot="header" class="clearfix">
                <el-row :gutter="10">
                  <el-col :sm="24" :md="8">
                    <el-tag
                      type="success"
                      effect="dark"
                    >
                      {{ info.location }}
                    </el-tag>
                  </el-col>
                  <el-col :sm="24" :md="8" class="" style="line-height:28px;text-align:center;">
                    Aliyun
                  </el-col>
                </el-row>
              </div>
              <div class="monitor" style="padding-top:0px;">
                <div class="monitor-content">
                  <el-row :gutter="10">
                    <el-col :sm="24" :md="12">
                      <Cell label="系统" :value="info.os.goOs" border />
                      <Cell label="内存" :value="`${info.mem.used}MB/${info.mem.total}MB`" border />
                      <Cell label="交换" :value="`${info.swap.used}/${info.swap.total}`" border />
                    </el-col>
                    <el-col :sm="24" :md="12">
                      <Cell label="时间" :value="info.os.time" border />
                      <Cell label="在线" :value="`${info.bootTime}小时`" border />
                      <Cell label="硬盘" :value="`${info.disk.used}GB/${info.disk.total}GB`" border />
                    </el-col>
                  </el-row>
                  <el-row :gutter="10">
                    <el-col :sm="12" :md="12" class="line">
                      <el-col :sm="8" :md="8">
                        下载<i class="el-icon-caret-bottom" />
                      </el-col>
                      <el-col :sm="16" :md="16" class="line-value">
                        {{ info.net.in }}KB
                      </el-col>
                    </el-col>
                    <el-col :sm="12" :md="12" class="line">
                      <el-col :sm="8" :md="8">
                        上传<i class="el-icon-caret-top" />
                      </el-col>
                      <el-col :sm="16" :md="16" class="line-value">
                        {{ info.net.out }}KB
                      </el-col>
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
                      硬盘
                    </el-col>
                    <el-col :sm="24" :md="20">
                      <el-progress :color="customColors" :text-inside="true" :stroke-width="24" :percentage="info.disk.percent" />
                    </el-col>
                  </el-row>
                  <!-- <el-progress :color="$store.state.settings.theme" type="circle" :percentage="info.cpu.Percent" /> -->
                </div>
                <!-- <div class="monitor-footer">

                  <Cell label="CPU主频" :value="info.cpu.cpuInfo[0].modelName.split('@ ')[1]" border />
                  <Cell label="核心数" :value="`${info.cpu.cpuInfo[0].cores}`" />
                </div> -->
              </div>
            </el-card>
          </el-col>

          <!-- <el-card v-if="info.os" class="box-card">
            <div slot="header" class="clearfix">
              <span>go运行环境</span>
            </div>
            <div class="monitor">
              <Cell label="GO 版本" :value="info.os.version" border />
              <Cell label="Goroutine" :value="`${info.os.numGoroutine}`" border />
              <Cell label="项目地址" :value="info.os.projectDir" />
            </div>
          </el-card> -->

          <el-card v-if="info.os" class="box-card">
            <div slot="header" class="clearfix">
              <span>服务器信息</span>
            </div>
            <div class="monitor">
              <Cell label="主机名称" :value="info.os.hostName" border />
              <Cell label="操作系统" :value="info.os.goOs" border />
              <Cell label="服务器IP" :value="info.os.ip" border />
              <Cell label="系统架构" :value="info.os.arch" border />
              <Cell label="CPU" :value="info.cpu.cpuInfo[0].modelName" border />
              <Cell label="当前时间" :value="info.os.time" />
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
  name: 'Monitor',
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
      ]
    }
  },
  created() {
    this.getServerInfo()
    setInterval(() => {
      this.getServerInfo()
    }, 5000)
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
  padding-left: 0px !important;
  padding-right: 0px !important;
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
