<template>
  <div class="app-container">
    <a-form :model="queryForm" ref="queryFormRef" layout="inline">
      <a-form-item field="jobName" label="任务名称">
        <a-input
          v-model="queryForm.jobName"
          placeholder="请输入任务名称"
        ></a-input>
      </a-form-item>
      <a-form-item field="jobGroup" label="任务分组">
        <a-select v-model="queryForm.jobGroup" placeholder="请选择任务分组">
          <a-option value="DEFAULT">默认</a-option>
          <a-option value="SYSTEM">系统</a-option>
        </a-select>
      </a-form-item>
      <a-form-item field="status" label="状态">
        <a-select v-model="queryForm.status" placeholder="请选择任务状态">
          <a-option :value="2">正常</a-option>
          <a-option :value="1">关闭</a-option>
        </a-select>
      </a-form-item>
      <a-form-item>
        <a-space>
          <a-button type="primary" @click="handleQuery">查询</a-button>
          <a-button @click="handleResetQuery">重置</a-button>
        </a-space>
      </a-form-item>
    </a-form>

    <a-divider />

    <div class="table-action">
      <a-button type="primary" @click="handleAdd">新增定时任务</a-button>
    </div>

    <a-table :data="tableData" :columns="columns"  :pagination="{ 'show-total': true, 'show-jumper': true, 'show-page-size': true, total: pager.count, current: currentPage }">
      <template #status="{ record }">
        <a-tag v-if="record.status == 2" color="green">正常</a-tag>
        <a-tag v-if="record.status == 1" color="red">停用</a-tag>
      </template>
      <template #action="{ record }">
        <a-button type="text" @click="handleUpdate(record)">修改</a-button>
        <a-button type="text" status="success" v-if="record.entry_id == 0" @click="handleStart(record.jobId)">启动</a-button>
        <a-button type="text" status="danger" v-if="record.entry_id !== 0" @click="handleStop(record.jobId)">停止</a-button>
        <a-button type="text" status="danger" @click="() => { deleteVisible = true; deleteData = [record.jobId];  }">删除</a-button>
      </template>
    </a-table>

    <a-modal
      v-model:visible="modalVisible"
      title-align="start"
      :title="modalTitle"
      :on-before-ok="onBeforeOk"
      @ok="handleOk"
      @cancel="$refs.modalFormRef.resetFields()"
    >
      <a-form
        :model="modalForm"
        :rules="rules"
        ref="modalFormRef"
        auto-label-width
      >
        <a-form-item field="jobName" label="任务名称">
          <a-input
            v-model="modalForm.jobName"
            placeholder="请输入任务名称"
          ></a-input>
        </a-form-item>
        <a-form-item field="jobGroup" label="任务分组">
          <a-select v-model="modalForm.jobGroup" placeholder="请选择任务分组">
            <a-option value="DEFAULT">默认</a-option>
            <a-option value="SYSTEM">系统</a-option>
          </a-select>
        </a-form-item>
        <a-form-item field="invokeTarget" label="调用目标">
          <a-input
            v-model="modalForm.invokeTarget"
            placeholder="调用目标"
          ></a-input>
        </a-form-item>
        <a-form-item field="args" label="目标参数">
          <a-input v-model="modalForm.args" placeholder="目标参iuu数"></a-input>
        </a-form-item>
        <a-form-item field="cronExpression" label="Cron表达式">
          <a-input
            v-model="modalForm.cronExpression"
            placeholder="Cron表达式"
          ></a-input>
        </a-form-item>
        <a-form-item field="concurrent" label="是否并发">
          <a-radio-group v-model="modalForm.concurrent" type="button">
            <a-radio :value="0">允许</a-radio>
            <a-radio :value="1">禁止</a-radio>
          </a-radio-group>
        </a-form-item>
        <a-form-item field="jobType" label="调用类型">
          <a-radio-group v-model="modalForm.jobType" type="button">
            <a-radio :value="1">接口</a-radio>
            <a-radio :value="2">函数</a-radio>
          </a-radio-group>
        </a-form-item>
        <a-form-item field="misfirePolicy" label="执行策略">
          <a-radio-group v-model="modalForm.misfirePolicy" type="button">
            <a-radio :value="1">立即执行</a-radio>
            <a-radio :value="2">执行一次</a-radio>
            <a-radio :value="3">放弃执行</a-radio>
          </a-radio-group>
        </a-form-item>
        <a-form-item field="status" label="状态">
          <a-select v-model="modalForm.status">
            <a-option :value="2">正常</a-option>
            <a-option :value="1">停用</a-option>
          </a-select>
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- Akiraka 20230223 删除与批量删除 开始 -->
    <DeleteModal 
      :data="deleteData" 
      :visible="deleteVisible" 
      :apiDelete="delSysJob" 
      @deleteVisibleChange="() => deleteVisible = false"
    />
    <!-- Akiraka 20230223 删除与批量删除 结束 -->
  </div>
