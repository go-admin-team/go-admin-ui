<template>
  <div>
    <BasicLayout>
      <template #wrapper>
        <DragColumn>
          <div slot="left" class="left">
            <el-card>
              <el-tree :data="data" :props="defaultProps" draggable />
            </el-card>
          </div>
          <div slot="right" class="right">
            <el-card>2</el-card>
          </div>
        </DragColumn>
      </template>
    </BasicLayout>
  </div>
</template>

<script>
import DragColumn from '@/components/DragColumn/index'
export default {
  name: 'FileManage',
  components: {
    DragColumn
  },
  data() {
    return {
      data: [{
        label: '一级 1',
        children: [{
          label: '二级 1-1',
          children: [{
            label: '三级 1-1-1'
          }]
        }]
      }, {
        label: '一级 2',
        children: [{
          label: '二级 2-1',
          children: [{
            label: '三级 2-1-1'
          }]
        }, {
          label: '二级 2-2',
          children: [{
            label: '三级 2-2-1'
          }]
        }]
      }, {
        label: '一级 3',
        children: [{
          label: '二级 3-1',
          children: [{
            label: '三级 3-1-1'
          }]
        }, {
          label: '二级 3-2',
          children: [{
            label: '三级 3-2-1'
          }]
        }]
      }],
      defaultProps: {
        children: 'children',
        label: 'label'
      }
    }
  },
  mounted() {

  },
  methods: {

  }
}
</script>

<style lang="scss" scoped>
  .left /deep/{
    height: 100%;
    .el-card{
        height: 100%;
    }
    .el-tree-node__content{
      height: 40px;
    }
    .el-icon-caret-right:before{
        content: "\e78a";
    }

    .el-tree-node__expand-icon.expanded{
      transform: rotate(0)
    }
    .el-tree-node__expand-icon.expanded:before{
        content: "\e784";
    }
    .el-tree-node__expand-icon{
      font-size: 16px;
    }
  }
  .right{
    height: 100%;
    .el-card{
        height: 100%;
    }
  }
</style>
