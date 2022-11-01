<template>
  <a-modal v-model:visible="visible" title="导入表" @ok="handleImportTable" :ok-loading="loading" @cancel="visible = false" width="50%">
    <a-form :model="queryForm" ref="queryFormRef" layout="inline">
      <a-form-item field="tableName" label="表名称">
        <a-input v-model="queryForm.tableName" placeholder="请输入表名称" />
      </a-form-item>
      <a-form-item field="tableComment" label="表描述">
        <a-input v-model="queryForm.tableComment" placeholder="请输入表描述" />
      </a-form-item>
      <a-form-item>
        <a-space>
          <a-button type="primary" @click="handleQuery"><icon-search /> 搜索</a-button>
          <a-button @click="handleResetQuery"><icon-loop /> 重置</a-button>
        </a-space>
      </a-form-item>
    </a-form>
    <a-divider />

    <a-table
      :data="tableData"
      :pagination="{
        'show-total': true,
        'show-jumper': true,
        'show-page-size': true,
        total: pager.count,
        current: currentPage,
      }"
      :row-selection="{ type: 'checkbox', showCheckedAll: true }"
      row-key="tableName"
      @selection-change="selectionChange"
      @page-change="handlePageChange"
      @page-size-change="handlePageSizeChange"
    >
      <template #columns>
        <a-table-column title="表名称" data-index="tableName" :width="180" ellipsis tooltip/>
        <a-table-column title="表描述" data-index="tableComment" :width="180" ellipsis tooltip/>
        <a-table-column title="创建时间" :width="180" ellipsis>
          <template #cell="{ record }">
            {{ parseTime(record.createTime) }}
          </template>
        </a-table-column>
        <a-table-column title="更新时间" :width="180" ellipsis>
          <template #cell="{ record }">
            {{ parseTime(record.updateTime) }}
          </template>
        </a-table-column>
      </template>
    </a-table>
  </a-modal>
</template>
  
<script setup>
import { reactive, ref, onMounted, getCurrentInstance } from 'vue';
import { listDbTable,importTable,listTable} from '@/api/tools/gen';
const { proxy } = getCurrentInstance();

// 对话框默认值
const visible = ref(false);

// 按钮加载中状态
const loading = ref(false)

// 对话框确认
const handleImportTable = () => {
  loading.value = true
  importTable({ tables: batchList.join(',') }).then(res => {
    if (res.code === 200) {
      proxy.$message.info(res.msg);
      // 关闭对话框
      visible.value = false;
      // 完成刷新下页面
      location.reload();
    } else {
      proxy.$message.info(res.msg);
    }
    loading.value = false
  })
};

const queryForm = reactive({});
// 查询列表信息
const handleQuery = async () => {
  const params = {
    pageIndex: pager.pageIndex,
    pageSize: pager.pageSize,
    ...queryForm,
  };

  getDbTables(params);
};
// 重置搜索
const handleResetQuery = () => {
  proxy.$refs.queryFormRef.resetFields();
  getDbTables(queryForm);
}


const tableData = ref([]);
// Batch Del List
let batchList = [];
// Table 勾选数据
const selectionChange = (rowKeys) => {
  batchList = rowKeys;
};
/**
 * 分页改变
 * @param {Number} [page]
 */
 const handlePageChange = (page) => {
  pager.pageIndex = page;
  // 修改当前页码
  currentPage.value = page;
  getDbTables({ ...pager, ...queryForm });
};

// 每页数据量
const handlePageSizeChange = (pageSize) => {
  pager.pageSize = pageSize;
  getDbTables({ ...pager, ...queryForm });
};

// 初始页数
const currentPage = ref(1);
// Pager
const pager = {
  count: 0,
  pageIndex: 1,
  pageSize: 10,
};

// 获取列表数据
const getDbTables = async (params = {}) => {
  const res = await listDbTable(params);
  tableData.value = res.data.list;
  const { count, pageIndex, pageSize } = res.data;
  Object.assign(pager, { count, pageIndex, pageSize });
};

onMounted(() => {
  getDbTables(pager);
});
</script>