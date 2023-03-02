<template>
  <div class="app-container">
    <a-card :bordered="false" class="general-card">
      <a-form :model="queryForm" ref="queryFormRef" layout="inline">
        <a-form-item field="roleName" label="角色名称">
          <a-input v-model="queryForm.roleName" placeholder="请输入角色名称" />
        </a-form-item>
        <a-form-item field="roleKey" label="权限字符">
          <a-input v-model="queryForm.roleKey" placeholder="请输入权限字符" />
        </a-form-item>
        <a-form-item field="status" label="状态">
          <a-select v-model="queryForm.status" placeholder="请选择角色状态">
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
          <a-button v-has="'admin:sysRole:add'" type="primary" @click="handleAdd"><icon-plus /> 新增</a-button>
        <a-button v-has="'admin:sysRole:remove'" type="primary" status="danger" @click="() => { deleteVisible = true; }"><icon-delete /> 批量删除</a-button>
          <a-button type="primary" status="warning" disabled><icon-download /> 导出</a-button>
        </a-space>
      </div>

      <a-table
        :columns="columns"
        :data="tableData"
        :bordered="false"
        :pagination="{
          'show-total': true,
          'show-jumper': true,
          'show-page-size': true,
          total: pager.total,
          current: currentPage,
        }"
        row-key="roleId"
        :row-selection="{ type: 'checkbox', showCheckedAll: true }"
      @selection-change="(selection) => {deleteData = selection;}" 
        @select="handleSelect"
        @page-change="handlePageChange"
        @page-size-change="handlePageSizeChange"
      >
        <template #status="{ record }">
          <a-tag v-if="record.status == 2" color="green">正常</a-tag>
          <a-tag v-else color="red">停用</a-tag>
        </template>
        <template #createdAt="{ record }">
          {{ parseTime(record.createdAt) }}
        </template>
        <template #action="{ record }">
          <a-space>
            <a-button v-has="'admin:sysRole:edit'" type="text" @click="handleUpdate(record)"><icon-edit /> 修改</a-button>
            <a-button v-has="'admin:sysRole:update'" type="text" @click="handleDataScope(record)"><icon-check-circle />  数据权限 </a-button>
          <a-button v-has="'admin:sysRole:remove'" type="text" @click="() => { deleteVisible = true; deleteData = [record.roleId];  }"><icon-check-circle />  删除 </a-button>
          </a-space>
        </template>
      </a-table>
    </a-card>
    <!-- Role Modal -->
    <a-modal
      v-model:visible="modalVisible"
      :title="title"
      title-align="start"
      @before-ok="handleBeforeOk"
      @close="handleCancel"
    >
      <a-form :model="modalForm" :rules="rules" ref="modalFormRef">
        <a-form-item field="roleName" label="角色名称">
          <a-input v-model="modalForm.roleName" placeholder="请输入角色名称" />
        </a-form-item>
        <a-form-item field="roleKey" label="权限字符">
          <a-input v-model="modalForm.roleKey" placeholder="请输入权限字符" />
        </a-form-item>
        <a-form-item field="roleSort" label="角色排序">
          <a-input-number
            v-model="modalForm.roleSort"
            mode="button"
            :default-value="0"
            :style="{ width: '150px' }"
          />
        </a-form-item>
        <a-form-item field="status" label="状态">
          <a-radio-group v-model="modalForm.status">
            <a-radio value="2">正常</a-radio>
            <a-radio value="1">停用</a-radio>
          </a-radio-group>
        </a-form-item>
        <a-form-item label="权限设置">
          <a-tree
            v-model:checked-keys="checkedKeys"
            :checkable="true"
            :check-strictly="false"
            :data="treeData"
            :default-expand-all="false"
            :field-names="{ key: 'id', title: 'label' }"
          />
        </a-form-item>
        <a-form-item field="remark" label="备注">
          <a-textarea v-model="modalForm.remark" placeholder="请输入备注内容" />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- DataScope Modal -->
    <a-modal
      v-model:visible="scopedModalVisible"
      :title="title"
      title-align="start"
      @before-ok="handleScopeBeforeOk"
      @close="handleCancel"
    >
      <a-form :model="scopeForm">
        <a-form-item field="roleName" label="角色名称">
          <a-input v-model="scopeForm.roleName" disabled />
        </a-form-item>
        <a-form-item field="roleKey" label="权限字符">
          <a-input v-model="scopeForm.roleKey" disabled />
        </a-form-item>
        <a-form-item field="dataScope" label="权限范围">
          <a-select v-model="scopeForm.dataScope" placeholder="请选择权限范围">
            <a-option
              v-for="item in dataScopeOptions"
              :key="item.value"
              :value="item.value"
              :label="item.label"
            />
          </a-select>
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- Akiraka 20230223 删除与批量删除 开始 -->
    <DeleteModal 
      :data="deleteData" 
      :visible="deleteVisible" 
      :apiDelete="removeRole" 
      @deleteVisibleChange="() => deleteVisible = false"
    />
    <!-- Akiraka 20230223 删除与批量删除 结束 -->
  </div>
</template>

<script setup>
import { onMounted, reactive, ref, getCurrentInstance, nextTick, watch } from 'vue';
import { getRole, addRole, updateRole, removeRole, updateRoleScoped, getRoleMenuTree } from '@/api/admin/role';

