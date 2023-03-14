<template>
  <div class="app-container">
    <a-card :bordered="false" class="general-card">
      <!-- Query -->
      <a-form ref="queryFormRef" :model="queryForm" layout="inline">
        <a-form-item field="deptName" label="部门名称">
          <a-input v-model="queryForm.deptName" placeholder="请输入部门名称" />
        </a-form-item>
        <a-form-item field="username" label="用户名称">
          <a-input v-model="queryForm.username" placeholder="请输入用户名称" />
        </a-form-item>
        <a-form-item field="phone" label="手机号码">
          <a-input v-model="queryForm.phone" placeholder="请输入用户手机号" />
        </a-form-item>
        <a-form-item field="status" label="用户状态">
          <a-select
            v-model="queryForm.status"
            placeholder="请选择用户状态"
            :style="{ width: '205px' }"
          >
            <a-option value="2">正常</a-option>
            <a-option value="1">停用</a-option>
          </a-select>
        </a-form-item>

        <a-divider direction="vertical" :style="{ height: '30px' }" />
        <a-form-item class="form-action">
          <a-space size="medium">
            <a-button v-has="'admin:sysUser:query'" type="primary" @click="handleQuery"><icon-search /> 搜索</a-button>
            <a-button @click="handleResetQuery"><icon-loop /> 重置</a-button>
          </a-space>
        </a-form-item>
      </a-form>

      <!-- divider -->
      <a-divider />

      <!-- Table -->
      <a-row>
        <a-col :span="4">
          <!-- tree组件只在组件第一次渲染时展开，此处等待数据加载完成再渲染组件 -->
          <tree-dept v-if="treeDeptData" :data="treeDeptData" @node-click="getSysUserInfo" />
        </a-col>
        <a-col :span="20">
          <!-- Action -->
          <a-space class="action">
            <a-button v-has="'admin:sysUser:add'" type="primary" @click="handleAdd" data-test="newUser"><icon-plus /> 新增</a-button>
          <a-button v-has="'admin:sysUser:remove'" type="primary" status="danger" @click="() => { deleteVisible = true; }"><icon-delete /> 批量删除</a-button>
          </a-space>

          <!-- Table -->
          <a-table
            :columns="columns"
            :data="tableData"
            :bordered="false"
            :row-selection="{ type: 'checkbox', showCheckedAll: true }"
            :pagination="{ 'show-total': true, 'show-jumper': true, 'show-page-size': true, total: pager.total, current: currentPage }"
          row-key="userId" 
          @selection-change="(selection) => {deleteData = selection;}"
            @page-change="handlePageChange"
            @page-size-change="handlePageSizeChange"
          >
            <template #dept="{ record }">
              {{ record.deptName }}
            </template>
            <template #status="{ record }">
              <a-switch
                v-model="record.status"
                checked-value="2"
                unchecked-value="1"
                @change="handleSwitchChange(record)"
              />
            </template>
            <template #createdAt="{ record }">
              {{ parseTime(record.createdAt) }}
            </template>
            <template #action="{ record }">
              <a-button v-has="'admin:sysUser:edit'" type="text" @click="handleUpdate(record)"><icon-edit /> 修改</a-button>
            <a-button v-has="'admin:sysUser:edit'" type="text" @click="() => { deleteVisible = true; deleteData = [record.userId];  }"><icon-delete /> 删除</a-button>
              <a-button v-has="'admin:sysUser:resetPassword'" type="text" @click="handleReset(record.userId)"><icon-refresh /> 重置</a-button>
            </template>
          </a-table>
        </a-col>
      </a-row>
    </a-card>
    <!-- Modal -->
    <a-modal
      v-model:visible="modalVisible"
      title-align="start"
      :width="600"
      @cancel="handleModalCancel('modalFormRef')"
      @before-ok="handleBeforeOk"
    >
      <template #title>
        {{ modalTitle }}
      </template>
      <a-form
        ref="modalFormRef"
        :model="modalForm"
        :rules="rules"
        auto-label-width
      >
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item field="nickName" label="用户昵称">
              <a-input
                v-model="modalForm.nickName"
                placeholder="请输入用户昵称"
              />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item field="deptId" label="所属部门">
              <a-tree-select
                v-model="modalForm.deptId"
                :data="treeDeptData"
                :field-names="{ key: 'deptId', title: 'deptName' }"
                placeholder="请选择所属部门"
              />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item field="phone" label="手机号码">
              <a-input v-model="modalForm.phone" placeholder="请输入手机号码" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item field="email" label="邮箱">
              <a-input v-model="modalForm.email" placeholder="请输入邮箱" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item field="username" label="用户名称">
              <a-input
                v-model="modalForm.username"
                placeholder="请输入用户名称"
              />
            </a-form-item>
          </a-col>
          <a-col v-if="!modalForm.userId" :span="12">
            <a-form-item field="password" label="用户密码">
              <a-input-password
                v-model="modalForm.password"
                placeholder="请输入用户密码"
              />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item field="sex" label="用户性别">
              <a-select v-model="modalForm.sex" placeholder="请选择用户性别">
                <a-option value="0"> 男 </a-option>
                <a-option value="1"> 女 </a-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item field="status" label="状态">
              <a-radio-group v-model="modalForm.status">
                <a-radio value="2"> 正常 </a-radio>
                <a-radio value="1"> 停用 </a-radio>
              </a-radio-group>
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item field="postId" label="岗位">
              <a-select v-model="modalForm.postId" placeholder="请选择岗位">
                <a-option
                  v-for="item in postList"
                  :key="item.postId"
                  :value="item.postId"
                  :label="item.postName"
                />
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item field="roleId" label="角色">
              <a-select v-model="modalForm.roleId" placeholder="请选择角色">
                <a-option
                  v-for="item in roleList"
                  :key="item.roleId"
                  :value="item.roleId"
                  :label="item.roleName"
                />
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>
        <a-form-item field="remark" label="备注">
          <a-textarea placeholder="请输入备注" allow-clear />
        </a-form-item>
      </a-form>
    </a-modal>

    <a-modal
      v-model:visible="resetPwdVisible"
      title="重置密码"
      @before-ok="handleResetPwd"
      @cancel="$refs.resetPwdFormRef.resetFields()"
    >
      <a-form
        ref="resetPwdFormRef"
        :model="resetPwdForm"
        :rules="resetPwdRules"
        auto-label-width
      >
        <a-form-item field="password" label="新密码">
          <a-input-password
            v-model="resetPwdForm.password"
            placeholder="请输入新密码"
          />
        </a-form-item>
        <a-form-item field="repeatPwd" label="确认密码">
          <a-input-password
            v-model="resetPwdForm.repeatPwd"
            placeholder="请输入确认密码"
          />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- Akiraka 20230223 删除与批量删除 开始 -->
    <DeleteModal 
      :data="deleteData" 
      :visible="deleteVisible" 
      :apiDelete="removeUser" 
      @deleteVisibleChange="() => deleteVisible = false"
    />
    <!-- Akiraka 20230223 删除与批量删除 结束 -->
  </div>
