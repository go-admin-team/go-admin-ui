<template>
  <div class="app-container">
    <a-card :bordered="false" class="general-card">
      <a-form :model="queryForm" ref="queryFormRef" layout="inline">
        <a-form-item field="status" label="状态">
          <a-select
            v-model="queryForm.status"
            placeholder="请选择系统操作日志状态"
          >
            <a-option :value="2">正常</a-option>
            <a-option :value="1">关闭</a-option>
          </a-select>
        </a-form-item>
        <a-form-item field="createdAt" label="创建时间">
          <a-range-picker
            disabled
            v-model="queryForm.createdAt"
            style="width: 254px"
          />
        </a-form-item>
        <a-form-item>
          <a-space>
            <a-button type="primary" @click="handleQuery"
              ><icon-search /> 搜索</a-button
            >
            <a-button @click="handleResetQuery"><icon-loop /> 重置</a-button>
          </a-space>
        </a-form-item>
      </a-form>

      <a-divider />

      <div class="action">
        <a-space>
          <a-button
            type="primary"
            status="danger"
            @click="handleBatchDelete"
            :disabled="selectedKeys.length === 0"
            ><icon-delete /> 批量删除</a-button
          >
        </a-space>
      </div>

      <a-table
        :data="tableData"
        :columns="columns"
        :bordered="false"
        :row-selection="{ type: 'checkbox', showCheckedAll: true }"
        row-key="id"
        :pagination="{
          'show-total': true,
          'show-jumper': true,
          'show-page-size': true,
          current: currentPage,
          total: pager.total,
        }"
        v-model:selectedKeys="selectedKeys"
        @page-change="handlePageChange"
        @page-size-change="handlePageSizeChange"
      >
        <template #status="{ record }">
          <a-tag v-if="record.status == 2" color="green">正常</a-tag>
          <a-tag v-if="record.status == 1" color="red">关闭</a-tag>
        </template>
        <template #operTime="{ record }">
          {{ parseTime(record.operTime) }}
        </template>
        <template #action="{ record }">
          <a-popconfirm
            content="是否删除当前数据？"
            type="warning"
            @ok="removeSysOperaLogInfo([record.id])"
          >
            <a-button type="text" status="danger">删除</a-button>
          </a-popconfirm>
        </template>
      </a-table>
    </a-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue';
import { getSysOperaLog, removeSysOperaLog } from '@/api/admin/sys-opera-log';

const { proxy } = getCurrentInstance();

// 当前页
const currentPage = ref(1);

// 分页
const pager = {
  total: 0,
  pageIndex: 1,
  pageSize: 10,
};

//
const selectedKeys = ref([]);

const queryForm = reactive({});

const tableData = ref([]);
const columns = [
  { title: '编号', dataIndex: 'id' },
  { title: '请求信息', dataIndex: 'operUrl', width: 500 },
  { title: '操作人员', dataIndex: 'operName' },
  { title: '状态', dataIndex: 'status', slotName: 'status' },
  { title: '操作日期', dataIndex: 'operTime', slotName: 'operTime' },
  { title: '操作', slotName: 'action', slotName: 'action' },
];

// 查询
const handleQuery = () => {
  handlePageChange(1);
};

// 重置查询
const handleResetQuery = () => {
  proxy.$refs.queryFormRef.resetFields();
  handlePageChange(1);
};

// 批量删除
const handleBatchDelete = () => {
  console.log(selectedKeys.value);
  if (selectedKeys.value.length === 0) {
    proxy.$message.error('请勾选需要删除的数据！');
    return;
  }

  proxy.$modal.confirm({
    title: '注意',
    content: '是否批量删除选中？',
    onOk: () => {
      removeSysOperaLogInfo(selectedKeys.value);
    },
    onCancel: () => {
      proxy.$message.info('已取消操作');
    },
  });
};

// 页码改变
const handlePageChange = (page) => {
  currentPage.value = page;

  pager.pageIndex = page;
  getSysOperaLogInfo({ ...pager, ...queryForm });
};

//
const handlePageSizeChange = (pageSize) => {
  pager.pageSize = pageSize;
  getSysOperaLogInfo({ ...pager, ...queryForm });
};

// 获取操作日志
const getSysOperaLogInfo = async (params = {}) => {
  const res = await getSysOperaLog(params);
  const { count, list, pageIndex, pageSize } = res.data;
  tableData.value = list;

  Object.assign(pager, { total: count, pageIndex, pageSize });
};

/**
 * 删除操作日志
 * @params {array} ids
 */
const removeSysOperaLogInfo = async (ids) => {
  const res = await removeSysOperaLog({ ids });
  proxy.$message.success(res.msg);

  getSysOperaLogInfo();
};

onMounted(() => {
  getSysOperaLogInfo();
});
</script>

<style lang="scss">
.action {
  margin-bottom: 8px;
}
</style>
