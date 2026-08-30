<template>
  <div class="dashboard-editor-container">
    <el-row :gutter="12">
      <el-col :sm="24" :xs="24" :md="6" :xl="6" :lg="6" :style="{ marginBottom: '12px' }">
        <chart-card :title="$t('dashboard.sales.title')" total="￥126,560" color="#1677ff">
          <template #icon><i class="ri-money-dollar-circle-line" /></template>
          <template #action>
            <el-tooltip class="item" effect="dark" :content="$t('dashboard.metricHelp')" placement="top-start">
              <i class="ri-error-warning-line" />
            </el-tooltip>
          </template>
          <div>
            <trend flag="top" style="margin-right: 16px;" rate="12">
              <template #term><span>{{ $t('dashboard.sales.weekOnWeek') }}</span></template>
            </trend>
            <trend flag="bottom" rate="11">
              <template #term><span>{{ $t('dashboard.sales.dayOnDay') }}</span></template>
            </trend>
          </div>
          <template #footer>{{ $t('dashboard.sales.dailyAverage') }}<span>￥ 234.56</span></template>
        </chart-card>
      </el-col>

      <el-col :sm="24" :xs="24" :md="6" :xl="6" :lg="6" :style="{ marginBottom: '12px' }">
        <chart-card :title="$t('dashboard.visits.title')" :total="8846" color="#52c41a">
          <template #icon><i class="ri-group-line" /></template>
          <template #action>
            <el-tooltip class="item" effect="dark" :content="$t('dashboard.metricHelp')" placement="top-start">
              <i class="ri-error-warning-line" />
            </el-tooltip>
          </template>
          <div>
            <mini-area />
          </div>
          <template #footer>{{ $t('dashboard.visits.daily') }}<span> {{ '1234' }}</span></template>
        </chart-card>
      </el-col>

      <el-col :sm="24" :xs="24" :md="6" :xl="6" :lg="6" :style="{ marginBottom: '12px' }">
        <chart-card :title="$t('dashboard.payments.title')" :total="6560" color="#fa8c16">
          <template #icon><i class="ri-bank-card-line" /></template>
          <template #action>
            <el-tooltip class="item" effect="dark" :content="$t('dashboard.metricHelp')" placement="top-start">
              <i class="ri-error-warning-line" />
            </el-tooltip>
          </template>
          <div>
            <mini-bar />
          </div>
          <template #footer>{{ $t('dashboard.payments.conversion') }} <span>60%</span></template>
        </chart-card>
      </el-col>

      <el-col :sm="24" :xs="24" :md="6" :xl="6" :lg="6" :style="{ marginBottom: '12px' }">
        <chart-card :title="$t('dashboard.campaign.title')" total="78%" color="#722ed1">
          <template #icon><i class="ri-bar-chart-box-line" /></template>
          <template #action>
            <el-tooltip class="item" effect="dark" :content="$t('dashboard.metricHelp')" placement="top-start">
              <i class="ri-error-warning-line" />
            </el-tooltip>
          </template>
          <div>
            <mini-progress :target="80" :percentage="78" height="8px" />
          </div>
          <template #footer>
            <trend flag="top" style="margin-right: 16px;" rate="12">
              <template #term><span>{{ $t('dashboard.campaign.weekComparison') }}</span></template>
            </trend>
            <trend flag="bottom" rate="80">
              <template #term><span>{{ $t('dashboard.campaign.dayOverDay') }}</span></template>
            </trend>
          </template>
        </chart-card>
      </el-col>
    </el-row>

    <el-card :bordered="false" :body-style="{ padding: '0' }">
      <div class="salesCard">
        <el-tabs>
          <el-tab-pane :label="$t('dashboard.tabs.sales')">
            <el-row>
              <el-col :xl="16" :lg="12" :md="12" :sm="24" :xs="24">
                <bar :list="barData" :title="$t('dashboard.charts.salesRanking')" />
              </el-col>
              <el-col :xl="8" :lg="12" :md="12" :sm="24" :xs="24">
                <rank-list :title="$t('dashboard.charts.storeRanking')" :list="rankList" />
              </el-col>
            </el-row>
          </el-tab-pane>
          <el-tab-pane :label="$t('dashboard.visits.title')">
            <el-row>
              <el-col :xl="16" :lg="12" :md="12" :sm="24" :xs="24">
                <bar :list="barData2" :title="$t('dashboard.charts.salesTrend')" />
              </el-col>
              <el-col :xl="8" :lg="12" :md="12" :sm="24" :xs="24">
                <rank-list :title="$t('dashboard.charts.storeRanking')" :list="rankList" />
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

/**
 * The demo figures, drawn once at module scope.
 *
 * Only the labels are translated, so the values stay out of the computed
 * properties below: rebuilding them there would reroll every bar and reorder
 * the ranking each time the language changed.
 */
const barValues = []
const barValues2 = []
for (let i = 0; i < 12; i += 1) {
  barValues.push(Math.floor(Math.random() * 1000) + 200)
  barValues2.push(Math.floor(Math.random() * 1000) + 200)
}

const rankTotals = []
for (let i = 0; i < 7; i++) {
  rankTotals.push(1234.56 - i * 100)
}

export default {
  name: 'DashboardAdmin',
  components: { ChartCard, Trend, MiniArea, MiniBar, MiniProgress, RankList, Bar },
  computed: {
    barData() {
      return barValues.map((y, i) => ({ x: this.$t('dashboard.charts.month', { n: i + 1 }), y }))
    },
    barData2() {
      return barValues2.map((y, i) => ({ x: this.$t('dashboard.charts.month', { n: i + 1 }), y }))
    },
    rankList() {
      return rankTotals.map((total, i) => ({ name: this.$t('dashboard.charts.store', { n: i + 1 }), total }))
    }
  }
}
</script>

<style lang="scss" scoped>
.dashboard-editor-container {
  padding: 12px;
  // The page's own plane, so it has to be the page's own colour. This was
  // #f0f2f5, which stayed light under the dark scheme and put every card on
  // this page on a white sheet.
  background-color: var(--ga-bg-body);
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
