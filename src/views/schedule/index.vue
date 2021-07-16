
<template>
  <div>
    <BasicLayout>
      <template #wrapper>
        <el-card class="box-card">
          <el-form ref="queryForm" :model="queryParams" :inline="true" label-position="left" label-width="68px">
            <el-form-item label="名称" prop="jobName">
              <el-input
                v-model="queryParams.jobName"
                placeholder="请输入名称"
                clearable
                size="small"
                @keyup.enter.native="handleQuery"
              />
            </el-form-item>
            <el-form-item label="任务分组" prop="jobGroup">
              <el-select
                v-model="queryParams.jobGroup"
                placeholder="定时任务任务分组"
                clearable
                size="small"
              >
                <el-option
                  v-for="dict in jobGroupOptions"
                  :key="dict.value"
                  :label="dict.label"
                  :value="dict.value"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="状态" prop="status">
              <el-select
                v-model="queryParams.status"
                placeholder="定时任务状态"
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

            <el-form-item>
              <el-button type="primary" icon="el-icon-search" size="mini" @click="handleQuery">搜索</el-button>
              <el-button icon="el-icon-refresh" size="mini" @click="resetQuery">重置</el-button>
            </el-form-item>
          </el-form>

          <el-row :gutter="10" class="mb8">
            <el-col :span="1.5">
              <el-button
                v-permisaction="['job:sysJob:add']"
                type="primary"
                icon="el-icon-plus"
                size="mini"
                @click="handleAdd"
              >新增
              </el-button>
            </el-col>
            <el-col :span="1.5">
              <el-button
                v-permisaction="['job:sysJob:edit']"
                type="success"
                icon="el-icon-edit"
                size="mini"
                :disabled="single"
                @click="handleUpdate"
              >修改
              </el-button>
            </el-col>
            <el-col :span="1.5">
              <el-button
                v-permisaction="['job:sysJob:remove']"
                type="danger"
                icon="el-icon-delete"
                size="mini"
                :disabled="multiple"
                @click="handleDelete"
              >删除
              </el-button>
            </el-col>
            <el-col :span="1.5">
              <el-button
                v-permisaction="['job:sysJob:log']"
                type="danger"
                icon="el-icon-delete"
                size="mini"
                @click="handleLog"
              >日志
              </el-button>

            </el-col>
          </el-row>

          <el-table v-loading="loading" :data="sysjobList" @selection-change="handleSelectionChange">
            <el-table-column type="selection" width="55" align="center" />
            <el-table-column
              label="编码"
              align="center"
              prop="jobId"
              :show-overflow-tooltip="true"
            />
            <el-table-column
              label="名称"
              align="center"
              prop="jobName"
              :show-overflow-tooltip="true"
            />
            <el-table-column
              label="任务分组"
              align="center"
              prop="jobGroup"
              :formatter="jobGroupFormat"
              width="100"
            >
              <template slot-scope="scope">
                {{ jobGroupFormat(scope.row) }}
              </template>
            </el-table-column>
            <el-table-column
              label="cron表达式"
              align="center"
              prop="cronExpression"
              :show-overflow-tooltip="true"
            />
            <el-table-column
              label="调用目标"
              align="center"
              prop="invokeTarget"
              :show-overflow-tooltip="true"
            />
            <el-table-column
              label="状态"
              align="center"
              prop="status"
              :formatter="statusFormat"
              width="100"
            >
              <template slot-scope="scope">
                {{ statusFormat(scope.row) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
              <template slot-scope="scope">
                <el-button
                  v-permisaction="['job:sysJob:edit']"
                  size="mini"
                  type="text"
                  icon="el-icon-edit"
                  @click="handleUpdate(scope.row)"
                >修改
                </el-button>
                <el-button
                  v-if="scope.row.entry_id!==0"
                  v-permisaction="['job:sysJob:remove']"
                  size="mini"
                  type="text"
                  icon="el-icon-edit"
                  @click="handleRemove(scope.row)"
                >停止
                </el-button>
                <el-button
                  v-if="scope.row.entry_id==0"
                  v-permisaction="['job:sysJob:start']"
                  size="mini"
                  type="text"
                  icon="el-icon-edit"
                  @click="handleStart(scope.row)"
                >启动
                </el-button>
                <el-button
                  v-permisaction="['job:sysJob:remove']"
                  size="mini"
                  type="text"
                  icon="el-icon-delete"
                  @click="handleDelete(scope.row)"
                >删除
                </el-button>
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

          <!-- 添加或修改对话框 -->
          <el-dialog v-dialogDrag :title="title" :visible.sync="open" width="700px" append-to-body>
            <el-form ref="form" :model="form" :rules="rules" label-width="120px">
              <el-row>
                <el-col :span="12">
                  <el-form-item label="名称" prop="jobName">
                    <el-input
                      v-model="form.jobName"
                      placeholder="名称"
                    />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="任务分组" prop="jobGroup">
                    <el-select
                      v-model="form.jobGroup"
                      placeholder="请选择"
                    >
                      <el-option
                        v-for="dict in jobGroupOptions"
                        :key="dict.value"
                        :label="dict.label"
                        :value="dict.value"
                      />
                    </el-select>
                  </el-form-item>
                </el-col>
                <el-col :span="24">
                  <el-form-item label="调用目标" prop="invokeTarget">
                    <span slot="label">
                      调用目标
                      <el-tooltip placement="top">
                        <div slot="content">
                          调用示例：func (t *EXEC) ExamplesNoParam(){..} 填写 ExamplesNoParam 即可；
                          <br>参数说明：目前不支持带参调用
                        </div>
                        <i class="el-icon-question" />
                      </el-tooltip>
                    </span>
                    <el-input
                      v-model="form.invokeTarget"
                      placeholder="调用目标"
                    />
                  </el-form-item>
                </el-col>
                <el-col :span="24">
                  <el-form-item label="目标参数" prop="args">
                    <span slot="label">
                      目标参数
                      <el-tooltip placement="top">
                        <div slot="content">
                          参数示例：有参：请以string格式填写；无参：为空；
                          <br>参数说明：目前仅支持函数调用
                        </div>
                        <i class="el-icon-question" />
                      </el-tooltip>
                    </span>
                    <el-input
                      v-model="form.args"
                      placeholder="目标参数"
                    />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="cron表达式" prop="cronExpression">
                    <el-input
                      v-model="form.cronExpression"
                      placeholder="cron表达式"
                    />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="是否并发" prop="concurrent">
                    <el-radio-group v-model="form.concurrent" size="small">
                      <el-radio-button label="0">允许</el-radio-button>
                      <el-radio-button label="1">禁止</el-radio-button>
                    </el-radio-group>
                  </el-form-item>
                </el-col>
                <el-col :span="24">
                  <el-form-item label="调用类型" prop="jobType">
                    <el-radio-group v-model="form.jobType" size="small">
                      <el-radio-button label="1">接口</el-radio-button>
                      <el-radio-button label="2">函数</el-radio-button>
                    </el-radio-group>
                  </el-form-item>
                </el-col>

                <el-col :span="24">
                  <el-form-item label="执行策略" prop="misfirePolicy">
                    <el-radio-group v-model="form.misfirePolicy" size="small">
                      <el-radio-button label="1">立即执行</el-radio-button>
                      <el-radio-button label="2">执行一次</el-radio-button>
                      <el-radio-button label="3">放弃执行</el-radio-button>
                    </el-radio-group>
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="状态" prop="status">
                    <el-select
                      v-model="form.status"
                      placeholder="请选择"
                    >
                      <el-option
                        v-for="dict in statusOptions"
                        :key="dict.value"
                        :label="dict.label"
                        :value="dict.value"
                      />
                    </el-select>
                  </el-form-item>
                </el-col>
              </el-row>
            </el-form>
            <div slot="footer" class="dialog-footer">
              <el-button type="primary" @click="submitForm">确 定</el-button>
              <el-button @click="cancel">取 消</el-button>
            </div>
          </el-dialog>

        </el-card>
      </template>
    </BasicLayout>
  </div>
</template>

<script>
import { addSysJob, delSysJob, getSysJob, listSysJob, updateSysJob, removeJob, startJob } from '@/api/job/sys-job'

export default {
  name: 'SysJobManage',
  components: {

  },
  data() {
    return {
      // 遮罩层
      loading: true,
      id: 0,
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
      // 类型数据字典
      typeOptions: [],
      sysjobList: [],
      jobGroupOptions: [],
      statusOptions: [],
      // 查询参数
      queryParams: {
        pageIndex: 1,
        pageSize: 10,
        jobName: undefined,
        jobGroup: undefined,
        status: undefined

      },
      // 表单参数
      form: {
      },
      // 表单校验
      rules: {
        jobId: [{ required: true, message: '编码不能为空', trigger: 'blur' }],
        jobName: [{ required: true, message: '名称不能为空', trigger: 'blur' }],
        jobGroup: [{ required: true, message: '任务分组不能为空', trigger: 'blur' }],
        cronExpression: [{ required: true, message: 'cron表达式不能为空', trigger: 'blur' }],
        invokeTarget: [{ required: true, message: '调用目标不能为空', trigger: 'blur' }],
        status: [{ required: true, message: '状态不能为空', trigger: 'blur' }]
      }
    }
  },
  created() {
    this.getList()
    this.getDicts('sys_job_group').then(response => {
      this.jobGroupOptions = response.data
    })

    this.getDicts('sys_job_status').then(response => {
      this.statusOptions = response.data
    })
  },
  methods: {
    /** 查询参数列表 */
    getList() {
      this.loading = true
      listSysJob(this.addDateRange(this.queryParams, this.dateRange)).then(response => {
        this.sysjobList = response.data.list
        this.total = response.data.count
        this.loading = false
      })
    },
    // 取消按钮
    cancel() {
      this.open = false
      this.reset()
    },
    // 表单重置
    reset() {
      this.form = {
        jobId: undefined,
        jobName: undefined,
        jobGroup: undefined,
        cronExpression: undefined,
        invokeTarget: undefined,
        args: undefined,
        misfirePolicy: 1,
        concurrent: 1,
        jobType: 1,
        status: undefined
      }
      this.resetForm('form')
    },
    jobGroupFormat(row) {
      return this.selectDictLabel(this.jobGroupOptions, row.jobGroup)
    },
    statusFormat(row) {
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
    /** 新增按钮操作 */
    handleAdd() {
      this.reset()
      this.open = true
      this.title = '添加定时任务'
      this.isEdit = false
    },
    // 多选框选中数据
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.jobId)
      this.single = selection.length !== 1
      this.multiple = !selection.length
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset()
      const jobId = row.jobId || this.ids
      getSysJob(jobId).then(response => {
        this.form = response.data
        this.form.status = String(this.form.status)
        this.form.misfirePolicy = String(this.form.misfirePolicy)
        this.form.concurrent = String(this.form.concurrent)
        this.form.jobType = String(this.form.jobType)
        this.open = true
        this.title = '修改定时任务'
        this.isEdit = true
      })
    },
    /** 提交按钮 */
    submitForm: function() {
      this.$refs['form'].validate(valid => {
        if (valid) {
          if (this.form.jobId !== undefined) {
            this.form.status = parseInt(this.form.status)
            this.form.misfirePolicy = parseInt(this.form.misfirePolicy)
            this.form.concurrent = parseInt(this.form.concurrent)
            this.form.jobType = parseInt(this.form.jobType)
            updateSysJob(this.form).then(response => {
              if (response.code === 200) {
                this.msgSuccess(response.msg)
                this.open = false
                this.getList()
              } else {
                this.msgError(response.msg)
              }
            })
          } else {
            this.form.status = parseInt(this.form.status)
            this.form.misfirePolicy = parseInt(this.form.misfirePolicy)
            this.form.concurrent = parseInt(this.form.concurrent)
            this.form.jobType = parseInt(this.form.jobType)
            addSysJob(this.form).then(response => {
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
    /** 删除按钮操作 */
    handleDelete(row) {
      const Ids = (row.jobId && [row.jobId]) || this.ids
      this.$confirm('是否确认删除编号为"' + Ids + '"的数据项?', '警告', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(function() {
        return delSysJob({ 'ids': Ids })
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
    /** 开始按钮操作 */
    handleStart(row) {
      this.$confirm('是否确认启动编号为"' + row.jobId + '"的数据项?', '警告', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(function() {
        return startJob(row.jobId)
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
    /** 停止按钮操作 */
    handleRemove(row) {
      this.$confirm('是否确认关闭编号为"' + row.jobId + '"的数据项?', '警告', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(function() {
        return removeJob(row.jobId)
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
    handleLog() {
      this.$router.push({ name: 'job_log', params: { }})
    }
  }
}
</script>
