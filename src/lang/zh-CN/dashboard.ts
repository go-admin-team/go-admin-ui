/**
 * The admin dashboard: four metric cards, two chart tabs and the panel group.
 *
 * The figures on this page are demo data generated in the component, so the
 * only translatable parts are the labels around them -- including the chart
 * axis and the ranked store names, which are built from a count and therefore
 * use named interpolation rather than concatenation.
 *
 * Every Chinese value is byte-for-byte what the interface renders today (PRD R5).
 */
export default {
  metricHelp: '指标说明',
  sales: {
    title: '总销售额',
    weekOnWeek: '周同比',
    dayOnDay: '日同比',
    dailyAverage: '日均销售额'
  },
  visits: {
    title: '访问量',
    daily: '日访问量'
  },
  payments: {
    title: '支付笔数',
    conversion: '转化率'
  },
  campaign: {
    title: '运营活动效果',
    // 同周比 and 日环比, not the 周同比 / 日同比 of the sales card. The wording
    // differs in the source and is copied as it stands; see PRD R5.
    weekComparison: '同周比',
    dayOverDay: '日环比'
  },
  tabs: {
    sales: '销售额'
  },
  charts: {
    salesRanking: '销售额排行',
    salesTrend: '销售额趋势',
    storeRanking: '门店销售排行榜',
    month: '{n}月',
    store: '白鹭岛 {n} 号店'
  },
  panel: {
    newUsers: '新用户',
    messages: '消息',
    amount: '金额',
    volume: '销量'
  }
}
