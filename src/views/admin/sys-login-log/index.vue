<template>
  <div class="app-container">
    <a-form :model="queryForm" ref="queryFormRef" layout="inline">
      <a-form-item field="username" label="用户名">
        <a-input v-model="queryForm.username" placeholder="请输入用户名" @press-enter="handleQuery" />
      </a-form-item>
      <a-form-item field="status" label="状态">
        <a-select v-model="queryForm.status" placeholder="请选择系统登录日志状态">
          <a-option :value="2">正常</a-option>
          <a-option :value="1">关闭</a-option>
        </a-select>
      </a-form-item>
      <a-form-item field="ipaddr" label="IP地址">
        <a-input v-model="queryForm.ipaddr" placeholder="请输入IP地址" />
      </a-form-item>
      <a-form-item>
        <a-space>
          <a-button type="primary" @click="handleQuery"><icon-search /> 搜索</a-button>
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
          :disabled="selectedKeys.length === 0"
          @click="handleBatchDelete"
          ><icon-delete /> 批量删除</a-button
        >
      </a-space>
    </div>

    <a-table
      :data="tableData"
      :columns="columns"
      row-key="id"
      :row-selection="{ type: 'checkbox', showCheckedAll: true }"
      :pagination="{
        'show-total': true,
        'show-jumper': true,
        'show-page-size': true,
        current: currentPage,
        total: pager.count,
      }"
      v-model:selectedKeys="selectedKeys"
      @page-change="handlePageChange"
      @page-size-change="handlePageSizeChange"
    >
      <template #status="{ record }">
        <a-tag v-if="record.status == 2" color="green">正常</a-tag>
        <a-tag v-if="record.status == 1" color="red">失败</a-tag>
      </template>
      <template #loginTime="{ record }">
        {{ parseTime(record.loginTime) }}
      </template>
      <template #action="{ record }">
        <a-popconfirm
          content="是否删除当前数据？"
          @ok="removeSysLoginLogInfo([record.id])"
        >
          <a-button type="text" status="danger">删除</a-button>
        </a-popconfirm>
      </template>
    </a-table>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue';
import { getSysLoginLog, removeSysLoginLog } from '@/api/admin/sys-login-log';

const { proxy } = getCurrentInstance();

// 当前页
const currentPage = ref(1);

// Pager
const pager = {
  count: 0,
  pageIndex: 1,
  pageSize: 10,
};

// 表格多选
const selectedKeys = ref([]);

const queryForm = reactive({});

const tableData = ref([]);
const columns = [
  { title: '用户名', dataIndex: 'username' },
  { title: '类型', dataIndex: 'msg' },
  { title: '状态', dataIndex: 'status', slotName: 'status' },
  { title: 'IP地址', dataIndex: 'ipaddr' },
  { title: '登陆时间', dataIndex: 'loginTime', slotName: 'loginTime' },
  { title: '操作', slotName: 'action', slotName: 'action' },
];

// 查询
const handleQuery = () => {
  getSysLoginLogInfo({ ...pager, ...queryForm });
}

// 重置查询
const handleResetQuery = () => {
  proxy.$refs.queryFormRef.resetFields();
  handlePageChange(1);
};

// 页码改变
const handlePageChange = (page) => {
  currentPage.value = page;

  pager.pageIndex = page;
  getSysLoginLogInfo({ ...pager, ...queryForm });
};

// 每页数据量
const handlePageSizeChange = (pageSize) => {
  pager.pageSize = pageSize;
  getSysLoginLogInfo({ ...pager, ...queryForm });
};

// 批量删除
const handleBatchDelete = () => {
  proxy.$modal.confirm({
    title: '注意',
    content: '是否删除当前所有勾选数据？',
    onOk: () => {
      removeSysLoginLogInfo(selectedKeys.value);
    },
    onCancel: () => {
      proxy.$message.info('已取消操作');
    }
  })
}

// 获取登陆日志信息
const getSysLoginLogInfo = async (params = {}) => {
  const res = await getSysLoginLog(params);
  const { count, list, pageIndex, pageSize } = res.data;

  tableData.value = list;
  Object.assign(pager, { total: count, pageIndex, pageSize });
};

// 删除登陆日志信息
const removeSysLoginLogInfo = async (ids) => {
  const res = await removeSysLoginLog({ ids });
  proxy.$message.success(res.msg);

  getSysLoginLogInfo();
};

onMounted(() => {
  getSysLoginLogInfo();
});
</script>

<style lang="scss">
.action {
  margin-bottom: 8px;
}
</style>
