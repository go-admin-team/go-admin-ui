<template>
  <div class="dashboard-editor-container">
    <github-corner class="github-corner" />

    <panel-group @handleSetLineChartData="handleSetLineChartData" />

    <el-row :gutter="32">
      <el-col :xs="24" :sm="24" :lg="12">
        <el-card class="box-card">
          <div slot="header" class="clearfix">
            <span>最新动态</span>

          </div>
          <el-timeline>
            <el-timeline-item timestamp="2020/05/15" placement="top">
              <el-card>
                <h4>更新角色授权数据绑定</h4>
              </el-card>
            </el-timeline-item>
            <el-timeline-item timestamp="2020/05/14" placement="top">
              <el-card>
                <h4>角色名称和角色key控制唯一性；</h4>
                <h4>以及字典，参数等功能唯一性控制；</h4>
                <h4>记录总条数过滤已删除状态；</h4>
                <h4>部分已知bug的修复；</h4>
              </el-card>
            </el-timeline-item>
            <el-timeline-item timestamp="2020/4/2" placement="top">
              <el-card>
                <p>...</p>
              </el-card>
            </el-timeline-item>
          </el-timeline>
        </el-card>

      </el-col>
      <el-col :xs="24" :sm="24" :lg="12">
        <el-card class="box-card">
          <div slot="header" class="clearfix">
            <span>视频教程</span>

          </div>
          <iframe id="b" class="b video_pc" src="//player.bilibili.com/player.html??cid=185732281&aid=455391649&pre_ad=0" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true" style="min-height:485px; width: 100%" />
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import GithubCorner from '@/components/GithubCorner'
import PanelGroup from './components/PanelGroup'
import LineChart from './components/LineChart'
import RaddarChart from './components/RaddarChart'
import PieChart from './components/PieChart'
import BarChart from './components/BarChart'

const lineChartData = {
  newVisitis: {
    expectedData: [100, 120, 161, 134, 105, 160, 165],
    actualData: [120, 82, 91, 154, 162, 140, 145]
  },
  messages: {
    expectedData: [200, 192, 120, 144, 160, 130, 140],
    actualData: [180, 160, 151, 106, 145, 150, 130]
  },
  purchases: {
    expectedData: [80, 100, 121, 104, 105, 90, 100],
    actualData: [120, 90, 100, 138, 142, 130, 130]
  },
  shoppings: {
    expectedData: [130, 140, 141, 142, 145, 150, 160],
    actualData: [120, 82, 91, 154, 162, 140, 130]
  }
}

export default {
  name: 'DashboardAdmin',
  components: {
    GithubCorner,
    PanelGroup,
    LineChart,
    RaddarChart,
    PieChart,
    BarChart
  },
  data() {
    return {
      lineChartData: lineChartData.newVisitis
    }
  },
  methods: {
    handleSetLineChartData(type) {
      this.lineChartData = lineChartData[type]
    }
  }
}
</script>

<style lang="scss" scoped>
.dashboard-editor-container {
  padding: 32px;
  background-color: rgb(240, 242, 245);
  position: relative;

  .github-corner {
    position: absolute;
    top: 0px;
    border: 0;
    right: 0;
  }

  .chart-wrapper {
    background: #fff;
    padding: 16px 16px 0;
    margin-bottom: 32px;
  }
}

@media (max-width:1024px) {
  .chart-wrapper {
    padding: 8px;
  }
}
</style>