</template>

<script setup>
import { reactive, ref, getCurrentInstance, onMounted, watch } from 'vue';
import { IconSearch, IconLoop } from '@arco-design/web-vue/es/icon';
import TreeDept from './components/TreeDept.vue';
import { getUser, addUser, updateUser, removeUser, updateUserStatus, resetUserPwd } from '@/api/admin/sys-user';
import { getRole } from '@/api/admin/role';
import { getPost } from '@/api/admin/post';
import { getDept } from '@/api/admin/sys-dept';

// Akiraka 20230210 删除数据
const deleteData = ref([])
// Akiraka 20230210 删除对话框
const deleteVisible = ref(false)
// Akiraka 20230210 监听删除事件
watch(() => deleteVisible.value ,(value) => {
  if ( value == false ) {
    getSysUserInfo({ ...pager, ...queryForm });
  }
})

const { proxy } = getCurrentInstance();

// Query
const { queryForm, handleQuery, handleResetQuery } = useQueryData();
// ApiInfo
const { currentPage, getSysPostInfo, getSysRoleInfo, getSysDeptTreeInfo, getSysUserInfo } =
  useApiInfo();

// Pager
const pager = reactive({
  count: 0,
  pageIndex: 1,
  pageSize: 10
});

// Reset Pwd
const {
  resetPwdForm,
  resetPwdVisible,
  resetPwdRules,
  handleReset,
  handleResetPwd,
} = useResetPwd();

