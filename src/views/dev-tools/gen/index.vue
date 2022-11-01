<template>
  <div class="app-container">
    <a-form :model="queryForm" ref="queryFormRef" layout="inline">
      <a-form-item field="tableName" label="表名称">
        <a-input v-model="queryForm.tableName" placeholder="请输入表名称" />
      </a-form-item>
      <a-form-item field="tableComment" label="表描述">
        <a-input v-model="queryForm.tableComment" placeholder="请输入描述" />
      </a-form-item>
      <a-form-item>
        <a-space>
          <a-button type="primary" @click="handleQuery"><icon-search /> 搜索</a-button>
          <a-button @click="handleResetQuery"><icon-loop /> 重置</a-button>
          
        </a-space>
      </a-form-item>
    </a-form>

    <a-divider />

    <!-- action -->
    <div class="action">
      <a-space>
        <a-button type="primary" @click="openImportTable"><icon-plus /> 导入 </a-button>
        <a-button type="primary" status="danger" @click="handleDelete"><icon-delete /> 批量删除</a-button>
      </a-space>
    </div>

    <!-- table -->
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
      row-key="tableId"
      @selection-change="(selection) => {ids = selection;}" 
      @page-change="handlePageChange"
      @page-size-change="handlePageSizeChange"
    >
      <template #columns>
        <a-table-column title="序号" data-index="tableId" :width="180" ellipsis tooltip/>
        <a-table-column title="表名称" data-index="tableName" :width="180" ellipsis tooltip/>
        <a-table-column title="表描述" data-index="tableComment" :width="180" ellipsis tooltip/>
        <a-table-column title="模型名称" data-index="className" :width="180" ellipsis tooltip/>
        <a-table-column title="动作" :width="370" align="center" >
          <template #cell="{ record }">
            <a-button-group>
              <a-button size="small" @click="handleEditTable(record)">编辑</a-button>
              <a-button size="small" @click="handlePreview(record)">预览</a-button>
              <a-popconfirm content="正在使用代码生成请确认?" okText="生成" type="warning" @ok="handleToProject(record)">
                <a-button size="small">代码生成 </a-button>
              </a-popconfirm>
              <a-popconfirm content="正在使用【菜单以及API生成到数据库】请确认?" okText="写入DB" type="warning" @ok="handleToDB(record)">
                <a-button size="small">生成配置 </a-button>
              </a-popconfirm>
              <a-popconfirm content="正在使用代码生成配置迁移脚本请确认?" okText="迁移" type="warning" @ok="handleToApiFile(record)">
                <a-button size="small">生成迁移脚本 </a-button>
              </a-popconfirm>
              <a-button size="small" @click="handleDelete(record)">删除</a-button>
            </a-button-group>
          </template>
        </a-table-column>
      </template>
    </a-table>

    <!-- 导入对话框 -->
    <import-table v-model:visible="modalVisible" />

    <!-- 预览代码对话框 -->
    <a-modal v-model:visible="codeVisible" title="预览代码" width="80%">
      <a-space style="margin-bottom: 16px;">
        <a-tag v-for="(value, key) of preview.data" :key="key" bordered color="#165dff" @click="codeChange(key)">{{ key.substring(key.lastIndexOf('/')+1,key.indexOf('.go.template')) }}</a-tag>
      </a-space>
      <!-- 代码编辑器 -->
      <codemirror v-model="codestr"  :style="{ height: '600px' }" :autofocus="true" :indent-with-tab="true" :tab-size="2" :extensions="extensions" />
    </a-modal>
  </div>
</template>

<script setup>
import { reactive, ref, getCurrentInstance, onMounted, nextTick } from 'vue';
import importTable from './importTable.vue'
import { listTable,previewTable,delTable,apiToFile,toProjectTableCheckRole,toDBTable } from '@/api/tools/gen';
import { parseTime } from '@/utils/parseTime';

import { Codemirror } from 'vue-codemirror'
import { javascript } from '@codemirror/lang-javascript'
import { oneDark } from '@codemirror/theme-one-dark'

const { proxy } = getCurrentInstance();

const currentPage = ref(1);
// Pager
const pager = {
  count: 0,
  pageIndex: 1,
  pageSize: 10,
};
// form
const queryForm = reactive({});
const modalForm = reactive({
  sort: 0,
  status: 2,
});

