<template>
  <BasicLayout>
    <template #wrapper>
      <el-card class="box-card">
        <el-form ref="queryForm" :model="queryParams" :inline="true">
          <el-form-item label="名称" prop="roleName">
            <el-input
              v-model="queryParams.roleName"
              placeholder="请输入角色名称"
              clearable
              size="small"
              style="width: 160px"
              @keyup.enter.native="handleQuery"
            />
          </el-form-item>
          <el-form-item label="权限字符" prop="roleKey">
            <el-input
              v-model="queryParams.roleKey"
              placeholder="请输入权限字符"
              clearable
              size="small"
              style="width: 160px"
              @keyup.enter.native="handleQuery"
            />
          </el-form-item>
          <el-form-item label="状态" prop="status">
            <el-select
              v-model="queryParams.status"
              placeholder="角色状态"
              clearable
              size="small"
              style="width: 160px"
            >
              <el-option
                v-for="dict in statusOptions"
                :key="dict.value"
                :label="dict.label"
                :value="dict.value"
              />
            </el-select>
          </el-form-item>
          <!-- <el-form-item label="创建时间">
            <el-date-picker
              v-model="dateRange"
              size="small"
              style="width: 240px"
              value-format="yyyy-MM-dd"
              type="daterange"
              range-separator="-"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
            />
          </el-form-item> -->
          <el-form-item>
            <el-button type="primary" icon="el-icon-search" size="mini" @click="handleQuery">搜索</el-button>
            <el-button icon="el-icon-refresh" size="mini" @click="resetQuery">重置</el-button>
          </el-form-item>
        </el-form>

        <el-row :gutter="10" class="mb8">
          <el-col :span="1.5">
            <el-button
              v-permisaction="['admin:sysRole:add']"
              type="primary"
              icon="el-icon-plus"
              size="mini"
              @click="handleAdd"
            >新增</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button
              v-permisaction="['admin:sysRole:update']"
              type="success"
              icon="el-icon-edit"
              size="mini"
              :disabled="single"
              @click="handleUpdate"
            >修改</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button
              v-permisaction="['admin:sysRole:remove']"
              type="danger"
              icon="el-icon-delete"
              size="mini"
              :disabled="multiple"
              @click="handleDelete"
            >删除</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button
              v-permisaction="['admin:sysRole:export']"
              type="warning"
              icon="el-icon-download"
              size="mini"
              @click="handleExport"
            >导出</el-button>
          </el-col>
        </el-row>

        <el-table
          v-loading="loading"
          :data="roleList"
          border
          @selection-change="handleSelectionChange"
          @sort-change="handleSortChang"
        >
          <el-table-column type="selection" width="55" align="center" />
          <el-table-column label="编码" sortable="custom" prop="roleId" width="80" />
          <el-table-column label="名称" sortable="custom" prop="roleName" :show-overflow-tooltip="true" />
          <el-table-column label="权限字符" prop="roleKey" :show-overflow-tooltip="true" width="150" />
          <el-table-column label="排序" sortable="custom" prop="roleSort" width="80" />
          <el-table-column label="状态" sortable="custom" width="80">
            <template slot-scope="scope">
              <el-switch
                v-model="scope.row.status"
                active-value="2"
                inactive-value="1"
                @change="handleStatusChange(scope.row)"
              />
            </template>
          </el-table-column>
          <el-table-column label="创建时间" sortable="custom" prop="createdAt" width="160">
            <template slot-scope="scope">
              <span>{{ parseTime(scope.row.createdAt) }}</span>
            </template>
          </el-table-column>
          <el-table-column
            label="操作"
            align="left"
            class-name="small-padding fixed-width"
            width="220"
          >
            <template slot-scope="scope">
              <el-button
                v-permisaction="['admin:sysRole:update']"
                size="mini"
                type="text"
                icon="el-icon-edit"
                @click="handleUpdate(scope.row)"
              >修改</el-button>
              <el-button
                v-permisaction="['admin:sysRole:update']"
                size="mini"
                type="text"
                icon="el-icon-circle-check"
                @click="handleDataScope(scope.row)"
              >数据权限</el-button>
              <el-button
                v-if="scope.row.roleKey!=='admin'"
                v-permisaction="['admin:sysRole:remove']"
                size="mini"
                type="text"
                icon="el-icon-delete"
                @click="handleDelete(scope.row)"
              >删除</el-button>
            </template>
          </el-table-column>
        </el-table>

        <pagination
          v-show="total>0"
          :total="total"
          :page.sync="queryParams.pageIndex"
          :limit.sync="queryParams.pageSize"
          @pagination="getList"
        />

        <!-- 添加或修改角色配置对话框 -->
        <el-dialog v-if="open" :title="title" :visible.sync="open" width="500px">
          <el-form ref="form" :model="form" :rules="rules" label-width="80px">
            <el-form-item label="角色名称" prop="roleName">
              <el-input v-model="form.roleName" placeholder="请输入角色名称" :disabled="isEdit" />
            </el-form-item>
            <el-form-item label="权限字符" prop="roleKey">
              <el-input v-model="form.roleKey" placeholder="请输入权限字符" :disabled="isEdit" />
            </el-form-item>
            <el-form-item label="角色顺序" prop="roleSort">
              <el-input-number v-model="form.roleSort" controls-position="right" :min="0" />
            </el-form-item>
            <el-form-item label="状态">
              <el-radio-group v-model="form.status">
                <el-radio
                  v-for="dict in statusOptions"
                  :key="dict.value"
                  :label="dict.value"
                >{{ dict.label }}</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="菜单权限">
              <el-tree
                ref="menuTree"
                :data="menuOptions"
                show-checkbox
                node-key="id"
                :empty-text="menuOptionsAlert"
                style="height:171px;overflow-y:auto;overflow-x:hidden;"
              />
            </el-form-item>
            <el-form-item label="备注">
              <el-input v-model="form.remark" type="textarea" placeholder="请输入内容" />
            </el-form-item>
          </el-form>
          <div slot="footer" class="dialog-footer">
            <el-button type="primary" @click="submitForm">确 定</el-button>
            <el-button @click="cancel">取 消</el-button>
          </div>
        </el-dialog>

        <!-- 分配角色数据权限对话框 -->
        <el-dialog v-if="openDataScope" :title="title" :visible.sync="openDataScope" width="500px">
          <el-form :model="form" label-width="80px">
            <el-form-item label="角色名称">
              <el-input v-model="form.roleName" :disabled="true" />
            </el-form-item>
            <el-form-item label="权限字符">
              <el-input v-model="form.roleKey" :disabled="true" />
            </el-form-item>
            <el-form-item label="权限范围">
              <el-select v-model="form.dataScope">
                <el-option
                  v-for="item in dataScopeOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
            <el-form-item v-show="form.dataScope == 2" label="数据权限">
              <el-tree
                ref="dept"
                :data="deptOptions"
                show-checkbox
                default-expand-all
                node-key="id"
                empty-text="加载中，请稍后"
                :props="defaultProps"
              />
            </el-form-item>
          </el-form>
          <div slot="footer" class="dialog-footer">
            <el-button type="primary" @click="submitDataScope">确 定</el-button>
            <el-button @click="cancelDataScope">取 消</el-button>
          </div>
        </el-dialog>
      </el-card>
    </template>
  </BasicLayout>
