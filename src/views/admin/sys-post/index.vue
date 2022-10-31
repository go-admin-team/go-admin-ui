<template>
  <div class="app-container">
    <a-form :model="queryForm" ref="queryFormRef" layout="inline">
      <a-form-item field="postCode" label="岗位编码">
        <a-input v-model="queryForm.postCode" placeholder="请输入岗位编码" />
      </a-form-item>
      <a-form-item field="postName" label="岗位名称">
        <a-input v-model="queryForm.postName" placeholder="请输入岗位名称" />
      </a-form-item>
      <a-form-item field="status" label="岗位状态">
        <a-select
          v-model="queryForm.status"
          placeholder="请选择岗位状态"
          :style="{ width: '181px' }"
        >
          <a-option :value="2">正常</a-option>
          <a-option :value="1">停用</a-option>
        </a-select>
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
        <a-button type="primary" @click="handleAdd"><icon-plus /> 新增 </a-button>
        <a-button type="primary" status="danger" @click="handleBatchDelete"><icon-delete /> 批量删除 </a-button>
        <a-button type="primary" status="warning" disabled><icon-download /> 导出 </a-button>
      </a-space>
    </div>

    <!-- table -->
    <a-table
      :columns="columns"
      :data="tableData"
      :pagination="{
        'show-total': true,
        'show-jumper': true,
        'show-page-size': true,
        total: pager.total,
        current: currentPage,
      }"
      :row-selection="{ type: 'checkbox', showCheckedAll: true }"
      row-key="postId"
      @selection-change="selectionChange"
      @page-change="handlePageChange"
      @page-size-change="handlePageSizeChange"
    >
      <template #createdAt="{ record }">
        {{ parseTime(record.createdAt) }}
      </template>
      <template #status="{ record }">
        <a-tag v-if="record.status == 2" color="green">正常</a-tag>
        <a-tag v-else color="red">停用</a-tag>
      </template>
      <template #action="{ record }">
        <a-space>
          <a-button type="text" @click="handleUpdate(record)"><icon-edit /> 修改</a-button>
          <a-popconfirm content="是否删除该岗位？" type="warning"  @ok="handleDelete(record)">
            <a-button type="text"><icon-delete /> 删除</a-button>
          </a-popconfirm>
        </a-space>
      </template>
    </a-table>

    <!-- Modal -->
    <a-modal
      v-model:visible="modalVisible"
      :title="modalTitle"
      title-align="start"
      @before-ok="handleSubmit"
      @close="() => {$refs.modalFormRef.resetFields(); modalForm.postId = null;}"
    >
      <a-form :model="modalForm" :rules="rules" ref="modalFormRef">
        <a-form-item field="postName" label="岗位名称">
          <a-input v-model="modalForm.postName" placeholder="请输入岗位名称" />
        </a-form-item>
        <a-form-item field="postCode" label="岗位编码">
          <a-input v-model="modalForm.postCode" placeholder="请输入岗位编码" />
        </a-form-item>
        <a-form-item field="sort" label="岗位排序">
          <a-input-number
            v-model="modalForm.sort"
            mode="button"
            :default-value="0"
            :style="{ width: '150px' }"
          />
        </a-form-item>
        <a-form-item field="status" label="岗位状态">
          <a-radio-group v-model="modalForm.status">
            <a-radio :value="2"> 正常 </a-radio>
            <a-radio :value="1"> 停用 </a-radio>
          </a-radio-group>
        </a-form-item>
        <a-form-item field="remark" label="备注">
          <a-textarea v-model="modalForm.remark" placeholder="请输入备注内容" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup>
import { reactive, ref, getCurrentInstance, onMounted, nextTick } from 'vue';
import { getPost, addPost, removePost, updatePost } from '@/api/admin/post';
import { parseTime } from '@/utils/parseTime';

const { proxy } = getCurrentInstance();

const currentPage = ref(1);
// Pager
const pager = {
  total: 0,
  pageIndex: 1,
  pageSize: 10,
};
// form
const queryForm = reactive({});
const modalForm = reactive({
  sort: 0,
  status: 2,
});

// Rules
const rules = {
  postName: [{ required: true, message: '请输入岗位名称' }],
  postCode: [{ required: true, message: '请输入岗位编码' }],
  sort: [{ required: true, message: '请选择岗位排序' }],
};

// Modal
const modalVisible = ref(false);
const modalTitle = ref('默认标题');

// Batch Del List
let batchList = [];

// Table Columns
const columns = [
  { title: '岗位编号', dataIndex: 'postId' },
  { title: '岗位编码', dataIndex: 'postCode' },
  { title: '岗位名称', dataIndex: 'postName' },
  { title: '岗位排序', dataIndex: 'sort' },
  { title: '状态', dataIndex: 'status', slotName: 'status' },
  { title: '创建时间', dataIndex: 'createdAt', slotName: 'createdAt' },
  { title: '操作', slotName: 'action' },
];

// Table Data
const tableData = ref([]);

// 新增
const handleAdd = () => {
  modalVisible.value = true;
  modalTitle.value = '新增岗位';
};

// 修改
const handleUpdate = async (record) => {
  modalVisible.value = true;
  modalTitle.value = '修改岗位';

  await nextTick();
  Object.assign(modalForm, record);
};

// Modal ok
// 异步关闭Modal需要调用 done()
const handleSubmit = (done) => {
  proxy.$refs.modalFormRef.validate(async (valid) => {
    if (!valid) {
      let res;
      if (!modalForm.postId) {
        res = await addPost(modalForm);
        proxy.$message.success(res.msg);
      } else {
        res = await updatePost(modalForm, modalForm.postId);
        proxy.$message.success(res.msg);
      }
      done();
      getPostInfo(pager);
    } else {
      proxy.$message.error('表单校验失败');
      done(false);
    }
  });
};

// 批量删除
const handleBatchDelete = () => {
  if (batchList.length !== 0) {
    proxy.$modal.warning({
      title: '提示',
      content: '是否批量删除以下选中的数据？',
      hideCancel: false,
      onOk: async () => {
        const res = await removePost({ ids: batchList });
        proxy.$message.success(res.msg);
        getPostInfo(pager);
      },
      onCancel: () => {
        proxy.$message.info('已取消批量删除数据');
      },
    });
  } else {
    proxy.$message.error('请勾选需要删除的数据！');
  }
};

// 删除
const handleDelete = async ({ postId }) => {
  const res = await removePost({ ids: [postId] });
  proxy.$message.success(res.msg);
  getPostInfo();
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
  getPostInfo({ ...pager, ...queryForm });
};

// 每页数据量
const handlePageSizeChange = (pageSize) => {
  pager.pageSize = pageSize;
  getPostInfo({ ...pager, ...queryForm });
};

// 获取岗位信息
const getPostInfo = async (params = {}) => {
  const res = await getPost(params);
  tableData.value = res.data.list;

  // Pager
  const { count, pageIndex, pageSize } = res.data;
  Object.assign(pager, { total: count, pageIndex, pageSize });
};

// 查询岗位信息
const handleQuery = async () => {
  const params = {
    pageIndex: pager.pageIndex,
    pageSize: pager.pageSize,
    ...queryForm,
  };

  getPostInfo(params);
};

// 重置搜索
const handleResetQuery = () => {
  proxy.$refs.queryFormRef.resetFields();

  getPostInfo(queryForm);
}

onMounted(() => {
  getPostInfo(pager);
});
</script>

<style lang="scss">
.action {
  margin-bottom: 12px;
}
</style>
