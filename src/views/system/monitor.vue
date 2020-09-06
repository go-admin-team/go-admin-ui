<template>
  <div>
    <BasicLayout>
      <template #wrapper>
        <el-row :gutter="10" class="mb10">
          <el-col :sm="24" :md="8">
            <el-card v-if="info.cpu" class="box-card">
              <div slot="header" class="clearfix">
                <span>CPU使用率</span>
              </div>
              <div class="monitor">
                <div class="monitor-header">
                  <el-progress :color="$store.state.settings.theme" type="circle" :percentage="info.cpu.Percent" />
                </div>
                <div class="monitor-footer">
                  <Cell label="CPU主频" :value="info.cpu.cpuInfo[0].modelName.split('@ ')[1]" border />
                  <Cell label="核心数" :value="`${info.cpu.cpuInfo[0].cores}`" />
                </div>
              </div>
            </el-card>
          </el-col>
          <el-col :sm="24" :md="8">
            <el-card v-if="info.mem" class="box-card">
              <div slot="header" class="clearfix">
                <span>内存使用率</span>
              </div>
              <div class="monitor">
                <div class="monitor-header">
                  <el-progress :color="$store.state.settings.theme" type="circle" :percentage="info.mem.usage" />
                </div>
                <div class="monitor-footer">
                  <Cell label="总内存" :value="info.mem.total+'G'" border />
                  <Cell label="已用内存" :value="info.mem.used+'G'" />
                </div>
              </div>
            </el-card>
          </el-col>
          <el-col :sm="24" :md="8">
            <el-card v-if="info.disk" class="box-card">
              <div slot="header" class="clearfix">
                <span>磁盘信息</span>
              </div>
              <div class="monitor">
                <div class="monitor-header">
                  <el-progress :color="$store.state.settings.theme" type="circle" :percentage=" `${((info.disk.free / info.disk.total) * 100).toFixed(2)}` " />
                </div>
                <div class="monitor-footer">
                  <Cell label="总内存" :value="info.disk.total+'G'" border />
                  <Cell label="已用内存" :value="info.disk.free+'G'" />
                </div>
              </div>
            </el-card>
          </el-col>
        </el-row>

        <el-card v-if="info.os" class="box-card">
          <div slot="header" class="clearfix">
            <span>go运行环境</span>
          </div>
          <div class="monitor">
            <Cell label="GO 版本" :value="info.os.version" border />
            <Cell label="Goroutine" :value="`${info.os.numGoroutine}`" border />
            <Cell label="项目地址" :value="info.os.projectDir" />
          </div>
        </el-card>

        <el-card v-if="info.os" class="box-card">
          <div slot="header" class="clearfix">
            <span>服务器信息</span>
          </div>
          <div class="monitor">
            <Cell label="操作系统" :value="info.os.goOs" border />
            <Cell label="服务器IP" value="10.30.54.43" border />
            <Cell label="系统架构" :value="info.os.arch" border />
            <Cell label="CPU" :value="info.cpu.cpuInfo[0].modelName" />
          </div>
        </el-card>

      </template>
    </BasicLayout>
  </div>
</template>

<script>
import Cell from '@/components/Cell/index'
import { getServer } from '@/api/monitor/server'
export default {
  name: 'Monitor',
  components: {
    Cell
  },
  data() {
    return {
      info: {}
    }
  },
  created() {
    this.getServerInfo()
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
  .monitor{
    .monitor-header{
      display: flex;
      justify-content: center;
      align-items: center;
    }
  }
  .el-card__body{
    padding: 20px 20px 0 20px!important;
  }
</style>
