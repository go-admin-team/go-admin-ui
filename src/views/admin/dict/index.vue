<template>
  <div class="app-container">
    <a-form :model="queryForm" ref="queryFormRef" layout="inline">
      <a-form-item field="dictName" label="字典名称">
        <a-input v-model="queryForm.dictName" placeholder="请输入字典名称" @press-enter="handleQuery" />
      </a-form-item>
      <a-form-item field="dictType" label="字典类型">
        <a-input v-model="queryForm.dictType" placeholder="请输入字典类型" @press-enter="handleQuery" />
      </a-form-item>
      <a-form-item field="status" label="状态">
        <a-select v-model="queryForm.status" placeholder="请选择字典状态">
          <a-option :value="2">正常</a-option>
          <a-option :value="1">停用</a-option>
        </a-select>
      </a-form-item>
      <a-form-item>
        <a-space>
          <a-button v-has="'admin:sysDictType:query'" type="primary" @click="handleQuery"><icon-search /> 搜索</a-button>
          <a-button v-has="'admin:sysDictType:query'" @click="handleResetQuery"><icon-loop /> 重置</a-button>
        </a-space>
      </a-form-item>
    </a-form>

    <a-divider />

    <div class="action">
      <a-space>
        <a-button v-has="'admin:sysDictType:add'" type="primary" @click="handleAdd"><icon-plus /> 新增</a-button>
        <a-button v-has="'system:sysdicttype:remove'" type="primary" status="danger" @click="() => { deleteVisible = true; }"><icon-delete /> 批量删除</a-button>
        <a-button type="primary" status="warning" disabled><icon-download /> 导出</a-button>
      </a-space>
    </div>

    <!-- table -->
    <a-table
      :columns="tableColumns"
      :data="tableData"
      :row-selection="{ type: 'checkbox', showCheckedAll: true }"
      :pagination="{ 'show-total': true, 'show-jumper': true, 'show-page-size': true, total: pager.count, current: currentPage }"
      row-key="id"
      @selection-change="(selection) => {deleteData = selection;}" 
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
        <a-button v-has="'admin:sysDictType:edit'" type="text" @click="handleUpdate(record)"><icon-edit /> 修改</a-button>
        <a-button v-has="'admin:sysDictType:remove'" type="text" @click="() => { deleteVisible = true; deleteData = [record.id];  }"><icon-edit /> 删除</a-button>
      </template>
    </a-table>

    <!-- Modal弹框 -->
    <a-modal
      v-model:visible="modalVisible"
      title-align="start"
      :title="modalTitle"
      @before-ok="handleSubmit"
      @close="$refs.modalFormRef.resetFields()"
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

    <!-- Akiraka 20230223 删除与批量删除 开始 -->
    <DeleteModal 
      :data="deleteData" 
      :visible="deleteVisible" 
      :apiDelete="removeDictType" 
      @deleteVisibleChange="() => deleteVisible = false"
    />
    <!-- Akiraka 20230223 删除与批量删除 结束 -->
  </div>
</template>

<script setup>
import { reactive, ref, getCurrentInstance, nextTick, onMounted, watch } from 'vue';
import { getDictType, addDictType, removeDictType, updateDictType } from '@/api/admin/sys-dict';

// Akiraka 20230210 删除数据
const deleteData = ref([])
// Akiraka 20230210 删除对话框
const deleteVisible = ref(false)
// Akiraka 20230210 监听删除事件
watch(() => deleteVisible.value ,(value) => {
  if ( value == false ) {
    getSysDictTypeInfo({ ...pager, ...queryForm });
  }
})

const { proxy } = getCurrentInstance();

const currentPage = ref(1);

// pager
const pager = {
  count: 0,
  pageIndex: 1,
  pageSize: 10,
};

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
          const { code, msg } = await updateDictType(modalForm, modalForm.id);
          if (code == 200 ) {
            proxy.$notification.success('更新成功');
          } else {
            proxy.$notification.error(msg);
          }
        } else {
          const { code, msg } = await addDictType(modalForm);
          currentPage.value = Math.ceil(++pager.count / pager.pageSize);
          pager.pageIndex = currentPage.value;
          if (code == 200 ) {
            proxy.$notification.success('新增成功');
          } else {
            proxy.$notification.error(msg);
          }
        }
        modalVisible.value = false;
        getSysDictTypeInfo(pager);
        done();
      } catch (e) {
        done(false);
      }
    } else {
      proxy.$message.error('表单校验失败！');
      done(false);
    }
  });
};

// 获取字典数据
const getSysDictTypeInfo = async (params = {}) => {
  const { data, code, msg } = await getDictType(params);
  if ( code == 200 ) {
    tableData.value = data.list;
    Object.assign(pager, { count: data.count, pageIndex: data.pageIndex, pageSize: data.pageSize });
  } else {
    proxy.$notification.error(msg);
  }
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