</template>

<script setup>
import { reactive, ref, onMounted, getCurrentInstance, watch } from 'vue';
import { listSysJob, addSysJob, updateSysJob, delSysJob, startJob, removeJob } from '@/api/sys-job';

// Akiraka 20230210 删除数据
const deleteData = ref([])
// Akiraka 20230210 删除对话框
const deleteVisible = ref(false)
// Akiraka 20230210 监听删除事件
watch(() => deleteVisible.value ,(value) => {
  if ( value == false ) {
    getSysJobListInfo(queryForm);
  }
})

const { proxy } = getCurrentInstance();

const currentPage = ref(1);
// Pager
const pager = {
  count: 0,
  pageIndex: 1,
  pageSize: 10,
};

const queryForm = reactive({});
const modalForm = reactive({
  concurrent: 1,
  jobType: 1,
  misfirePolicy: 1,
  status: 2,
});

// 表单检验规则
const rules = {
  jobName: [{ required: true, message: '请输入任务名称' }],
  jobGroup: [{ required: true, message: '请选择任务分组' }],
  invokeTarget: [{ required: true, message: '请输入调用目标' }],
  cronExpression: [{ required: true, message: '请输入Cron表达式' }],
  status: [{ required: true, message: '请选择状态' }],
};

const modalVisible = ref(false);
const modalTitle = ref('默认标题');

const tableData = ref([]);
const columns = [
  { title: '编号', dataIndex: 'jobId' },
  { title: '任务名称', dataIndex: 'jobName' },
  { title: '任务分组', dataIndex: 'jobGroup' },
  { title: '任务表达式', dataIndex: 'cronExpression' },
  { title: '调用目标', dataIndex: 'invokeTarget' },
  { title: '状态', dataIndex: 'status', slotName: 'status' },
  { title: '操作', slotName: 'action' },
];

// 查询任务
const handleQuery = () => {
  getSysJobListInfo(queryForm);
}

// 重置查询
const handleResetQuery = () => {
  proxy.$refs.queryFormRef.resetFields();

  getSysJobListInfo();
}

// 新增任务
const handleAdd = () => {
  modalVisible.value = true;
  modalTitle.value = '新增任务';
};

// 修改任务
const handleUpdate = (record) => {
  modalVisible.value = true;
  modalTitle.value = '修改任务';

  Object.assign(modalForm, record);
};

// 启动定时任务
const handleStart = async (jobId) => {
  await startJob(jobId);
  proxy.$notification.success('启动任务成功！')

  getSysJobListInfo();
}

// 关闭定时任务
const handleStop = async (jobId) => {
  await removeJob(jobId);
  proxy.$notification.success('已停止任务！')

  getSysJobListInfo();
}

// Modal 触发oK事件前
const onBeforeOk = (done) => {
  proxy.$refs.modalFormRef.validate((err) => {
    if (!err) {
      return done();
    } else {
      proxy.$message.error('表单校验失败');
      return done(false);
    }
  });
};

// Modal 触发ok事件
const handleOk = async () => {
  if (modalForm.jobId) {
    const { code, msg } = await updateSysJob(modalForm);
    if (code == 200 ) {
      proxy.$notification.success('修改成功');
    } else {
      proxy.$notification.error(msg);
    }
  } else {
    const { code, msg } = await addSysJob(modalForm);
    if (code == 200 ) {
      proxy.$notification.success('新增成功');
    } else {
      proxy.$notification.error(msg);
    }
  }
  getSysJobListInfo();
};

// 获取系统任务信息
const getSysJobListInfo = async (params = {}) => {
  const { data, code, msg } = await listSysJob(params);
  if ( code == 200 ) {
    tableData.value = data.list;
    Object.assign(pager, { count: data.count, pageIndex: data.pageIndex, pageSize: data.pageSize });
  } else {
    proxy.$notification.error(msg);
  }
};


onMounted(() => {
  getSysJobListInfo();
});
</script>

<style lang="scss" scoped>
.table-action {
  margin-bottom: 12px;
}
</style>
