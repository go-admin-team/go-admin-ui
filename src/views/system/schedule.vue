<template>
  <div>
    <Layout bg="#fff">
      <el-card slot="main">
        <TabelAction
          ref="customTable"
          title="定时任务"
          :theader="tableHeader"
          show-select
          show-action
          :link="['name']"
          methods="api/v1/schedule/list"
          add-permisaction="system:schedule:add"
          edit-permisaction="system:schedule:edit"
          delete-permisaction="system:schedule:remove"
          @change="handleChange"
          @dialogConfirm="handleConfirm"
          @dialogCancel="handleCancel"
        >
          <template #content>
            <el-form ref="ruleForm" :model="ruleForm" :rules="rules" label-width="100px" class="demo-ruleForm">
              <el-form-item label="任务名" prop="name">
                <el-input v-model="ruleForm.name" placeholder="请输入任务名" />
              </el-form-item>
              <el-form-item label="定时规则" prop="rule">
                <el-input v-model="ruleForm.rule" placeholder="请输入定时规则" />
              </el-form-item>
              <el-form-item label="启用状态" prop="status">
                <el-select v-model="ruleForm.status" placeholder="请选择">
                  <el-option label="是" value="1" />
                  <el-option label="否" value="2" />
                </el-select>
              </el-form-item>
              <el-form-item label="任务方法" prop="fun">
                <el-input v-model="ruleForm.fun" placeholder="请输入任务方法" />
              </el-form-item>
              <el-form-item label="描述" prop="describe">
                <el-input
                  v-model="ruleForm.describe"
                  type="textarea"
                  :rows="2"
                  placeholder="请输入描述"
                />
              </el-form-item>
            </el-form>
          </template>
          <template v-slot:action="action" v-permisaction="['system:schedule:edit']" class="action">
            <el-button type="text" icon="el-icon-search" size="mini" :disabled="action.item.status === 1" @click="handleAction(action.item,1)">启动</el-button>
            <el-button type="text" icon="el-icon-search" size="mini" :disabled="action.item.status === 2" @click="handleAction(action.item,2)">暂停</el-button>
          </template>
        </TabelAction>
      </el-card>
    </Layout>
  </div>
</template>

<script>
import Layout from '@/components/layout'
import TabelAction from '@/components/tableAction'
import { add, getSchedule, edit, deleteSchedule } from '@/api/schedule'
export default {
  name: 'Schedule',
  components: {
    Layout,
    TabelAction
  },
  data() {
    return {
      tableHeader: [
        {
          label: '任务名称',
          value: 'name',
          width: 200
        },
        {
          label: '定时规则',
          value: 'rule'
        },
        {
          label: '启用状态',
          value: 'status'
        },
        {
          label: '任务方法',
          value: 'fun'
        },
        {
          label: '描述',
          value: 'describe'
        },
        {
          label: '创建时间',
          value: 'createdAt'
        },
        {
          label: '更新时间',
          value: 'updatedAt'
        }
      ],
      ruleForm: {
        scheduleId: '',
        name: '',
        rule: '',
        status: '1',
        fun: '',
        describe: ''
      },
      rules: {
        name: [
          { required: true, message: '请输入任务名', trigger: 'blur' },
          { min: 3, max: 50, message: '长度在 3 到 50 个字符', trigger: 'blur' }
        ],
        rule: [
          { required: true, message: '请输入定时规则', trigger: 'blur' }
        ],
        status: [
          { required: true, message: '请选择启用状态', trigger: 'change' }
        ],
        fun: [
          { required: true, message: '请输入任务方法', trigger: 'blur' }
        ]
      }
    }
  },
  methods: {
    handleChange(e) {
      const ids = e.map(item => item.schedule_id).join(',')
      getSchedule(ids).then(ret => {
        if (ret.code === 200) {
          this.ruleForm = {
            schedule_id: ret.result.schedule_id,
            name: ret.result.name,
            rule: ret.result.rule,
            status: ret.result.status,
            fun: ret.result.fun,
            describe: ret.result.describe
          }
        }
      })
    },
    handleCancel() {
      this.$refs.ruleForm.resetFields()
    },
    handleAction(a, b) {
      a.status = parseInt(b)
      edit(a).then(ret => {
        if (ret.code === 200) {
          this.$refs.customTable.refreshTable()
        }
      })
    },
    handleConfirm(type) {
      switch (type) {
        case 1: // 查看
          this.$refs.ruleForm.resetFields()
          this.$refs.customTable.handleDialogCancel()
          break
        case 2: // 新增
          this.regForm(_ => {
            this.$refs.customTable.loadingDialogOpen()
            this.ruleForm.status = parseInt(this.ruleForm.status)
            add(this.ruleForm).then(ret => {
              if (ret.code === 200) {
                this.$refs.customTable.refreshTable()
                this.$refs.customTable.handleDialogCancel()
                this.$refs.ruleForm.resetFields()
              }
            }).finally(_ => {
              this.$refs.customTable.loadingDialogClose()
            })
          })
          break
        case 3: // 修改
          this.regForm(_ => {
            this.$refs.customTable.loadingDialogOpen()
            this.ruleForm.status = parseInt(this.ruleForm.status)
            edit(this.ruleForm).then(ret => {
              if (ret.code === 200) {
                this.$refs.customTable.refreshTable()
                this.$refs.customTable.handleDialogCancel()
                this.$refs.ruleForm.resetFields()
              }
            }).finally(_ => {
              this.$refs.customTable.loadingDialogClose()
            })
          })
          break
        case 4: // 删除
          // eslint-disable-next-line no-case-declarations
          const ids = this.$refs.customTable.getSelectIds()
          if (!ids) {
            return false
          }
          deleteSchedule({ ids: ids.map(item => item.schedule_id).join(',') }).then(ret => {
            if (ret.code === 200) {
              this.$refs.customTable.refreshTable()
            }
          })
          break
      }
    },
    regForm(func) {
      this.$refs.ruleForm.validate((valid) => {
        if (valid) {
          func()
        } else {
          return false
        }
      })
    }
  }
}
</script>

<style lang="scss" scoped>
  /deep/ .el-select{
    width: 100%;
  }
</style>
