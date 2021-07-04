<template>
  <div class="dashboard-editor-container">
    <el-row :gutter="12">
      <el-col :sm="24" :xs="24" :md="6" :xl="6" :lg="6" :style="{ marginBottom: '12px' }">
        <chart-card title="总销售额" total="￥126,560">
          <el-tooltip slot="action" class="item" effect="dark" content="指标说明" placement="top-start">
            <i class="el-icon-warning-outline" />
          </el-tooltip>
          <div>
            <trend flag="top" style="margin-right: 16px;" rate="12">
              <span slot="term">周同比</span>
            </trend>
            <trend flag="bottom" rate="11">
              <span slot="term">日同比</span>
            </trend>
          </div>
          <template slot="footer">日均销售额<span>￥ 234.56</span></template>
        </chart-card>
      </el-col>
      <el-col :sm="24" :xs="24" :md="6" :xl="6" :lg="6" :style="{ marginBottom: '12px' }">
        <chart-card title="访问量" :total="8846">
          <el-tooltip slot="action" class="item" effect="dark" content="指标说明" placement="top-start">
            <i class="el-icon-warning-outline" />
          </el-tooltip>
          <div>
            <mini-area />
          </div>
          <template slot="footer">日访问量<span> {{ '1234' }}</span></template>
        </chart-card>
      </el-col>
      <el-col :sm="24" :xs="24" :md="6" :xl="6" :lg="6" :style="{ marginBottom: '12px' }">
        <chart-card title="支付笔数" :total="6560">
          <el-tooltip slot="action" class="item" effect="dark" content="指标说明" placement="top-start">
            <i class="el-icon-warning-outline" />
          </el-tooltip>
          <div>
            <mini-bar />
          </div>
          <template slot="footer">转化率 <span>60%</span></template>
        </chart-card>
      </el-col>
      <el-col :sm="24" :xs="24" :md="6" :xl="6" :lg="6" :style="{ marginBottom: '12px' }">
        <chart-card title="运营活动效果" total="78%">
          <el-tooltip slot="action" class="item" effect="dark" content="指标说明" placement="top-start">
            <i class="el-icon-warning-outline" />
          </el-tooltip>
          <div>
            <mini-progress color="rgb(19, 194, 194)" :target="80" :percentage="78" height="8px" />
          </div>
          <template slot="footer">
            <trend flag="top" style="margin-right: 16px;" rate="12">
              <span slot="term">同周比</span>
            </trend>
            <trend flag="bottom" rate="80">
              <span slot="term">日环比</span>
            </trend>
          </template>
        </chart-card>
      </el-col>
    </el-row>

    <el-card :bordered="false" :body-style="{padding: '0'}">
      <div class="salesCard">
        <el-tabs>
          <el-tab-pane label="销售额">
            <el-row>
              <el-col :xl="16" :lg="12" :md="12" :sm="24" :xs="24">
                <bar :list="barData" title="销售额排行" />
              </el-col>
              <el-col :xl="8" :lg="12" :md="12" :sm="24" :xs="24">
                <rank-list title="门店销售排行榜" :list="rankList" />
              </el-col>
            </el-row>
          </el-tab-pane>
          <el-tab-pane label="访问量">
            <el-row>
              <el-col :xl="16" :lg="12" :md="12" :sm="24" :xs="24">
                <bar :list="barData2" title="销售额趋势" />
              </el-col>
              <el-col :xl="8" :lg="12" :md="12" :sm="24" :xs="24">
                <rank-list title="门店销售排行榜" :list="rankList" />
              </el-col>
            </el-row>
          </el-tab-pane>
        </el-tabs>
      </div>
    </el-card>

  </div>
</template>

<script>
import ChartCard from '@/components/ChartCard'
import Trend from '@/components/Trend'
import MiniArea from '@/components/MiniArea'
import MiniBar from '@/components/MiniBar'
import MiniProgress from '@/components/MiniProgress'
import RankList from '@/components/RankList/index'
import Bar from '@/components/Bar.vue'

const barData = []
const barData2 = []
for (let i = 0; i < 12; i += 1) {
  barData.push({
    x: `${i + 1}月`,
    y: Math.floor(Math.random() * 1000) + 200
  })
  barData2.push({
    x: `${i + 1}月`,
    y: Math.floor(Math.random() * 1000) + 200
  })
}

const rankList = []
for (let i = 0; i < 7; i++) {
  rankList.push({
    name: '白鹭岛 ' + (i + 1) + ' 号店',
    total: 1234.56 - i * 100
  })
}

export default {
  name: 'DashboardAdmin',
  components: {
    ChartCard,
    Trend,
    MiniArea,
    MiniBar,
    MiniProgress,
    RankList,
    Bar
  },
  data() {
    return {
      barData,
      barData2,
      rankList
    }
  },
  methods: {
  }
}
</script>

<style lang="scss" scoped>
.dashboard-editor-container {
  padding: 12px;
  background-color: rgb(240, 242, 245);
  position: relative;

  .github-corner {
    position: absolute;
    top: 0;
    border: 0;
    right: 0;
  }

  .chart-wrapper {
    background: #fff;
    padding: 16px 16px 0;
    margin-bottom: 32px;
  }
}

::v-deep .el-tabs__item{
   padding-left: 16px!important;
   height: 50px;
   line-height: 50px;
}

@media (max-width:1024px) {
  .chart-wrapper {
    padding: 8px;
  }
}
</style>
