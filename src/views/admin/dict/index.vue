<template>
  <div class="app-container">
    <a-form :model="queryForm" ref="queryFormRef" layout="inline">
      <a-form-item field="dictName" label="字典名称">
        <a-input
          v-model="queryForm.dictName"
          placeholder="请输入字典名称"
        ></a-input>
      </a-form-item>
      <a-form-item field="dictType" label="字典类型">
        <a-input
          v-model="queryForm.dictType"
          placeholder="请输入字典类型"
        ></a-input>
      </a-form-item>
      <a-form-item field="status" label="状态">
        <a-select v-model="queryForm.status" placeholder="请选择字典状态">
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

    <div class="action">
      <a-space>
        <a-button type="primary" @click="handleAdd"><icon-plus /> 新增</a-button>
        <a-button type="primary" status="danger" @click="handleBatchDelete"><icon-delete /> 批量删除</a-button>
        <a-button type="primary" status="warning" disabled><icon-download /> 导出</a-button>
      </a-space>
    </div>

    <!-- table -->
    <a-table
      :columns="tableColumns"
      :data="tableData"
      :row-selection="{ type: 'checkbox', showCheckedAll: true }"
      :pagination="{
        'show-total': true,
        'show-jumper': true,
        'show-page-size': true,
        current: currentPage,
        total: pager.total,
      }"
      row-key="id"
      @selection-change="
        (rowKey) => {
          batchDelList = rowKey;
        }
      "
      @page-change="handlePageChange"
      @page-size-change="handlePageSizeChange"
    >
      <template #dictType="{ record }">
        <router-link :to="`/admin/dict/data/${record.dictType}`">{{ record.dictType }}</router-link>
      </template>

      <template #status="{ record }">
        <a-tag v-if="record.status == 2" color="green">正常</a-tag>
        <a-tag v-else color="red">停用</a-tag>
      </template>

      <template #createdAt="{ record }">
        {{ parseTime(record.createdAt) }}
      </template>

      <template #action="{ record }">
        <a-button type="text" @click="handleUpdate(record)"><icon-edit /> 修改</a-button>
        <a-popconfirm content="是否删除该条数据？" type="warning" @ok="handleDelete([record.id])">
          <a-button type="text"><icon-delete /> 删除</a-button>
        </a-popconfirm>
      </template>
    </a-table>

    <!-- Modal弹框 -->
    <a-modal
      v-model:visible="modalVisible"
      title-align="start"
      :title="modalTitle"
      @before-ok="handleSubmit"
      @cancel="$refs.modalFormRef.resetFields()"
    >
      <a-form :model="modalForm" ref="modalFormRef">
        <a-form-item field="dictName" label="字典名称">
          <a-input
            v-model="modalForm.dictName"
            placeholder="请输入字典名称"
            :disabled="modalForm.id ? true : false"
          ></a-input>
        </a-form-item>
        <a-form-item field="dictType" label="字典类型">
          <a-input
            v-model="modalForm.dictType"
            placeholder="请输入字典类型"
            :disabled="modalForm.id ? true : false"
          ></a-input>
        </a-form-item>
        <a-form-item field="status" label="状态">
          <a-radio-group v-model="modalForm.status">
            <a-radio :value="2">正常</a-radio>
            <a-radio :value="1">停用</a-radio>
          </a-radio-group>
        </a-form-item>
        <a-form-item field="remark" label="备注">
          <a-textarea
            v-model="modalForm.remark"
            placeholder="请输入内容备注"
          ></a-textarea>
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup>
import { reactive, ref, getCurrentInstance, nextTick, onMounted } from 'vue';

// api
import {
  getDictType,
  addDictType,
  removeDictType,
  updateDictType,
} from '@/api/admin/sys-dict';

const { proxy } = getCurrentInstance();

const currentPage = ref(1);

// pager
const pager = {
  total: 0,
  pageIndex: 1,
  pageSize: 10,
};

// Delete List
const batchDelList = ref([]);
// form
const modalForm = reactive({
  status: 2,
});

// Table
const tableData = ref([]);
const tableColumns = [
  { title: '编号', dataIndex: 'id' },
  { title: '字典名称', dataIndex: 'dictName' },
  { title: '字典类型', dataIndex: 'dictType', slotName: 'dictType' },
  { title: '字典状态', dataIndex: 'status', slotName: 'status' },
  { title: '备注', dataIndex: 'remark' },
  { title: '创建时间', dataIndex: 'createdAt', slotName: 'createdAt' },
  { title: '操作', slotName: 'action' },
];

// Modal
const modalVisible = ref(false);
const modalTitle = ref('默认标题');

const { queryForm, handleQuery, handleResetQuery } = useQueryDict();
// 搜索
function useQueryDict() {
  const queryForm = reactive({});

  const handleQuery = () => {
    getSysDictTypeInfo(queryForm);
  };

  const handleResetQuery = () => {
    proxy.$refs.queryFormRef.resetFields();

    currentPage.value = 1;
    getSysDictTypeInfo(queryForm);
  };

  return {
    queryForm,
    handleQuery,
    handleResetQuery,
  };
}

// 页码改变
const handlePageChange = (page) => {
  pager.pageIndex = page;
  currentPage.value = page;

  getSysDictTypeInfo({ ...pager, ...queryForm });
};

// 每页数据量改变
const handlePageSizeChange = (pageSize) => {
  pager.pageSize = pageSize;

  getSysDictTypeInfo({ ...pager, ...queryForm });
};

// 新增
const handleAdd = () => {
  modalVisible.value = true;
  modalTitle.value = '新增字典';
};

// 批量删除
const handleBatchDelete = () => {
  if (batchDelList.value.length === 0) {
    proxy.$message.info('请选择要删除的数据！');
  } else {
    proxy.$modal.warning({
      title: '警告',
      content: '是否删除当前选中的数据？',
      hideCancel: false,
      onOk: () => {
        handleDelete(batchDelList.value);
      },
    });
  }
};

// 修改
const handleUpdate = async (record) => {
  modalVisible.value = true;
  modalTitle.value = '修改字典';

  await nextTick();
  Object.assign(modalForm, record);
};

// Submit
const handleSubmit = (done) => {
  proxy.$refs.modalFormRef.validate(async (err) => {
    if (!err) {
      try {
        let res;
        if (Reflect.has(modalForm, 'id')) {
          res = await updateDictType(modalForm, modalForm.id);
        } else {
          res = await addDictType(modalForm);
          currentPage.value = Math.ceil(++pager.total / pager.pageSize);
          pager.pageIndex = currentPage.value;
        }
        proxy.$message.success(res.msg);
        proxy.$refs.modalFormRef.resetFields();
        done();
        getSysDictTypeInfo(pager);
      } catch (e) {
        done(false);
      }
    } else {
      proxy.$message.error('表单校验失败！');
      done(false);
    }
  });
};

/**
 * 删除请求
 * @param {Array} idList
 */
const handleDelete = async (ids) => {
  if (!Array.isArray(ids)) return false;
  const res = await removeDictType({ ids });
  proxy.$message.success(res.msg);
  getSysDictTypeInfo(pager);
};

// 获取字典数据
const getSysDictTypeInfo = async (params = {}) => {
  const res = await getDictType(params);
  tableData.value = res.data.list;

  pager.total = res.data.count;
  pager.pageIndex = res.data.pageIndex;
  pager.pageSize = res.data.pageSize;
};

onMounted(() => {
  getSysDictTypeInfo();
});
</script>

<style lang="scss">
.action {
  margin-bottom: 12px;
}
</style>