// Table Operate
const {
  columns,
  tableData,
  treeDeptData,
  roleList,
  postList,
  handlePageChange,
  handlePageSizeChange,
  handleSwitchChange,
} = useTableList();

// ModalForm Operate
const {
  rules,
  modalForm,
  modalVisible,
  modalTitle,
  handleAdd,
  handleUpdate,
  handleBeforeOk,
  handleModalCancel,
} = useModalOperate();


function useQueryData() {
  const queryForm = reactive({});

  // 查询
  const handleQuery = () => {
    getSysUserInfo(queryForm);
  };

  // 重置查询
  const handleResetQuery = () => {
    proxy.$refs.queryFormRef.resetFields();

    getSysUserInfo(queryForm);
  };

  return { queryForm, handleQuery, handleResetQuery };
}

function useResetPwd() {
  const resetPwdVisible = ref(false);
  const resetPwdForm = reactive({});

  // Rules
  const resetPwdRules = {
    password: [{ required: true, message: '请输入密码' }],
    repeatPwd: [
      {
        required: true,
        message: '请重复输入密码',
      },
      {
        validator: (value, cb) => {
          if (value !== resetPwdForm.password) {
            cb('两次输入的密码不一致');
          }
        },
      },
    ],
  };

  // 用户重置密码API参数
  const resetParams = {};

  // 重置
  const handleReset = (userId) => {
    resetPwdVisible.value = true;
    resetParams.userId = userId;
  };

  // 重置用户密码
  const handleResetPwd = (done) => {
    proxy.$refs.resetPwdFormRef.validate(async (err) => {
      if (!err) {
        resetParams.password = resetPwdForm.password;
        const { msg } = await resetUserPwd(resetParams);
        proxy.$message.success(msg);
        done();
        getSysUserInfo();
      } else {
        done(false);
      }
    });
  };

  return {
    resetPwdForm,
    resetPwdVisible,
    resetPwdRules,
    handleReset,
    handleResetPwd,
  };
}

function useApiInfo() {
  const currentPage = ref(1);
  /**
   * 获取用户信息
   * @param {*} [params]
   */
  const getSysUserInfo = async (params = {}) => {
    const { data, code, msg } = await getUser(params);
    if ( code == 200 ) {
      tableData.value = data.list;
      Object.assign(pager, { count: data.count, pageIndex: data.pageIndex, pageSize: data.pageSize });
    } else {
      proxy.$notification.error(msg);
    }
  };

  // 获取角色信息
  const getSysRoleInfo = async () => {
    const res = await getRole();
    roleList.value = res.data.list;
  };

  // 获取岗位信息
  const getSysPostInfo = async () => {
    const res = await getPost();
    postList.value = res.data.list;
  };

  // 获取部门树信息
  const getSysDeptTreeInfo = async () => {
    const res = await getDept();
    treeDeptData.value = res.data;
  };

  return {
    currentPage,
    getSysPostInfo,
    getSysRoleInfo,
    getSysDeptTreeInfo,
    getSysUserInfo,
  };
}