</template>

<script>
import { listRole, getRole, delRole, addRole, updateRole, dataScope, changeRoleStatus } from '@/api/admin/sys-role'
import { roleMenuTreeselect } from '@/api/admin/sys-menu'
import { treeselect as deptTreeselect, roleDeptTreeselect } from '@/api/admin/sys-dept'
import { formatJson } from '@/utils'

export default {
  name: 'Role',
  components: {

  },
  data() {
    return {
      // 遮罩层
      loading: true,
      // 选中数组
      ids: [],
      // 非单个禁用
      single: true,
      // 非多个禁用
      multiple: true,
      // 总条数
      total: 0,
      // 角色表格数据
      roleList: [],
      menuIdsChecked: [],
      // 弹出层标题
      title: '',
      // 是否显示弹出层
      open: false,
      // 是否显示弹出层（数据权限）
      openDataScope: false,
      isEdit: false,
      // 日期范围
      dateRange: [],
      // 状态数据字典
      statusOptions: [],
      // 数据范围选项
      dataScopeOptions: [
        {
          value: '1',
          label: '全部数据权限'
        },
        {
          value: '2',
          label: '自定数据权限'
        },
        {
          value: '3',
          label: '本部门数据权限'
        },
        {
          value: '4',
          label: '本部门及以下数据权限'
        },
        {
          value: '5',
          label: '仅本人数据权限'
        }
      ],
      // 菜单列表
      menuOptions: [],
      menuList: [],
      // 部门列表
      deptOptions: [],
      menuOptionsAlert: '加载中，请稍后',
      // 查询参数
      queryParams: {
        pageIndex: 1,
        pageSize: 10,
        roleName: undefined,
        roleKey: undefined,
        status: undefined
      },
      // 表单参数
      form: {
        sysMenu: []
      },
      defaultProps: {
        children: 'children',
        label: 'label'
      },
      // 表单校验
      rules: {
        roleName: [
          { required: true, message: '角色名称不能为空', trigger: 'blur' }
        ],
        roleKey: [
          { required: true, message: '权限字符不能为空', trigger: 'blur' }
        ],
        roleSort: [
          { required: true, message: '角色顺序不能为空', trigger: 'blur' }
        ]
      }
    }
  },
  created() {
    this.getList()
    this.getMenuTreeselect()
    this.getDicts('sys_normal_disable').then(response => {
      this.statusOptions = response.data
    })
  },
  methods: {
    /** 查询角色列表 */
    getList() {
      this.loading = true
      listRole(this.addDateRange(this.queryParams, this.dateRange)).then(
        response => {
          this.roleList = response.data.list
          this.total = response.data.count
          this.loading = false
        }
      )
    },
    /** 查询菜单树结构 */
    getMenuTreeselect() {
      roleMenuTreeselect(0).then(response => {
        this.menuOptions = response.data.menus
        this.menuList = this.menuOptions
      })
    },
    /** 查询部门树结构 */
    getDeptTreeselect() {
      deptTreeselect().then(response => {
        this.deptOptions = response.data.list
      })
    },
    // 所有菜单节点数据
    getMenuAllCheckedKeys() {
      // 目前被选中的菜单节点
      const checkedKeys = this.$refs.menuTree.getHalfCheckedKeys()
      console.log('目前被选中的菜单节点', checkedKeys)
      // 半选中的菜单节点
      const halfCheckedKeys = this.$refs.menuTree.getCheckedKeys()
      console.log('半选中的菜单节点', halfCheckedKeys)
      // checkedKeys.unshift.apply(checkedKeys, halfCheckedKeys)
      return halfCheckedKeys
    },
    // 所有部门节点数据
    getDeptAllCheckedKeys() {
      // 目前被选中的部门节点
      const checkedKeys = this.$refs.dept.getCheckedKeys()
      // 半选中的部门节点
      // const halfCheckedKeys = this.$refs.dept.getCheckedKeys()
      // checkedKeys.unshift.apply(checkedKeys, halfCheckedKeys)
      return checkedKeys
    },
    /** 根据角色ID查询菜单树结构 */
    getRoleMenuTreeselect(row, checkedKeys) {
      if (row.roleKey === 'admin') {
        this.menuOptionsAlert = '系统超级管理员无需此操作'
        this.menuOptions = []
      } else {
        this.$nextTick(() => {
          this.$refs.menuTree.setCheckedKeys(checkedKeys)
        })
      }
    },
    /** 根据角色ID查询部门树结构 */
    getRoleDeptTreeselect(roleId) {
      roleDeptTreeselect(roleId).then(response => {
        this.deptOptions = response.data.depts
        this.$nextTick(() => {
          this.$refs.dept.setCheckedKeys(response.data.checkedKeys)
        })
      })
    },
    // 角色状态修改
    handleStatusChange(row) {
      const text = row.status === '2' ? '启用' : '停用'
      this.$confirm('确认要"' + text + '""' + row.roleName + '"角色吗?', '警告', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(function() {
        return changeRoleStatus(row.roleId, row.status)
      }).then((res) => {
        console.log('res', res)
        this.msgSuccess(res.msg)
      }).catch(function() {
        row.status = row.status === '2' ? '1' : '2'
      })
    },
    // 取消按钮
    cancel() {
      this.open = false
      this.reset()
    },
    // 取消按钮（数据权限）
    cancelDataScope() {
      this.openDataScope = false
      this.reset()
    },
    // 表单重置
    reset() {
      this.menuOptions = this.menuList
      if (this.$refs.menuTree !== undefined) {
        this.$refs.menuTree.setCheckedKeys([])
      }
      this.form = {
        roleId: undefined,
        roleName: undefined,
        roleKey: undefined,
        roleSort: 0,
        status: '2',
        menuIds: [],
        deptIds: [],
        sysMenu: [],
        remark: undefined
      }
      this.resetForm('form')
    },
    /** 搜索按钮操作 */
    handleQuery() {
      this.queryParams.pageIndex = 1
      this.getList()
    },
    /** 重置按钮操作 */
    resetQuery() {
      this.dateRange = []
      this.resetForm('queryForm')
      this.handleQuery()
    },
    // 多选框选中数据
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.roleId)
      this.single = selection.length !== 1
      this.multiple = !selection.length
    },
    /** 新增按钮操作 */
    handleAdd() {
      this.reset()
      // this.getMenuTreeselect(0)
      this.open = true
      this.title = '添加角色'
      this.isEdit = false
    },
    handleSortChang(column, prop, order) {
      prop = column.prop
      order = column.order
      if (order === 'descending') {
        this.queryParams[prop + 'Order'] = 'desc'
      } else if (order === 'ascending') {
        this.queryParams[prop + 'Order'] = 'asc'
      } else {
        this.queryParams[prop + 'Order'] = undefined
      }
      this.getList()
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.menuIdsChecked = []
      this.reset()
      const roleId = row.roleId || this.ids
      getRole(roleId).then(response => {
        this.form = response.data
        this.menuIdsChecked = response.data.menuIds
        this.title = '修改角色'
        this.isEdit = true
        this.open = true
        this.getRoleMenuTreeselect(row, response.data.menuIds)
      })
    },
    /** 分配数据权限操作 */
    handleDataScope(row) {
      this.reset()
      getRole(row.roleId).then(response => {
        this.form = response.data
        this.openDataScope = true
        this.title = '分配数据权限'
        this.getRoleDeptTreeselect(row.roleId)
      })
    },
    /** 提交按钮 */
    submitForm: function() {
      this.$refs['form'].validate(valid => {
        if (valid) {
          if (this.form.roleId !== undefined) {
            this.form.menuIds = this.getMenuAllCheckedKeys()
            updateRole(this.form, this.form.roleId).then(response => {
              if (response.code === 200) {
                this.msgSuccess(response.msg)
                this.open = false
                this.getList()
              } else {
                this.msgError(response.msg)
              }
            })
          } else {
            this.form.menuIds = this.getMenuAllCheckedKeys()
            addRole(this.form).then(response => {
              if (response.code === 200) {
                this.msgSuccess(response.msg)
                this.open = false
                this.getList()
              } else {
                this.msgError(response.msg)
              }
            })
          }
        }
      })
    },
    /** 提交按钮（数据权限） */
    submitDataScope: function() {
      if (this.form.roleId !== undefined) {
        this.form.deptIds = this.getDeptAllCheckedKeys()
        console.log(this.getDeptAllCheckedKeys())
        dataScope(this.form).then(response => {
          if (response.code === 200) {
            this.msgSuccess(response.msg)
            this.openDataScope = false
            this.getList()
          } else {
            this.msgError(response.msg)
          }
        })
      }
    },
    /** 删除按钮操作 */
    handleDelete(row) {
      const roleIds = (row.roleId && [row.roleId]) || this.ids
      this.$confirm('是否确认删除角色编号为"' + roleIds + '"的数据项?', '警告', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(function() {
        return delRole({ 'ids': roleIds })
      }).then((response) => {
        this.getList()
        this.msgSuccess(response.msg)
      }).catch(function() {})
    },
    /** 导出按钮操作 */
    handleExport() {
      this.$confirm('是否确认导出所有角色数据项?', '警告', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.downloadLoading = true
        import('@/vendor/Export2Excel').then(excel => {
          const tHeader = ['角色编号', '角色名称', '权限字符', '显示顺序', '状态', '创建时间']
          const filterVal = ['roleId', 'roleName', 'roleKey', 'roleSort', 'status', 'createdAt']
          const list = this.roleList
          const data = formatJson(filterVal, list)
          excel.export_json_to_excel({
            header: tHeader,
            data,
            filename: '角色管理',
            autoWidth: true, // Optional
            bookType: 'xlsx' // Optional
          })
          this.downloadLoading = false
        })
      })
    }
  }
}
</script>
