<template>
  <BasicLayout>
    <template #wrapper>
      <el-card class="box-card">
        <el-form ref="queryForm" :model="queryParams" :inline="true" class="search-form">
          <el-form-item label="状态" prop="status">
            <el-select
              v-model="queryParams.status"
              placeholder="操作状态"
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
          <el-form-item label="创建时间">
            <el-date-picker
              v-model="dateRange"
              size="small"
              type="datetimerange"
              :picker-options="pickerOptions"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              align="right"
              value-format="yyyy-MM-dd HH:mm:ss"
            />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" size="small" :icon="Search" @click="handleQuery">搜索</el-button>
            <el-button size="small" :icon="Refresh" @click="resetQuery">重置</el-button>
          </el-form-item>
        </el-form>

        <div class="toolbar mb8">
          <el-button v-permisaction="['admin:sysOperLog:remove']" type="danger" size="small" :icon="Delete" :disabled="multiple" @click="handleDelete">删除</el-button>
          <el-button v-permisaction="['admin:sysOperLog:export']" size="small" :icon="Download" @click="handleExport">导出</el-button>
        </div>

        <el-table v-loading="loading" :data="list" border stripe @selection-change="handleSelectionChange">
          <el-table-column type="selection" width="55" align="center" />
          <el-table-column label="编号" width="70" prop="id" />
          <el-table-column
            label="Request info"
            prop="operUrl"
          >
            <template #default="scope">
              <el-popover trigger="hover" placement="top">

                <p>Request:
                  <el-tag v-if="scope.row.requestMethod=='GET'">{{ scope.row.requestMethod }}</el-tag>
                  <el-tag v-if="scope.row.requestMethod=='POST'" type="success">{{ scope.row.requestMethod }}</el-tag>
                  <el-tag v-if="scope.row.requestMethod=='PUT'" type="warning">{{ scope.row.requestMethod }}</el-tag>
                  <el-tag v-if="scope.row.requestMethod=='DELETE'" type="danger">{{ scope.row.requestMethod }}</el-tag>
                  {{ scope.row.operUrl }}
                </p>
                <p>Host: {{ scope.row.operIp }}</p>
                <p>Location: {{ scope.row.operLocation }}</p>
                <p>耗时: {{ scope.row.latencyTime }}</p>
                <template #reference><div class="name-wrapper">
                  <el-tag v-if="scope.row.requestMethod=='GET'">{{ scope.row.requestMethod }}</el-tag>
                  <el-tag v-if="scope.row.requestMethod=='POST'" type="success">{{ scope.row.requestMethod }}</el-tag>
                  <el-tag v-if="scope.row.requestMethod=='PUT'" type="warning">{{ scope.row.requestMethod }}</el-tag>
                  <el-tag v-if="scope.row.requestMethod=='DELETE'" type="danger">{{ scope.row.requestMethod }}</el-tag>
                  {{ scope.row.operUrl }}
                </div></template>
              </el-popover>
            </template>
          </el-table-column>
          <el-table-column
            label="操作人员"
            prop="operName"
            width="160"
            :show-overflow-tooltip="true"
          />
          <el-table-column
            label="状态"
            prop="status"
            width="80"
            :show-overflow-tooltip="true"
          >
            <template #default="scope">
              <el-tag v-if="scope.row.status=='2'" type="success">{{ statusFormat(scope.row,scope.row.status) }}</el-tag>
              <el-tag v-if="scope.row.status=='1'" type="danger">{{ statusFormat(scope.row,scope.row.status) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作日期" prop="operTime" width="160">
            <template #default="scope">
              <span>{{ parseTime(scope.row.operTime) }}</span>
            </template>
          </el-table-column>
          <el-table-column
            label="操作"
            width="80"
            class-name="small-padding fixed-width"
          >
            <template #default="scope">
              <el-button v-permisaction="['admin:sysOperLog:query']" type="primary" link size="small" @click="handleView(scope.row,scope.index)">详细</el-button>
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

        <!-- 操作日志详细 -->
        <el-dialog v-model="open" title="操作日志详细" width="700px" :close-on-click-modal="false">
          <el-form ref="form" :model="form" label-width="100px" size="mini">
            <el-row>
              <el-col :span="24">
                <el-form-item label="请求地址：">{{ form.operUrl }}</el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item
                  label="登录信息："
                >{{ form.operName }} / {{ form.operIp }} / {{ form.operLocation }}</el-form-item>
              </el-col>

              <el-col :span="12">
                <el-form-item label="请求方式：">{{ form.requestMethod }}</el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="耗时：">{{ form.latencyTime }}</el-form-item>
              </el-col>
              <el-col :span="24">
                <el-form-item label="请求参数：">{{ form.operParam }}</el-form-item>
              </el-col>
              <el-col :span="24">
                <el-form-item label="返回参数：">{{ form.jsonResult }}</el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="操作状态：">
                  <div v-if="form.status === '2'">正常</div>
                  <div v-else-if="form.status === '1'">关闭</div>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="操作时间：">{{ parseTime(form.operTime) }}</el-form-item>
              </el-col>
              <el-col :span="24">
                <el-form-item v-if="form.status === 1" label="异常信息：">{{ form.errorMsg }}</el-form-item>
              </el-col>
            </el-row>
          </el-form>
          <template #footer><div class="dialog-footer">
            <el-button @click="open = false">关 闭</el-button>
          </div></template>
        </el-dialog>
      </el-card>
    </template>
  </BasicLayout>
</template>

<script>
import { listSysOperlog, delSysOperlog, cleanOperlog } from '@/api/admin/sys-opera-log'
import { formatJson } from '@/utils'
import { Search, Refresh, Delete, Download } from '@element-plus/icons-vue'

export default {
  name: 'OperLog',
  setup() {
    return { Search, Refresh, Delete, Download }
  },
  data() {
    return {
      // 遮罩层
      loading: true,
      // 选中数组
      ids: [],
      // 非多个禁用
      multiple: true,
      // 总条数
      total: 0,
      // 表格数据
      list: [],
      // 是否显示弹出层
      open: false,
      // 类型数据字典
      statusOptions: [],
      // 日期范围
      dateRange: [],
      // 表单参数
      form: {},
      // 查询参数
      queryParams: {
        pageIndex: 1,
        pageSize: 10,
        title: undefined,
        operName: undefined,
        businessType: undefined,
        status: undefined,
        createdAtOrder: 'desc'
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
    /** 查询登录日志 */
    getList() {
      this.loading = true
      listSysOperlog(this.addDateRange(this.queryParams, this.dateRange)).then(response => {
        this.list = response.data.list
        this.total = response.data.count
        this.loading = false
      }
      )
    },
    // 操作日志状态字典翻译
    statusFormat(row, column) {
      return this.selectDictLabel(this.statusOptions, row.status)
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
      this.ids = selection.map(item => item.id)
      this.multiple = !selection.length
    },
    /** 详细按钮操作 */
    handleView(row) {
      this.open = true
      this.form = row
    },
    /** 删除按钮操作 */
    handleDelete(row) {
      const operIds = (row.id && [row.id]) || this.ids
      this.$confirm('是否确认删除日志编号为"' + operIds + '"的数据项?', '警告', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(function() {
        return delSysOperlog({ 'ids': operIds })
      }).then((response) => {
        if (response.code === 200) {
          this.msgSuccess(response.msg)
          this.open = false
          this.getList()
        } else {
          this.msgError(response.msg)
        }
      }).catch(function() {})
    },
    /** 清空按钮操作 */
    handleClean() {
      this.$confirm('是否确认清空所有操作日志数据项?', '警告', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(function() {
        return cleanOperlog()
      }).then((response) => {
        if (response.code === 200) {
          this.msgSuccess(response.msg)
          this.open = false
          this.getList()
        } else {
          this.msgError(response.msg)
        }
      }).catch(function() {})
    },
    /** 导出按钮操作 */
    handleExport() {
      // const queryParams = this.queryParams
      this.$confirm('是否确认导出所有操作日志数据项?', '警告', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.downloadLoading = true
        import('@/vendor/Export2Excel').then(excel => {
          const tHeader = ['日志编号', '系统模块', '操作类型', '请求方式', '操作人员', '主机', '操作地点', '操作状态', '操作url', '操作日期']
          const filterVal = ['ID', 'title', 'businessType', 'method', 'operName', 'operIp', 'operLocation', 'status', 'operUrl', 'operTime']
          const list = this.list
          const data = formatJson(filterVal, list)
          excel.export_json_to_excel({
            header: tHeader,
            data,
            filename: '操作日志',
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

