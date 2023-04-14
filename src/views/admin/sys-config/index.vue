<template>
  <div class="app-container">
    <a-form :model="queryForm" ref="queryFormRef" layout="inline">
      <a-form-item field="configName" label="参数名称">
        <a-input
          v-model="queryForm.configName"
          placeholder="请输入参数名称"
        ></a-input>
      </a-form-item>
      <a-form-item field="configKey" label="参数键名">
        <a-input
          v-model="queryForm.configKey"
          placeholder="请输入参数键名"
        ></a-input>
      </a-form-item>
      <a-form-item field="configType" label="系统内置">
        <a-select v-model="queryForm.configType" placeholder="选择系统内置">
          <a-option value="Y">是</a-option>
          <a-option value="N">否</a-option>
        </a-select>
      </a-form-item>
      <a-form-item>
        <a-space>
          <a-button type="primary" @click="handleQuery()"><icon-search /> 搜索</a-button>
          <a-button @click="handleResetQuery()"><icon-loop /> 重置</a-button>
        </a-space>
      </a-form-item>
    </a-form>

    <!-- 分割线 -->
    <a-divider />

    <div class="action">
      <a-space>
        <a-button v-has="'admin:sysConfig:add'" type="primary" @click="handleAdd"><icon-plus /> 新增</a-button>
        <a-button v-has="'admin:sysConfig:remove'" type="primary" status="danger" disabled><icon-delete /> 删除</a-button>
        <a-button type="primary" status="warning" disabled><icon-download /> 导出</a-button>
      </a-space>
    </div>

    <a-table
      :data="tableData"
      :columns="columns"
      :pagination="{ 'show-total': true, 'show-jumper': true, 'show-page-size': true, total: pager.count, current: currentPage }"
      @page-change="handlePageChange"
      @page-size-change="handlePageSizeChange"
    >
      <template #configType="{ record }">
        <a-tag v-if="record.configType === 'Y'" color="green">是</a-tag>
        <a-tag v-else-if="record.configType === 'N'" color="red">否</a-tag>
      </template>

      <template #createdAt="{ record }">
        {{ parseTime(record.createdAt) }}
      </template>

      <template #action="{ record }">
        <a-button v-has="'admin:sysConfig:edit'" type="text" @click="handleUpdate(record)"><icon-edit /> 修改</a-button>
        <a-button v-has="'admin:sysConfig:edit'" type="text" @click="() => { deleteVisible = true; deleteData = [record.id];  }"><icon-delete /> 删除</a-button>
      </template>
    </a-table>

    <a-modal
      v-model:visible="visible"
      :title="title"
      title-align="start"
      @before-ok="handleBeforeOk"
      @close="handleResetModalForm"
    >
      <a-form :model="modalForm" :rules="rules" ref="modalFormRef">
        <a-form-item field="configName" label="参数名称">
          <a-input
            v-model="modalForm.configName"
            placeholder="请输入参数名称"
          />
        </a-form-item>
        <a-form-item field="configKey" label="参数键名">
          <a-input v-model="modalForm.configKey" placeholder="请输入参数键名" />
        </a-form-item>
        <a-form-item field="configValue" label="参数键值">
          <a-input
            v-model="modalForm.configValue"
            placeholder="请输入参数键值"
          />
        </a-form-item>
        <a-form-item field="configType" label="系统内置">
          <a-radio-group v-model="modalForm.configType">
            <a-radio value="Y">是</a-radio>
            <a-radio value="N">否</a-radio>
          </a-radio-group>
        </a-form-item>
        <a-form-item field="isFrontend" label="前台显示">
          <a-radio-group v-model="modalForm.isFrontend">
            <a-radio :value="1">是</a-radio>
            <a-radio :value="0">否</a-radio>
          </a-radio-group>
        </a-form-item>
        <a-form-item field="remark" label="备注">
          <a-textarea
            v-model="modalForm.remark"
            placeholder="请输入备注内容"
          ></a-textarea>
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- Akiraka 20230223 删除与批量删除 开始 -->
    <DeleteModal 
      :data="deleteData" 
      :visible="deleteVisible" 
      :apiDelete="removeSysConfig" 
      @deleteVisibleChange="() => deleteVisible = false"
    />
    <!-- Akiraka 20230223 删除与批量删除 结束 -->
  </div>
</template>

<script setup>
import { onMounted, reactive, ref, getCurrentInstance, watch } from 'vue';
import { getSysConfig, addSysConfig, removeSysConfig, updateSysConfig } from '@/api/admin/sys-config';

