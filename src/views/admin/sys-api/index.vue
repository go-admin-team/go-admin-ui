<template>
  <div class="app-container">
    <a-form :model="queryForm" ref="queryFormRef" layout="inline">
      <a-form-item field="title" label="标题">
        <a-input v-model="queryForm.title" placeholder="请输入标题" />
      </a-form-item>
      <a-form-item field="path" label="地址">
        <a-input v-model="queryForm.path" placeholder="请输入地址" />
      </a-form-item>
      <a-form-item field="action" label="类型">
        <a-select v-model="queryForm.action" placeholder="请选择类型">
          <a-option>GET</a-option>
          <a-option>POST</a-option>
          <a-option>PUT</a-option>
          <a-option>DELETE</a-option>
        </a-select>
      </a-form-item>
      <a-form-item>
        <a-space size="medium">
          <a-button type="primary" @click="handleQuery">
            <template #icon>
              <icon-search />
            </template>
            搜索
          </a-button>
          <a-button @click="handlResetQuery">
            <template #icon>
              <icon-loop />
            </template>
            重置
          </a-button>
        </a-space>
      </a-form-item>
    </a-form>

    <a-divider />

    <!-- Table -->
    <a-table
      :columns="columns"
      :data="tableData"
      :pagination="{
        'show-total': true,
        'show-jumper': true,
        'show-page-size': true,
        total: pager.count,
        current: currentPage,
      }"
      row-key="id"
      @page-change="handlePageChange"
      @page-size-change="handlePageSizeChange"
    > 
      <template #reqType="{ record }">
        <a-tag v-if="record.action.toLowerCase() === 'get'" color="cyan">{{record.action}}</a-tag>
        <a-tag v-else-if="record.action.toLowerCase() === 'post'" color="gold" >{{ record.action }}</a-tag>
        <a-tag v-else-if="record.action.toLowerCase() === 'put'" color="green"  >{{ record.action }}</a-tag>
        <a-tag  v-else-if="record.action.toLowerCase() === 'delete'" color="pinkpurple" >{{ record.action }}</a-tag>
      </template>
      <template #createdAt="{ record }"> {{ parseTime(record.createdAt) }}</template>
      <template #action="{ record }">
        <a-button type="text" @click="handleUpdate(record)"><icon-edit /> 修改 </a-button>
      </template>
    </a-table>

    <!-- Drawer -->
    <a-drawer
      :visible="drawerVisible"
      :width="450"
      @before-ok="handleDrawerSubmit"
      @cancel="handleDrawerCancel"
    >
      <template #title> 修改接口管理 </template>
      <a-form :model="drawerForm" ref="drawerFormRef" :rules="rules">
        <a-form-item field="handle" label="Handle">
          <a-input v-model="drawerForm.handle" placeholder="请输入Handle" />
        </a-form-item>
        <a-form-item field="title" label="标题">
          <a-input v-model="drawerForm.title" placeholder="请输入标题" />
        </a-form-item>
        <a-form-item field="type" label="类型">
          <a-select
            v-model="drawerForm.type"
            placeholder="请选择类型"
            allow-clear
          >
            <a-option>SYS</a-option>
            <a-option>BUS</a-option>
          </a-select>
        </a-form-item>
        <a-form-item field="action" label="方式">
          <a-select
            v-model="drawerForm.action"
            placeholder="请选择请求方式"
            allow-clear
          >
            <a-option>GET</a-option>
            <a-option>POST</a-option>
            <a-option>PUT</a-option>
            <a-option>DELETE</a-option>
          </a-select>
        </a-form-item>
        <a-form-item field="path" label="路径">
          <a-input v-model="drawerForm.path" disabled />
        </a-form-item>
      </a-form>
    </a-drawer>
  </div>
</template>

<script setup>
import { reactive, ref, getCurrentInstance, onMounted, nextTick } from 'vue';
import { IconSearch, IconLoop } from '@arco-design/web-vue/es/icon';
import { getSysApi,addSysApi,updateSysApi } from '@/api/admin/sys-api';

const { proxy } = getCurrentInstance();

// 分页当前页
const currentPage = ref(1);

// Pager
const pager = {
  count: 0,
  pageIndex: 1,
  pageSize: 10,
};

// From 定义
const queryForm = reactive({});
const drawerForm = reactive({});

// From 校验规则
const rules = {
  title: [{ required: true, message: '请输入标题' }],
  method: [{ required: true, message: '请选择方式' }],
};

// 抽屉显示
const drawerVisible = ref(false);

// Table Columns
const columns = [
  { title: '标题', dataIndex: 'title' },
  { title: '请求类型', dataIndex: 'action', slotName: 'reqType' },
  { title: '请求信息', dataIndex: 'path' },
  { title: '创建时间', dataIndex: 'createdAt', slotName: 'createdAt' },
  { title: '操作', slotName: 'action' },
];

// Table Data
const tableData = ref([]);

// Drawer 确定事件
// 异步关闭Modal需要调用 done()
const handleDrawerSubmit = (done) => {
  proxy.$refs.drawerFormRef.validate(async (valid) => {
    if (!valid) {
      let res;
      if (!drawerForm.id) {
        res = await addSysApi(drawerForm);
        proxy.$message.success(res.msg);
      } else {
        res = await updateSysApi(drawerForm, drawerForm.id);
        proxy.$message.success(res.msg);
        drawerVisible.value = false;
      }
      done();
      getSysApiInfo(pager);
    } else {
      proxy.$message.error('表单校验失败');
      done(false);
    }
  });
};

// Drawer 关闭事件
const handleDrawerCancel = () => {
  drawerVisible.value = false;
};

// 查询
const handleQuery = async () => {
  getSysApiInfo(queryForm);
  currentPage.value = 1;
};

// 重置查询
const handlResetQuery = () => {
  proxy.$refs.queryFormRef.resetFields();

  handlePageChange(1);
};

// 修改
const handleUpdate = async (record) => {
  drawerVisible.value = true;
  // updateSysApi(record);
  await nextTick();
  Object.assign(drawerForm, record);
};

/**
 * 分页改变
 * @param {Number} [page]
 */
const handlePageChange = (page) => {
  pager.pageIndex = page;

  // 修改当前页码
  currentPage.value = page;
  getSysApiInfo({ ...pager, ...queryForm });
};

// 每页数据量
const handlePageSizeChange = (pageSize) => {
  pager.pageSize = pageSize;
  getSysApiInfo({ ...pager, ...queryForm });
};

// 获取接口信息
const getSysApiInfo = async (params = {}) => {
  const res = await getSysApi(params);
  const { list, count, pageIndex, pageSize } = res.data;

  tableData.value = list;
  Object.assign(pager, { count, pageIndex, pageSize });
};

onMounted(() => {
  getSysApiInfo(pager);
});
</script>

<style lang="scss">
.pagination {
  margin-top: 12px;
  display: flex;
  justify-content: flex-end;
}

// Table 操作列样式
.arco-table-th:last-child > span {
  margin-left: 15px;
}
</style>
