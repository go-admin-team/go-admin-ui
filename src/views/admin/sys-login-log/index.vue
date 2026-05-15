
<template>
  <BasicLayout>
    <template #wrapper>
      <el-card class="box-card">
        <el-form ref="queryForm" :model="queryParams" :inline="true" class="search-form">
          <el-form-item label="用户名" prop="username">
            <el-input
              v-model="queryParams.username"
              placeholder="请输入用户名"
              clearable
              size="small"
              @keyup.enter="handleQuery"
            />
          </el-form-item>
          <el-form-item label="状态" prop="status">
            <el-select
              v-model="queryParams.status"
              placeholder="系统登录日志状态"
              clearable
              size="small"
            >
              <el-option
                v-for="dict in statusOptions"
                :key="dict.value"
                :label="dict.label"
                :value="dict.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="ip地址" prop="ipaddr">
            <el-input
              v-model="queryParams.ipaddr"
              placeholder="请输入ip地址"
              clearable
              size="small"
              @keyup.enter="handleQuery"
            />
          </el-form-item>

          <el-form-item>
            <el-button type="primary" size="small" :icon="Search" @click="handleQuery">搜索</el-button>
            <el-button size="small" :icon="Refresh" @click="resetQuery">重置</el-button>
          </el-form-item>
        </el-form>

        <div class="toolbar mb8">
          <el-button v-permisaction="['admin:sysLoginLog:remove']" type="danger" size="small" :icon="Delete" :disabled="multiple" @click="handleDelete">删除</el-button>
        </div>

        <el-table v-loading="loading" :data="sysloginlogList" border stripe @selection-change="handleSelectionChange">
          <el-table-column type="selection" width="55" align="center" />
          <el-table-column
            label="用户名"
            align="center"
            prop="username"
            :show-overflow-tooltip="true"
          />
          <el-table-column
            label="类型"
            align="center"
            prop="msg"
            :show-overflow-tooltip="true"
          />
          <el-table-column
            label="状态"
            align="center"
            prop="status"
            width="100"
          >
            <template #default="scope">
              <el-tag :type="scope.row.status === '2' || scope.row.status === 2 ? 'success' : 'danger'" size="small" disable-transitions>
                {{ statusFormat(scope.row) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column
            label="ip地址"
            align="center"
            prop="ipaddr"
          >
            <template #default="scope">
              <el-popover trigger="hover" placement="top">
                <p>IP: {{ scope.row.ipaddr }}</p>
                <p>归属地: {{ scope.row.loginLocation }}</p>
                <p>浏览器: {{ scope.row.browser }}</p>
                <p>系统: {{ scope.row.os }}</p>
                <p>固件: {{ scope.row.platform }}</p>
                <template #reference><div class="name-wrapper">
                  {{ scope.row.ipaddr }}
                </div></template>
              </el-popover>
            </template>
          </el-table-column>

          <el-table-column
            label="登录时间"
            align="center"
            prop="loginTime"
            width="180"
          >
            <template #default="scope">
              <span>{{ parseTime(scope.row.loginTime) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
            <template #default="scope">
              <el-button v-permisaction="['admin:sysLoginLog:remove']" type="danger" link size="small" :icon="Delete" @click="handleDelete(scope.row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>

        <pagination
          v-show="total>0"
          v-model:current-page="queryParams.pageIndex"
          v-model:page-size="queryParams.pageSize"
          :total="total"
          @pagination="getList"
        />
      </el-card>
    </template>
  </BasicLayout>
</template>

<script>
import { delSysLoginlog, getSysLoginlog, listSysLoginlog } from '@/api/admin/sys-login-log'
import { Search, Refresh, Delete } from '@element-plus/icons-vue'

export default {
  name: 'SysLoginLogManage',
  components: {
  },
  setup() {
    return { Search, Refresh, Delete }
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
      // 弹出层标题
      title: '',
      // 是否显示弹出层
      open: false,
      isEdit: false,
      fileOpen: false,
      fileIndex: undefined,
      // 类型数据字典
      typeOptions: [],
      sysloginlogList: [],
      statusOptions: [],
      // 关系表类型

      // 查询参数
      queryParams: {
        pageIndex: 1,
        pageSize: 10,
        username: undefined,
        status: undefined,
        ipaddr: undefined,
        loginLocation: undefined,
        createdAtOrder: 'desc'
      },
      // 表单参数
      form: {
      },
      // 表单校验
      rules: {
      }
    }
  },
  created() {
    this.getList()
    this.getDicts('sys_common_status').then(response => {
      this.statusOptions = response.data
    })
  },
  methods: {
    /** 查询参数列表 */
    getList() {
      this.loading = true
      listSysLoginlog(this.addDateRange(this.queryParams, this.dateRange)).then(response => {
        this.sysloginlogList = response.data.list
        this.total = response.data.count
        this.loading = false
      }
      )
    },
    // 取消按钮
    cancel() {
      this.open = false
      this.reset()
    },
    // 表单重置
    reset() {
      this.form = {
        ID: undefined,
        username: undefined,
        status: undefined,
        ipaddr: undefined,
        loginLocation: undefined,
        browser: undefined,
        os: undefined,
        platform: undefined,
        loginTime: undefined,
        remark: undefined,
        msg: undefined
      }
      this.resetForm('form')
    },
    getImgList: function() {
      this.form[this.fileIndex] = this.$refs['fileChoose'].resultList[0].fullUrl
    },
    fileClose: function() {
      this.fileOpen = false
    },
    statusFormat(row) {
      return this.selectDictLabel(this.statusOptions, row.status)
    },
    // 关系
    // 文件
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
    /** 新增按钮操作 */
    handleAdd() {
      this.reset()
      this.open = true
      this.title = '添加系统登录日志'
      this.isEdit = false
    },
    // 多选框选中数据
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.id)
      this.single = selection.length !== 1
      this.multiple = !selection.length
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset()
      const ID =
                row.id || this.ids
      getSysLoginlog(ID).then(response => {
        this.form = response.data
        this.open = true
        this.title = '修改系统登录日志'
        this.isEdit = true
      })
    },
    /** 删除按钮操作 */
    handleDelete(row) {
      var Ids = (row.id && [row.id]) || this.ids

      this.$confirm('是否确认删除编号为"' + Ids + '"的数据项?', '警告', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(function() {
        return delSysLoginlog({ 'ids': Ids })
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