function useTableList() {
  // 部门数据
  const treeDeptData = ref();
  const roleList = ref([]);
  const postList = ref([]);

  // Table columns
  const columns = [
    {
      title: '编号',
      dataIndex: 'userId',
    },
    {
      title: '登录名',
      dataIndex: 'username',
    },
    {
      title: '昵称',
      dataIndex: 'nickName',
    },
    {
      title: '部门',
      dataIndex: 'deptName',
      slotName: 'dept',
    },
    {
      title: '手机号',
      dataIndex: 'phone',
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

  /**
   * 分页改变
   * @param {Number} [page]
   */
  const handlePageChange = (page) => {
    pager.pageIndex = page;

    // 修改当前页码
    currentPage.value = page;
    getSysUserInfo({ ...pager, ...queryForm });
  };

  // 每页数据量
  const handlePageSizeChange = (pageSize) => {
    pager.pageSize = pageSize;
    getSysUserInfo({ ...pager, ...queryForm });
  };

  // 用户状态快速切换
  const handleSwitchChange = (record) => {
    proxy.$modal.warning({
      title: '注意',
      content: `是否${record.status == 1 ? '停用' : '启用'} ${
        record.username
      } 用户？`,
      hideCancel: false,
      onOk: async () => {
        const params = { userId: record.userId, status: record.status };
        const res = await updateUserStatus(params);
        proxy.$message.success(res.msg);
      },
      onCancel: () => {
        record.status = record.status == '2' ? '1' : '2';
      },
    });
  };

  return {
    treeDeptData,
    roleList,
    postList,
    columns,
    tableData,
    handlePageChange,
    handlePageSizeChange,
    handleSwitchChange,
  };
}

function useModalOperate() {
  const modalVisible = ref(false);
  const modalTitle = ref('默认标题');

  // Form
  const modalForm = reactive({ status: '2' });

  // AddRules
  const rules = {
    nickName: [{ required: true, message: '请输入用户昵称' }],
    deptId: [{ required: true, message: '请选择所属部门' }],
    phone: [{ required: true, message: '请输入手机号' }],
    email: [
      { required: true, message: '请输入邮箱' },
      { type: 'email', message: '请输入正确的邮箱格式' },
    ],
    username: [{ required: true, message: '请输入用户名称' }],
    password: [{ required: true, message: '请输入用户密码' }],
  };

  // Modal 取消后重置表单
  const handleModalCancel = (formEl) => {
    modalVisible.value = false;
    resetForm(formEl);
    modalForm.userId = null;
  };

  // 新增用户
  const handleAdd = () => {
    modalVisible.value = true;
    modalTitle.value = '新增用户';
  };

  /**
   * 修改用户
   * @param {Object} val
   */
  const handleUpdate = (val) => {
    modalVisible.value = true;
    Object.assign(modalForm, val);
  };

  // 重置Form
  const resetForm = (formEl) => {
    if (!formEl) return;
    proxy.$refs[formEl].resetFields();
  };

  // 表单提交
  const handleBeforeOk = (done) => {
    proxy.$refs.modalFormRef.validate(async (valid) => {
      if (!valid) {
        if (!modalForm.userId) {
          const { code, msg } = await addUser(modalForm);
          if (code == 200 ) {
            proxy.$notification.success('新增成功');
          } else {
            proxy.$notification.error(msg);
          }
        } else {
          const { code, msg } = await updateUser(modalForm, modalForm.userId);
          if (code == 200 ) {
            proxy.$notification.success('更新成功');
          } else {
            proxy.$notification.error(msg);
          }
        }
        done();
        proxy.$refs.modalFormRef.resetFields();
        getSysUserInfo();
      } else {
        proxy.$message.error('表单校验失败');
        done(false);
      }
    });
  };

  return {
    rules,
    modalForm,
    modalVisible,
    modalTitle,
    handleAdd,
    handleUpdate,
    handleBeforeOk,
    handleModalCancel,
  };
}

onMounted(() => {
  getSysUserInfo();
  getSysDeptTreeInfo();
  getSysRoleInfo();
  getSysPostInfo();
});
</script>

<style lang="scss">
@media screen and (max-width: 1720px) {
  .form-action {
    margin-top: 12px;
  }
}

.action {
  margin-bottom: 8px;
}
</style>
