<template>
  <div class="app-container">
    <a-card :bordered="false" class="general-card">
      <a-form :model="queryForm" ref="queryFormRef" layout="inline">
        <a-form-item field="deptName" label="部门名称">
          <a-input v-model="queryForm.deptName" placeholder="请输入部门名称" />
        </a-form-item>
        <a-form-item field="status" label="部门状态">
          <a-select v-model="queryForm.status" placeholder="请选择部门状态">
            <a-option :value="2">正常</a-option>
            <a-option :value="1">停用</a-option>
          </a-select>
        </a-form-item>
        <a-form-item>
          <a-space>
            <a-button v-has="'admin:sysDept:query'" type="primary" @click="handleQuery"><icon-search /> 搜索</a-button>
            <a-button @click="handleResetQuery"><icon-loop /> 重置</a-button>
          </a-space>
        </a-form-item>
      </a-form>

      <a-divider />

      <div class="action">
        <a-button v-has="'admin:sysDept:add'" type="primary" @click="handleAdd()"><icon-plus /> 新增</a-button>
      </div>

      <!-- 异步数据需要defualt-expanded-keys 传入所有行Key才能默认展开 -->
      <a-table
        :columns="columns"
        :data="tableData"
        :bordered="false"
        :pagination="false"
        :default-expanded-keys="[1]"
        row-key="deptId"
      >
        <template #status="{ record }">
          <a-tag color="green" v-if="record.status === 2">正常</a-tag>
          <a-tag color="red" v-else> 停用 </a-tag>
        </template>
        <template #createdAt="{ record }">
          {{ parseTime(record.createdAt) }}
        </template>
        <template #action="{ record }">
          <a-button v-has="'admin:sysDept:edit'" type="text" @click="handleUpdate(record)"><icon-edit /> 修改</a-button>
          <a-button v-has="'admin:sysDept:add'" type="text" @click="handleAdd(record)"><icon-plus /> 新增</a-button>
        <a-button v-has="'admin:sysDept:remove'" type="text" @click="() => { deleteVisible = true; deleteData = [record.deptId];  }"><icon-delete /> 删除</a-button>
        </template>
      </a-table>
    </a-card>
    <!-- Modal -->
    <a-modal
      v-model:visible="modalVisible"
      :title="modalTitle"
      title-align="start"
      @before-ok="handleBeforeOk"
      @close="() => $refs.modalFormRef.resetFields()"
    >
      <a-form :model="modalForm" :rules="rules" ref="modalFormRef">
        <a-form-item field="parentId" label="上级部门">
          <a-tree-select
            v-model="modalForm.parentId"
            :data="tableData"
            :field-names="{ key: 'deptId', title: 'deptName' }"
            placeholder="请选择上级部门"
            allow-clear
          />
        </a-form-item>
        <a-form-item field="deptName" label="部门名称">
          <a-input v-model="modalForm.deptName" placeholder="请输入部门名称" />
        </a-form-item>
        <a-form-item field="leader" label="负责人">
          <a-input v-model="modalForm.leader" placeholder="请输入负责人" />
        </a-form-item>
        <a-form-item field="phone" label="联系电话">
          <a-input v-model="modalForm.phone" placeholder="请输入联系电话" />
        </a-form-item>
        <a-form-item field="email" label="邮箱">
          <a-input v-model="modalForm.email" placeholder="请输入邮箱" />
        </a-form-item>
        <a-form-item field="status" label="部门状态">
          <a-radio-group v-model="modalForm.status">
            <a-radio :value="2">正常</a-radio>
            <a-radio :value="1">停用</a-radio>
          </a-radio-group>
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- Akiraka 20230223 删除与批量删除 开始 -->
    <DeleteModal 
      :data="deleteData" 
      :visible="deleteVisible" 
      :apiDelete="removeDept" 
      @deleteVisibleChange="() => deleteVisible = false"
    />
    <!-- Akiraka 20230223 删除与批量删除 结束 -->
  </div>
</template>

<script setup>
import { reactive, ref, onMounted, getCurrentInstance, nextTick, watch } from 'vue';
import { getDept, addDept, removeDept, updateDept } from '@/api/admin/sys-dept';

// Akiraka 20230210 删除数据
const deleteData = ref([])
// Akiraka 20230210 删除对话框
const deleteVisible = ref(false)
// Akiraka 20230210 监听删除事件
watch(() => deleteVisible.value ,(value) => {
  if ( value == false ) {
    getDeptInfo(queryForm);
  }
})

const { proxy } = getCurrentInstance();

// Modal
const modalVisible = ref(false);
const modalTitle = ref('默认标题');

// Form
const queryForm = reactive({});
const modalForm = reactive({
  status: 2,
});

// rules
const rules = {
  parentId: [{ required: true, message: '请选择上级部门' }],
  deptName: [{ required: true, message: '请输入部门名称' }],
  leader: [{ required: true, message: '请输入负责人' }],
};

// Columns
const columns = [
  {
    title: '部门名称',
    dataIndex: 'deptName',
  },
  {
    title: '排序',
    dataIndex: 'sort',
  },
  {
    title: '状态',
    dataIndex: 'status',
    slotName: 'status',
  },
  {
    title: '创建时间',
    dataIndex: 'createdAt',
    slotName: 'createdAt',
  },
  {
    title: '操作',
    slotName: 'action',
  },
];

// Table Data
const tableData = ref([]);

// 查询
const handleQuery = async () => {
  const res = await getDept(queryForm);
  tableData.value = deepDelChildren(res.data);
};

// 重置查询
const handleResetQuery = () => {
  proxy.$refs.queryFormRef.resetFields();

  getDeptInfo(queryForm);
}

// 新增
const handleAdd = ({ deptId, status = 2 } = {}) => {
  modalVisible.value = true;
  modalTitle.value = '新增部门';

  if (deptId) Object.assign(modalForm, {parentId: deptId, status});
};

// 修改
const handleUpdate = async (record) => {
  modalVisible.value = true;
  modalTitle.value = '修改部门信息';

  await nextTick();
  const { parentId, deptName, leader, phone, email, status, deptId } = record;
  Object.assign(modalForm, {
    parentId,
    deptName,
    leader,
    phone,
    email,
    status,
    deptId,
  });
};

// 递归删除空Children
function deepDelChildren(data) {
  const depts = data;
  let len = depts?.length;
  // let len = depts && depts.length;

  for (let i = 0; i < len; i++) {
    if (depts[i].children.length > 0) {
      deepDelChildren(depts[i].children);
    } else {
      delete depts[i].children;
    }
  }

  return depts;
}

// Modal 表单提交前检查
const handleBeforeOk = (done) => {
  proxy.$refs.modalFormRef.validate(async (err) => {
    if (!err) {
      let res;
      if (Reflect.has(modalForm, 'deptId')) {
        res = await updateDept(modalForm, modalForm.deptId);
      } else {
        res = await addDept(modalForm);
      }
      proxy.$message.success(res.msg);
      done();
      getDeptInfo();
    } else {
      proxy.$message.error('数据校验失败');
      done(false);
    }
  });
};

// 获取部门信息
const getDeptInfo = async (params = {}) => {
  const res = await getDept(params);
  tableData.value = deepDelChildren(res.data);
};

onMounted(() => {
  getDeptInfo();
});
</script>

<style lang="scss">
.action {
  margin-bottom: 8px;
}
</style>