// Akiraka 20230210 删除数据
const deleteData = ref([])
// Akiraka 20230210 删除对话框
const deleteVisible = ref(false)
// Akiraka 20230210 监听删除事件
watch(() => deleteVisible.value ,(value) => {
  if ( value == false ) {
    getSysConfigInfo(pager);
  }
})

const { proxy } = getCurrentInstance();

const currentPage = ref(1);

const pager = {
  count: 0,
  pageIndex: 1,
  pageSize: 10,
};

const { queryForm, handleQuery, handleResetQuery } = useQueryForm();
const { tableData, columns, handlePageChange, handlePageSizeChange } =
  useTableData();
const {
  rules,
  title,
  visible,
  modalForm,
  handleAdd,
  handleUpdate,
  handleBeforeOk,
} = useModal();

function useQueryForm() {
  const queryForm = reactive({});

  const handleQuery = () => {
    getSysConfigInfo(queryForm);
  };

  const handleResetQuery = () => {
    proxy.$refs.queryFormRef.resetFields();

    handlePageChange(1);
  };

  return {
    queryForm,
    handleQuery,
    handleResetQuery,
  };
}

function useTableData() {
  const tableData = ref([]);
  const columns = [
    { title: '编码', dataIndex: 'id', width: 70 },
    { title: '名称', dataIndex: 'configName' },
    { title: '键名', dataIndex: 'configKey' },
    {
      title: '内置',
      dataIndex: 'configType',
      slotName: 'configType',
      width: 100,
    },
    {
      title: '备注',
      dataIndex: 'remark',
      width: 350,
      ellipsis: true,
      tooltip: true,
    },
    { title: '创建时间', dataIndex: 'createdAt', slotName: 'createdAt' },
    { title: '操作', dataIndex: 'action', slotName: 'action' },
  ];

  // 分页改变
  const handlePageChange = (page) => {
    pager.pageIndex = page;
    getSysConfigInfo(pager);
  };

  // 每页数据量
  const handlePageSizeChange = (pageSize) => {
    pager.pageSize = pageSize;
    getSysConfigInfo(pager);
  };

  return {
    columns,
    tableData,
    handlePageChange,
    handlePageSizeChange,
  };
}

function useModal() {
  const visible = ref(false);
  const title = ref('默认标题');
  const modalForm = reactive({
    configType: 'Y',
    isFrontend: 1,
  });

  const rules = {
    configName: [{ required: true, message: '请输入参数名称' }],
    configKey: [{ required: true, message: '请输入参数键名' }],
    configValue: [{ required: true, message: '请输入参数键值' }],
  };

  const handleAdd = () => {
    visible.value = true;
    title.value = '新增参数';
  };

  const handleUpdate = async (record) => {
    visible.value = true;
    title.value = '修改参数';

    Object.assign(modalForm, record);
  };

  const handleBeforeOk = (done) => {
    proxy.$refs.modalFormRef.validate(async (err) => {
      if (!err) {
        try {
          const msg = await handleSubmit(modalForm);
          proxy.$message.success(msg);
          done();
          getSysConfigInfo();
        } catch (e) {
          proxy.$message.error(e);
          done(false);
        }
      } else {
        proxy.message.error('表单校验失败');
        done(false);
      }
    });
  };

  return {
    rules,
    title,
    visible,
    modalForm,
    handleAdd,
    handleUpdate,
    handleBeforeOk,
  };
}

// 获取系统配置
const getSysConfigInfo = async (params = {}) => {
  const { data, code, msg } = await getSysConfig(params);
  if ( code == 200 ) {
    tableData.value = data.list;
    Object.assign(pager, { count: data.count, pageIndex: data.pageIndex, pageSize: data.pageSize });
  } else {
    proxy.$notification.error(msg);
  }
};

// 提交
const handleSubmit = (data) => {
  return new Promise(async (resolve, reject) => {
    try {
      let res;
      if (!data.id) {
        const { code, msg } = await addSysConfig(data);
        if (code == 200 ) {
          proxy.$notification.success('新增成功');
        } else {
          proxy.$notification.error(msg);
        }
      } else {
        const { code, msg } = await updateSysConfig(data, data.id);
        if (code == 200 ) {
          proxy.$notification.success('修改成功');
        } else {
          proxy.$notification.error(msg);
        }
      }
    } catch (err) {
      reject(err);
    }
  });
};

// 重置表单
const handleResetModalForm = () => {
  proxy.$refs.modalFormRef.resetFields();

  modalForm.id = null;
}

onMounted(() => {
  getSysConfigInfo();
});
</script>

<style lang="scss">
.action {
  margin-bottom: 8px;
}
</style>
