<template>
  <BasicLayout>
    <template #wrapper>
      <el-card class="box-card">

        <!-- 搜索区 -->
        <el-form ref="queryForm" :model="queryParams" :inline="true" class="search-form">
          <el-form-item label="部门名称" prop="deptName">
            <el-input
              v-model="queryParams.deptName"
              placeholder="请输入部门名称"
              clearable
              size="small"
              style="width: 200px"
              @keyup.enter="handleQuery"
            />
          </el-form-item>
          <el-form-item label="状态" prop="status">
            <el-select
              v-model="queryParams.status"
              placeholder="部门状态"
              clearable
              size="small"
              style="width: 140px"
            >
              <el-option
                v-for="dict in statusOptions"
                :key="dict.value"
                :label="dict.label"
                :value="dict.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" size="small" :icon="Search" @click="handleQuery">搜索</el-button>
            <el-button size="small" :icon="Refresh" @click="handleResetQuery">重置</el-button>
          </el-form-item>
        </el-form>

        <!-- 操作栏 -->
        <el-row :gutter="10" class="mb8">
          <el-col :span="1.5">
            <el-button
              v-permisaction="['admin:sysDept:add']"
              type="primary"
              size="small"
              :icon="Plus"
              @click="handleAdd()"
            >新增</el-button>
          </el-col>
        </el-row>

        <!-- 数据表格 -->
        <el-table
          v-loading="loading"
          :data="deptList"
          row-key="deptId"
          default-expand-all
          border
          stripe
          highlight-current-row
          :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
        >
          <el-table-column prop="deptName" label="部门名称" min-width="160" />
          <el-table-column prop="sort" label="排序" width="80" align="center" />
          <el-table-column prop="status" label="状态" width="90" align="center">
            <template #default="scope">
              <el-tag
                :type="scope.row.status === 1 ? 'danger' : 'success'"
                size="small"
                disable-transitions
              >{{ statusFormat(scope.row) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="创建时间" align="center" prop="createdAt" width="180">
            <template #default="scope">
              <span>{{ parseTime(scope.row.createdAt) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" align="center" width="200" class-name="small-padding fixed-width">
            <template #default="scope">
              <el-button
                v-permisaction="['admin:sysDept:edit']"
                size="small"
                type="primary"
                link
                :icon="Edit"
                @click="handleUpdate(scope.row)"
              >修改</el-button>
              <el-divider direction="vertical" />
              <el-button
                v-permisaction="['admin:sysDept:add']"
                size="small"
                type="primary"
                link
                :icon="Plus"
                @click="handleAdd(scope.row)"
              >新增</el-button>
              <template v-if="scope.row.p_id != 0">
                <el-divider direction="vertical" />
                <el-button
                  v-permisaction="['admin:sysDept:remove']"
                  size="small"
                  type="danger"
                  link
                  :icon="Delete"
                  @click="handleDelete(scope.row)"
                >删除</el-button>
              </template>
            </template>
          </el-table-column>
        </el-table>

        <!-- 添加或修改部门对话框 -->
        <el-dialog v-model="open" :title="title" width="600px" :close-on-click-modal="false">
          <el-form ref="form" :model="form" :rules="rules" label-width="80px">
            <el-row>
              <el-col :span="24">
                <el-form-item label="上级部门" prop="parentId">
                  <treeselect
                    v-model="form.parentId"
                    :options="deptOptions"
                    :normalizer="normalizer"
                    :show-count="true"
                    placeholder="选择上级部门"
                    :is-disabled="isEdit"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="部门名称" prop="deptName">
                  <el-input v-model="form.deptName" placeholder="请输入部门名称" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="显示排序" prop="orderNum">
                  <el-input-number v-model="form.sort" controls-position="right" :min="0" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="负责人" prop="leader">
                  <el-input v-model="form.leader" placeholder="请输入负责人" maxlength="20" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="联系电话" prop="phone">
                  <el-input v-model="form.phone" placeholder="请输入联系电话" maxlength="11" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="邮箱" prop="email">
                  <el-input v-model="form.email" placeholder="请输入邮箱" maxlength="50" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="部门状态">
                  <el-radio-group v-model="form.status">
                    <el-radio
                      v-for="dict in statusOptions"
                      :key="dict.value"
                      :label="dict.value"
                    >{{ dict.label }}</el-radio>
                  </el-radio-group>
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>
          <template #footer>
            <div class="dialog-footer">
              <el-button type="primary" @click="submitForm">确 定</el-button>
              <el-button @click="cancel">取 消</el-button>
            </div>
          </template>
        </el-dialog>

      </el-card>
    </template>
  </BasicLayout>
</template>

<script>
import { getDeptList, getDept, delDept, addDept, updateDept } from '@/api/admin/sys-dept'
import Treeselect from 'vue3-treeselect'
import 'vue3-treeselect/dist/vue3-treeselect.css'
import { Search, Refresh, Plus, Edit, Delete } from '@element-plus/icons-vue'

export default {
  name: 'SysDeptManage',
  components: { Treeselect },
  setup() {
    return { Search, Refresh, Plus, Edit, Delete }
  },
  data() {
    return {
      loading: true,
      deptList: [],
      deptOptions: [],
      title: '',
      isEdit: false,
      open: false,
      statusOptions: [],
      queryParams: {
        deptName: undefined,
        status: undefined
      },
      form: {},
      rules: {
        parentId: [
          { required: true, message: '上级部门不能为空', trigger: 'blur' }
        ],
        deptName: [
          { required: true, message: '部门名称不能为空', trigger: 'blur' }
        ],
        sort: [
          { required: true, message: '菜单顺序不能为空', trigger: 'blur' }
        ],
        leader: [
          { required: true, message: '负责人不能为空', trigger: 'blur' }
        ],
        email: [
          {
            type: 'email',
            message: '请输入正确的邮箱地址',
            trigger: ['blur', 'change']
          }
        ],
        phone: [
          {
            pattern: /^1[3|4|5|6|7|8|9][0-9]\d{8}$/,
            message: '请输入正确的手机号码',
            trigger: 'blur'
          }
        ]
      }
    }
  },
  created() {
    this.getList()
    this.getDicts('sys_normal_disable').then(response => {
      this.statusOptions = response.data
    })
  },
  methods: {
    getList() {
      this.loading = true
      getDeptList(this.queryParams).then(response => {
        this.deptList = response.data
        this.loading = false
      })
    },
    normalizer(node) {
      if (node.children && !node.children.length) {
        delete node.children
      }
      return {
        id: node.deptId,
        label: node.deptName,
        children: node.children
      }
    },
    getTreeselect(e) {
      getDeptList().then(response => {
        this.deptOptions = []
        if (e === 'update') {
          const dept = { deptId: 0, deptName: '主类目', children: [], isDisabled: true }
          dept.children = response.data
          this.deptOptions.push(dept)
        } else {
          const dept = { deptId: 0, deptName: '主类目', children: [] }
          dept.children = response.data
          this.deptOptions.push(dept)
        }
      })
    },
    statusFormat(row) {
      return this.selectDictLabel(this.statusOptions, parseInt(row.status))
    },
    cancel() {
      this.open = false
      this.reset()
    },
    reset() {
      this.form = {
        deptId: undefined,
        parentId: undefined,
        deptName: undefined,
        sort: 10,
        leader: undefined,
        phone: undefined,
        email: undefined,
        status: '2'
      }
    },
    handleQuery() {
      this.getList()
    },
    handleResetQuery() {
      this.queryParams = { deptName: undefined, status: undefined }
      this.getList()
    },
    handleAdd(row) {
      this.reset()
      this.getTreeselect('add')
      if (row !== undefined) {
        this.form.parentId = row.deptId
      }
      this.open = true
      this.title = '添加部门'
      this.isEdit = false
    },
    handleUpdate(row) {
      this.reset()
      this.getTreeselect('update')
      getDept(row.deptId).then(response => {
        this.form = response.data
        this.form.status = String(this.form.status)
        this.form.sort = String(this.form.sort)
        this.open = true
        this.title = '修改部门'
        this.isEdit = true
      })
    },
    submitForm: function() {
      this.$refs['form'].validate(valid => {
        if (valid) {
          this.form.status = parseInt(this.form.status)
          this.form.sort = parseInt(this.form.sort)
          if (this.form.deptId !== undefined) {
            updateDept(this.form, this.form.deptId).then(response => {
              if (response.code === 200) {
                this.msgSuccess(response.msg)
                this.open = false
                this.getList()
              } else {
                this.msgError(response.msg)
              }
            })
          } else {
            addDept(this.form).then(response => {
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
    handleDelete(row) {
      const Ids = (row.deptId && [row.deptId]) || this.ids
      this.$confirm(
        '是否确认删除名称为"' + row.deptName + '"的数据项?',
        '警告',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      )
        .then(function() {
          return delDept({ 'ids': Ids })
        }).then((response) => {
          if (response.code === 200) {
            this.msgSuccess(response.msg)
            this.open = false
            this.getList()
          } else {
            this.msgError(response.msg)
          }
        }).catch(function() {})
    }
  }
}
</script>
