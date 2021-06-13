<template>
  <div class="file">
    <BasicLayout>
      <template #wrapper>
        <DragColumn>
          <div slot="left" class="left">
            <Left />
          </div>
          <div slot="right" class="right">
            <Right />
          </div>
        </DragColumn>
      </template>
    </BasicLayout>
  </div>
</template>

<script>

import DragColumn from '@/components/DragColumn/index'
import Left from '@/components/FileManage/Left'
import Right from '@/components/FileManage/Right'
export default {
  name: 'FileManage',
  components: {
    DragColumn,
    Left,
    Right
  },
  data() {
    return {

    }
  },
  mounted() {
  },
  methods: {

  }
}
</script>

<style lang="scss" scoped>

</style>