// Akiraka 20230210 删除数据
const deleteData = ref([])
// Akiraka 20230210 删除对话框
const deleteVisible = ref(false)
// Akiraka 20230210 监听删除事件
watch(() => deleteVisible.value ,(value) => {
  if ( value == false ) {
    getRoleInfo({ ...pager, ...queryForm });
  }
})

const { proxy } = getCurrentInstance();

const currentPage = ref(1);
// Pager
const pager = {
  total: 0,
  pageIndex: 1,
  pageSize: 10,
};

// Batch Delete List
const batchDeleteList = ref([]);

// Form
const queryForm = reactive({});
const modalForm = reactive({
  sort: 0,
  status: '2',
});
const scopeForm = reactive({});

// rules
const rules = {
  roleName: [{ required: true, message: '请输入角色名称' }],
  roleKey: [{ required: true, message: '请输入权限字符' }],
};

// ScopeOption
const dataScopeOptions = [
  {
    value: '1',
    label: '全部数据权限',
  },
  {
    value: '2',
    label: '自定数据权限',
  },
  {
    value: '3',
    label: '本部门数据权限',
  },
  {
    value: '4',
    label: '本部门及以下数据权限',
  },
  {
    value: '5',
    label: '仅本人数据权限',
  },
];

// Table Columns
const columns = [
  { title: '编号', dataIndex: 'roleId' },
  { title: '角色名称', dataIndex: 'roleName' },
  { title: '权限字符', dataIndex: 'roleKey' },
  { title: '排序', dataIndex: 'roleSort' },
  { title: '状态', dataIndex: 'status', slotName: 'status' },
  { title: '创建时间', dataIndex: 'createdAt', slotName: 'createdAt' },
  { title: '操作', slotName: 'action', width: 250 },
];

// Table Data;
const tableData = ref([]);

// Tree Data;
const checkedKeys = ref([]);
const treeData = ref([]);

// Modal
const modalVisible = ref(false);
const scopedModalVisible = ref(false);
const title = ref('默认标题');

// Table Select
const handleSelect = (rowKey) => {
  batchDeleteList.value = rowKey;
};

// 查询
const handleQuery = async () => {
  const res = await getRole({ ...pager, ...queryForm });
  const { count, list, pageIndex, pageSize } = res.data;

  tableData.value = list;
  Object.assign(pager, { count, pageIndex, pageSize });
};

// 重置查询
const handleResetQuery = () => {
  proxy.$refs.queryFormRef.resetFields();
  getRoleInfo(queryForm);
};

// 创建
const handleAdd = () => {
  modalVisible.value = true;
  title.value = '创建角色';
};

// 修改角色
const handleUpdate = async (record) => {
  modalVisible.value = true;
  title.value = '修改角色';

  await nextTick();
  Object.assign(modalForm, record);

  // 显示勾选的菜单，checkedKeys 传入id数组即可
  const menuIdsChecked = [];
  record.sysMenu.forEach((item) => {
    menuIdsChecked.push(item.menuId);
  });
  checkedKeys.value = menuIdsChecked;
};

// 分配数据权限
const handleDataScope = async (record) => {
  scopedModalVisible.value = true;
  title.value = '分配数据权限';

  const { roleKey, roleName, dataScope, roleId } = record;
  await nextTick();
  Object.assign(scopeForm, { roleKey, roleName, dataScope, roleId });
};

/**
 * 分页改变
 * @param {Number} [page]
 */
const handlePageChange = (page) => {
  pager.pageIndex = page;

  // 修改当前页码
  currentPage.value = page;
  getRoleInfo({ ...pager, ...queryForm });
};

// 每页数据量
const handlePageSizeChange = (pageSize) => {
  pager.pageSize = pageSize;
  getRoleInfo({ ...pager, ...queryForm });
};

// 角色管理表单提交
// 异步关闭表单需要使用 done() 回调函数
const handleBeforeOk = (done) => {
  proxy.$refs.modalFormRef.validate(async (valid) => {
    // 如果 valid 为空则数据校验通过
    if (!valid) {
      modalForm.menuIds = checkedKeys.value;
      let res;
      if (modalForm.roleId) {
        res = await updateRole(modalForm, modalForm.roleId);
      } else {
        res = await addRole(modalForm);
      }
      proxy.$message.success(res.msg);
      getRoleInfo();
      done();
    } else {
      proxy.$message.error('数据校验失败');
      done(false);
    }
  });
};

// 数据权限表单提交
const handleScopeBeforeOk = async (done) => {
  const res = await updateRoleScoped(scopeForm);
  proxy.$message.success(res.msg);
  done();

  getRoleInfo();
};

 // 重置数据表单
 const handleCancel = () => {
  modalVisible.value = false;
  modalForm.roleId = null;
  scopeForm.roleId = null;
  checkedKeys.value = [];
  proxy.$refs.modalFormRef.resetFields();
};

// 获取角色信息
const getRoleInfo = async (params = {}) => {
  const res = await getRole(params);
  const { count, list, pageIndex, pageSize } = res.data;
  tableData.value = list;

  Object.assign(pager, { total: count, pageIndex, pageSize });
};

// 获取角色菜单信息
const getRoleMenuTreeInfo = async () => {
  const res = await getRoleMenuTree({}, 0);
  treeData.value = res.data.menus;
  checkedKeys.value = res.data.checkedKeys;
};

onMounted(() => {
  getRoleInfo();
  getRoleMenuTreeInfo();
});
</script>

<style setup>
.action {
  margin-bottom: 12px;
}
</style>