const modalVisible = ref(false);
const openImportTable = () => {
  modalVisible.value = true;
};
// Batch Del List
let batchList = [];

// Table Data
const tableData = ref([]);

// 修改
const handleUpdate = async (record) => {
  modalVisible.value = true;
  modalTitle.value = '修改岗位';
  await nextTick();
  Object.assign(modalForm, record);
};

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
  getListTable({ ...pager, ...queryForm });
};

// 每页数据量
const handlePageSizeChange = (pageSize) => {
  pager.pageSize = pageSize;
  getListTable({ ...pager, ...queryForm });
};

// 获取列表数据
const getListTable = async (params = {}) => {
  const res = await listTable(params);
  tableData.value = res.data.list;
  // Pager
  const { count, pageIndex, pageSize } = res.data;
  Object.assign(pager, { count, pageIndex, pageSize });
};

// 查询列表信息
const handleQuery = async () => {
  const params = {
    pageIndex: pager.pageIndex,
    pageSize: pager.pageSize,
    ...queryForm,
  };

  getListTable(params);
};

// 重置搜索
const handleResetQuery = () => {
  proxy.$refs.queryFormRef.resetFields();
  getListTable(queryForm);
}

// 选中数组
const ids = ref([]);
// 删除与批量删除
const handleDelete = (row) => {
  let Ids = (row.tableId && [row.tableId]) || ids.value
  if (Ids.length !== 0) {
    proxy.$modal.warning({
      title: '提示',
      content: '是否确认删除编号为 ' + Ids + ' 的数据项?',
      hideCancel: false,
      onOk: async () => {
        await delTable(Ids);
        proxy.$message.success("选择数据删除成功");
        getListTable(pager);
      },
      onCancel: () => {
        proxy.$message.info('删除操作已取消');
      },
    });
  } else {
    proxy.$message.error('请勾选需要删除的数据！');
  }
};
// 按钮块
// 编辑
const handleEditTable = (row) => {
  const tableId = row.tableId || this.ids[0]
  proxy.$router.push({ path: '/dev-tools/editTable', query: { tableId: tableId }})
}
// 预览代码参数
// 预览代码对话框
const codeVisible = ref(false);
// 预览参数
const preview = ref({
  open: false,
  title: '代码预览',
  data: {},
  activeName: 'api.go'
})
/** 预览按钮 */
const handlePreview = (row) => {
  codeVisible.value = true;
  previewTable(row.tableId).then(response => {
    console.log("sadasdasdasd",response)
    preview.value.data = response.data
    preview.value.open = true
    codeChange('template/api.go.template')
  })
}
// 代码编辑器参数
const cmOptions = ref({
  tabSize: 4,
  theme: 'material-palenight',
  mode: 'text/javascript',
  lineNumbers: true,
  line: true
})
const extensions = [javascript(), oneDark];
const codestr = ref('')
// 预览代码 代码更改
const codeChange = (e) => {
  if (e.indexOf('js') > -1) {
    
    cmOptions.value.mode = 'text/javascript'
  }
  if (e.indexOf('model') > -1 || e.indexOf('router') > -1 || e.indexOf('api') > -1 || e.indexOf('service') > -1 || e.indexOf('dto') > -1) {
    cmOptions.value.mode = 'text/x-go'
  }
  if (e.indexOf('vue') > -1) {
    cmOptions.value.mode = 'text/x-vue'
  }
  codestr.value = preview.value.data[e]
}
// 代码生成
const handleToProject = (row) => {
  console.log("dasdasd",row)
  toProjectTableCheckRole(row.tableId, false).then((response) => {
    proxy.$message.success(response.msg);
  }).catch(function() {})
}
// 生成配置
const handleToDB = (row) => {
  toDBTable(row.tableId).then((response) => {
    proxy.$message.success(response.msg);
  }).catch(function() {})
}
// 生成迁移脚本
const handleToApiFile = (row) => {
  apiToFile(row.tableId, true).then((response) => {
    proxy.$message.success(response.msg);
  }).catch(function() {})
}

onMounted(() => {
  getListTable(pager);
});
</script>

<style lang="scss">
.action {
  margin-bottom: 12px;
}
</style>
