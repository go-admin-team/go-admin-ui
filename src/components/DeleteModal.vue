<template>
  <a-modal v-model:visible="deleteVisible" :title="data.length > 1 ? '批量删除' : '删除'" title-align="start" @close="handleClose" width="400px">
    <a-form :model="data" :rules="rules" ref="modalFormRef" size="medium" label-align="left" auto-label-width>
      <a-alert type="warning" style="margin-bottom: 16px;" v-if="data.length > 1">您正在批量删除，请确认删除数据是否正确</a-alert>
      <a-form-item label="摘要" label-col-flex="100px">
        <a-tag color="gray" style="padding: 0 0px; margin-right: 5px">
          <template #icon>
            <a-tag color="arcoblue">数量</a-tag>
          </template>
          <a-tag style="margin-left: -4px">{{ data.length }}</a-tag>
        </a-tag>
      </a-form-item>
      <a-form-item field="deleteConfirmation" label="删除确认" label-col-flex="100px">
        <a-input v-model.trim="data.deleteConfirmation" placeholder="请输入 DELETE 以确认删除"></a-input>
      </a-form-item>
    </a-form>
    <template #footer>
      <a-button @click="handleClose"><template #icon><icon-close /></template>取消</a-button>
      <a-button type="primary" @click="handleConfirm"><template #icon><icon-check /></template>确认</a-button>
    </template>
  </a-modal>
</template>

<script setup>
import { ref, reactive, toRefs, watch, unref, getCurrentInstance } from 'vue';
import { Message } from '@arco-design/web-vue';

const { proxy } = getCurrentInstance();

const props = defineProps({
  // 数组名称
  data: {
    type: Array,
  },
  // 是否显示
  visible: {
    type: Boolean,
    default: false,
  },
  // 更新接口
  apiDelete: {
    type: Function,
  },
});

const { data, visible, apiDelete } = toRefs(props);

const emits = defineEmits(['deleteVisibleChange']);

// Akiraka 20230210 对话框弹出
const deleteVisible = ref(false);

// Akiraka 20230210 删除数据校验
const rules = reactive({
  deleteConfirmation: [
    {
      required: true,
      validator: (value, cb) => {
        return new Promise(resolve => {
          setTimeout(() => {
            if ( "DELETE" !== value) {
              cb('请输入 DELETE')
            }
            resolve()
          }, 500)
        })
      } 
    }
  ],
});

// Akiraka 20230210 关闭弹窗
const handleClose = () =>  {
  emits('deleteVisibleChange', deleteVisible.value = false);
  // Akiraka 20230210 关闭弹窗
  deleteVisible.value = false;
}

// Akiraka 20230210 监听事件
watch(() => props.visible,(value) => {
  if (value) {
    // Akiraka 20230210 打开或关闭对话框
    deleteVisible.value = value;
  }
})

// Akiraka 20230210 确认按钮 => 开始数据检查
const handleConfirm = () => {
  proxy.$refs.modalFormRef.validate((valid) => {
    if (!valid) {
      // Akiraka 20230210 请求接口
      props.apiDelete({ ids: data.value }).then(response => {
        // Akiraka 20230210 关闭弹窗
        deleteVisible.value = false;
        Message.success("数据删除成功");
      })
    }
  })
}

</script>

<style lang="less" scoped>
</style>