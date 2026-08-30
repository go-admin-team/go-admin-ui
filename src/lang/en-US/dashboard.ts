export default {
  metricHelp: 'Metric description',
  sales: {
    title: 'Total Sales',
    weekOnWeek: 'Weekly Change',
    dayOnDay: 'Daily Change',
    dailyAverage: 'Daily Average Sales'
  },
  visits: {
    title: 'Visits',
    daily: 'Daily Visits'
  },
  payments: {
    title: 'Payments',
    conversion: 'Conversion Rate'
  },
  campaign: {
    title: 'Campaign Performance',
    // English collapses the 同比 / 环比 distinction the Chinese draws here: both
    // pairs on this page compare a week and a day, and spelling out
    // year-on-year against period-on-period would say more than the demo
    // figures behind them mean.
    weekComparison: 'Weekly Change',
    dayOverDay: 'Daily Change'
  },
  tabs: {
    sales: 'Sales'
  },
  charts: {
    salesRanking: 'Sales Ranking',
    salesTrend: 'Sales Trend',
    storeRanking: 'Store Sales Ranking',
    month: 'Month {n}',
    store: 'Egret Island Store {n}'
  },
  panel: {
    newUsers: 'New Users',
    messages: 'Messages',
    amount: 'Amount',
    volume: 'Sales Volume'
  }
}
