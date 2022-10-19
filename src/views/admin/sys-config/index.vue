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
        <a-button type="primary" @click="handleAdd"><icon-plus /> 新增</a-button>
        <a-button type="primary" status="danger" disabled><icon-delete /> 删除</a-button>
        <a-button type="primary" status="warning" disabled><icon-download /> 导出</a-button>
      </a-space>
    </div>

    <a-table
      :data="tableData"
      :columns="columns"
      :pagination="{
        'show-total': true,
        'show-jumper': true,
        'show-page-size': true,
        total: pager.total,
        current: currentPage,
      }"
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
        <a-button type="text" @click="handleUpdate(record)"><icon-edit /> 修改</a-button>
        <a-popconfirm content="是否删除该条数据？"  @ok="handleDelete([record.id])" position="lt" type="warning">
          <a-button type="text"><icon-delete /> 删除</a-button>
        </a-popconfirm>
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
  </div>
</template>

<script setup>
import { onMounted, reactive, ref, getCurrentInstance } from 'vue';

// Api
import {
  getSysConfig,
  addSysConfig,
  removeSysConfig,
  updateSysConfig,
} from '@/api/admin/sys-config';

const { proxy } = getCurrentInstance();

const currentPage = ref(1);

const pager = {
  total: 0,
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
  const res = await getSysConfig(params);
  tableData.value = res.data.list;

  pager.total = res.data.count;
  pager.pageIndex = res.data.pageIndex;
  pager.pageSize = res.data.pageSize;
};

// 提交
const handleSubmit = (data) => {
  return new Promise(async (resolve, reject) => {
    try {
      let res;
      if (!data.id) {
        res = await addSysConfig(data);
        resolve('添加成功');
      } else {
        res = await updateSysConfig(data, data.id);
        resolve('更新成功');
      }
    } catch (err) {
      reject(err);
    }
  });
};

/**
 * 删除
 * @param {Array} ids
 */
const handleDelete = async (ids) => {
  const res = await removeSysConfig({ ids });
  proxy.$message.success(res.msg);
  getSysConfigInfo();
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
