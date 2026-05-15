<template>
  <div class="rank">
    <h4 class="title">{{ title }}</h4>
    <ul class="list">
      <li v-for="(item, index) in list" :key="index">
        <span :class="rankBadgeClass(index)">{{ index + 1 }}</span>
        <span class="rank-name">{{ item.name }}</span>
        <span class="rank-total">{{ item.total }}</span>
      </li>
    </ul>
  </div>
</template>

<script>
export default {
  name: 'RankList',
  props: {
    title: { type: String, default: '' },
    list: { type: Array, default: null }
  },
  methods: {
    rankBadgeClass(index) {
      if (index === 0) return 'rank-badge rank-gold'
      if (index === 1) return 'rank-badge rank-silver'
      if (index === 2) return 'rank-badge rank-bronze'
      return 'rank-badge'
    }
  }
}
</script>

<style lang="scss" scoped>
.rank {
  padding: 0 32px 32px 72px;

  .title {
    font-size: 14px;
    font-weight: 600;
    color: rgba(0, 0, 0, 0.85);
    margin-bottom: 0;
  }

  .list {
    margin: 16px 0 0;
    padding: 0;
    list-style: none;

    li {
      display: flex;
      align-items: center;
      margin-top: 14px;
    }
  }

  .rank-badge {
    flex-shrink: 0;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: 600;
    margin-right: 16px;
    background: #f0f0f0;
    color: #8c8c8c;

    &.rank-gold {
      background: linear-gradient(135deg, #ffe58f, #faad14);
      color: #fff;
    }

    &.rank-silver {
      background: linear-gradient(135deg, #d9d9d9, #8c8c8c);
      color: #fff;
    }

    &.rank-bronze {
      background: linear-gradient(135deg, #ffbb96, #d4380d);
      color: #fff;
    }
  }

  .rank-name {
    flex: 1;
    color: rgba(0, 0, 0, .65);
    font-size: 14px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .rank-total {
    flex-shrink: 0;
    color: rgba(0, 0, 0, .85);
    font-size: 14px;
    font-weight: 500;
    margin-left: 8px;
  }
}

.mobile .rank {
  padding: 0 32px 32px 32px;
}
</style>
