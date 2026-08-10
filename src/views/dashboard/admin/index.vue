<template>
  <div class="dashboard-editor-container">
    <el-row :gutter="12">
      <el-col :sm="24" :xs="24" :md="6" :xl="6" :lg="6" :style="{ marginBottom: '12px' }">
        <chart-card title="总销售额" total="￥126,560" color="#1677ff">
          <template #icon><i class="ri-money-dollar-circle-line" /></template>
          <template #action>
            <el-tooltip class="item" effect="dark" content="指标说明" placement="top-start">
              <i class="ri-error-warning-line" />
            </el-tooltip>
          </template>
          <div>
            <trend flag="top" style="margin-right: 16px;" rate="12">
              <template #term><span>周同比</span></template>
            </trend>
            <trend flag="bottom" rate="11">
              <template #term><span>日同比</span></template>
            </trend>
          </div>
          <template #footer>日均销售额<span>￥ 234.56</span></template>
        </chart-card>
      </el-col>

      <el-col :sm="24" :xs="24" :md="6" :xl="6" :lg="6" :style="{ marginBottom: '12px' }">
        <chart-card title="访问量" :total="8846" color="#52c41a">
          <template #icon><i class="ri-group-line" /></template>
          <template #action>
            <el-tooltip class="item" effect="dark" content="指标说明" placement="top-start">
              <i class="ri-error-warning-line" />
            </el-tooltip>
          </template>
          <div>
            <mini-area />
          </div>
          <template #footer>日访问量<span> {{ '1234' }}</span></template>
        </chart-card>
      </el-col>

      <el-col :sm="24" :xs="24" :md="6" :xl="6" :lg="6" :style="{ marginBottom: '12px' }">
        <chart-card title="支付笔数" :total="6560" color="#fa8c16">
          <template #icon><i class="ri-bank-card-line" /></template>
          <template #action>
            <el-tooltip class="item" effect="dark" content="指标说明" placement="top-start">
              <i class="ri-error-warning-line" />
            </el-tooltip>
          </template>
          <div>
            <mini-bar />
          </div>
          <template #footer>转化率 <span>60%</span></template>
        </chart-card>
      </el-col>

      <el-col :sm="24" :xs="24" :md="6" :xl="6" :lg="6" :style="{ marginBottom: '12px' }">
        <chart-card title="运营活动效果" total="78%" color="#722ed1">
          <template #icon><i class="ri-bar-chart-box-line" /></template>
          <template #action>
            <el-tooltip class="item" effect="dark" content="指标说明" placement="top-start">
              <i class="ri-error-warning-line" />
            </el-tooltip>
          </template>
          <div>
            <mini-progress :target="80" :percentage="78" height="8px" />
          </div>
          <template #footer>
            <trend flag="top" style="margin-right: 16px;" rate="12">
              <template #term><span>同周比</span></template>
            </trend>
            <trend flag="bottom" rate="80">
              <template #term><span>日环比</span></template>
            </trend>
          </template>
        </chart-card>
      </el-col>
    </el-row>

    <el-card :bordered="false" :body-style="{ padding: '0' }">
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
  barData.push({ x: `${i + 1}月`, y: Math.floor(Math.random() * 1000) + 200 })
  barData2.push({ x: `${i + 1}月`, y: Math.floor(Math.random() * 1000) + 200 })
}

const rankList = []
for (let i = 0; i < 7; i++) {
  rankList.push({ name: '白鹭岛 ' + (i + 1) + ' 号店', total: 1234.56 - i * 100 })
}

export default {
  name: 'DashboardAdmin',
  components: { ChartCard, Trend, MiniArea, MiniBar, MiniProgress, RankList, Bar },
  data() {
    return { barData, barData2, rankList }
  }
}
</script>

<style lang="scss" scoped>
.dashboard-editor-container {
  padding: 12px;
  background-color: #f0f2f5;
  position: relative;
}

:deep(.el-tabs__item) {
  padding-left: 16px !important;
  height: 50px;
  line-height: 50px;
}

@media (max-width: 1024px) {
  .chart-wrapper {
    padding: 8px;
  }
}
</style>
