<template>
  <div class="tree-container">
    <a-tree
      :data="props.data"
      :field-names="{ key: 'deptId', title: 'deptName' }"
      block-node
      @select="handleTreeSelect"
    />
  </div>
</template>

<script setup>
const props = defineProps({
  data: {
    type: Array,
    default: () => [],
  },
});

const emits = defineEmits(['nodeClick']);

const handleTreeSelect = (selectKeys) => {
  emits('nodeClick', { deptId: `/${selectKeys}/` });
}
</script>

<style lang="scss">
.tree-container {
  padding-right: 20px;
}
</style>
