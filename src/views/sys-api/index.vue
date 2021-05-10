
<template>
  <BasicLayout>
    <template #wrapper>
      <el-card class="box-card">
        <el-form ref="queryForm" :model="queryParams" :inline="true" label-width="68px">
          <el-form-item label="名称" prop="name"><el-input
            v-model="queryParams.name"
            placeholder="请输入名称"
            clearable
            size="small"
            @keyup.enter.native="handleQuery"
          />
          </el-form-item>
          <el-form-item label="标题" prop="title"><el-input
            v-model="queryParams.title"
            placeholder="请输入标题"
            clearable
            size="small"
            @keyup.enter.native="handleQuery"
          />
          </el-form-item>
          <el-form-item label="地址" prop="path"><el-input
            v-model="queryParams.path"
            placeholder="请输入地址"
            clearable
            size="small"
            @keyup.enter.native="handleQuery"
          />
          </el-form-item>
          <el-form-item label="类型" prop="action"><el-input
            v-model="queryParams.action"
            placeholder="请输入类型"
            clearable
            size="small"
            @keyup.enter.native="handleQuery"
          />
          </el-form-item>
          <el-form-item label="按钮id" prop="parentId"><el-select
            v-model="form.parentId"
            placeholder="请选择"
          >
            <el-option
              v-for="dict in parentIdOptions"
              :key="dict.key"
              :label="dict.value"
              :value="dict.key"
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
              v-permisaction="['admin:sysapi:add']"
              type="primary"
              icon="el-icon-plus"
              size="mini"
              @click="handleAdd"
            >新增
            </el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button
              v-permisaction="['admin:sysapi:edit']"
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
              v-permisaction="['admin:sysapi:remove']"
              type="danger"
              icon="el-icon-delete"
              size="mini"
              :disabled="multiple"
              @click="handleDelete"
            >删除
            </el-button>
          </el-col>
        </el-row>

        <el-table v-loading="loading" :data="sysapiList" @selection-change="handleSelectionChange">
          <el-table-column type="selection" width="55" align="center" /><el-table-column
            label="名称"
            align="center"
            prop="name"
            :show-overflow-tooltip="true"
          /><el-table-column
            label="标题"
            align="center"
            prop="title"
            :show-overflow-tooltip="true"
          /><el-table-column
            label="地址"
            align="center"
            prop="path"
            :show-overflow-tooltip="true"
          /><el-table-column
            label="类型"
            align="center"
            prop="action"
            :show-overflow-tooltip="true"
          /><el-table-column label="按钮id" align="center" prop="parentId" :formatter="parentIdFormat" width="100">
            <template slot-scope="scope">
              {{ parentIdFormat(scope.row) }}
            </template>
          </el-table-column><el-table-column
            label="排序"
            align="center"
            prop="sort"
            :show-overflow-tooltip="true"
          /><el-table-column
            label="创建时间"
            align="center"
            prop="createdAt"
            :show-overflow-tooltip="true"
          />
          <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
            <template slot-scope="scope">
              <el-button
                v-permisaction="['admin:sysapi:edit']"
                size="mini"
                type="text"
                icon="el-icon-edit"
                @click="handleUpdate(scope.row)"
              >修改
              </el-button>
              <el-button
                v-permisaction="['admin:sysapi:remove']"
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
        <el-dialog :title="title" :visible.sync="open" width="500px">
          <el-form ref="form" :model="form" :rules="rules" label-width="80px">

            <el-form-item label="名称" prop="name">
              <el-input
                v-model="form.name"
                placeholder="名称"
              />
            </el-form-item>
            <el-form-item label="标题" prop="title">
              <el-input
                v-model="form.title"
                placeholder="标题"
              />
            </el-form-item>
            <el-form-item label="地址" prop="path">
              <el-input
                v-model="form.path"
                placeholder="地址"
              />
            </el-form-item>
            <el-form-item label="" prop="paths">
              <el-input
                v-model="form.paths"
                placeholder=""
              />
            </el-form-item>
            <el-form-item label="类型" prop="action">
              <el-input
                v-model="form.action"
                placeholder="类型"
              />
            </el-form-item>
            <el-form-item label="按钮id" prop="parentId">
              <el-input
                v-model="form.parentId"
                placeholder="按钮id"
              />
            </el-form-item>
            <el-form-item label="排序" prop="sort">
              <el-input
                v-model="form.sort"
                placeholder="排序"
              />
            </el-form-item>
            <el-form-item label="创建者" prop="createBy">
              <el-input
                v-model="form.createBy"
                placeholder="创建者"
              />
            </el-form-item>
            <el-form-item label="更新者" prop="updateBy">
              <el-input
                v-model="form.updateBy"
                placeholder="更新者"
              />
            </el-form-item>
            <el-form-item label="创建时间" prop="createdAt">
              <el-date-picker
                v-model="form.createdAt"
                type="datetime"
                placeholder="选择日期"
              />
            </el-form-item>
            <el-form-item label="最后更新时间" prop="updatedAt">
              <el-date-picker
                v-model="form.updatedAt"
                type="datetime"
                placeholder="选择日期"
              />
            </el-form-item>
            <el-form-item label="删除时间" prop="deletedAt">
              <el-date-picker
                v-model="form.deletedAt"
                type="datetime"
                placeholder="选择日期"
              />
            </el-form-item>
          </el-form>
          <div slot="footer" class="dialog-footer">
            <el-button type="primary" @click="submitForm">确 定</el-button>
            <el-button @click="cancel">取 消</el-button>
          </div>
        </el-dialog>
        <FileChoose ref="fileChoose" :dialog-form-visible="fileOpen" @confirm="getImgList" @close="fileClose" />
      </el-card>
    </template>
  </BasicLayout>
</template>

<script>
import { addSysApi, delSysApi, getSysApi, listSysApi, updateSysApi } from '@/api/sys-api'
import { listMenu } from '@/api/system/menu'

import FileChoose from '@/components/FileChoose'

export default {
  name: 'SysApi',
  components: {
    FileChoose
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
      sysapiList: [],

      // 关系表类型
      parentIdOptions: [],

      // 查询参数
      queryParams: {
        pageIndex: 1,
        pageSize: 10,
        name: undefined,
        title: undefined,
        path: undefined,
        action: undefined,
        parentId: undefined

      },
      // 表单参数
      form: {
      },
      // 表单校验
      rules: {
        name: [{ required: true, message: '名称不能为空', trigger: 'blur' }],
        title: [{ required: true, message: '标题不能为空', trigger: 'blur' }],
        path: [{ required: true, message: '地址不能为空', trigger: 'blur' }],
        action: [{ required: true, message: '类型不能为空', trigger: 'blur' }],
        parentId: [{ required: true, message: '按钮id不能为空', trigger: 'blur' }]
      }
    }
  },
  created() {
    this.getList()
    this.getSysMenuItems()
  },
  methods: {
    /** 查询参数列表 */
    getList() {
      this.loading = true
      listSysApi(this.addDateRange(this.queryParams, this.dateRange)).then(response => {
        this.sysapiList = response.data.list
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

        id: undefined,
        name: undefined,
        title: undefined,
        path: undefined,
        paths: undefined,
        action: undefined,
        parentId: undefined,
        sort: undefined
      }
      this.resetForm('form')
    },
    getImgList: function() {
      this.form[this.fileIndex] = this.$refs['fileChoose'].resultList[0].fullUrl
    },
    fileClose: function() {
      this.fileOpen = false
    },
    parentIdFormat(row) {
      return this.selectItemsLabel(this.parentIdOptions, row.parentId)
    },
    // 关系
    getSysMenuItems() {
      this.getItems(listMenu, undefined).then(res => {
        this.parentIdOptions = this.setItems(res, 'menuId', 'menuName')
      })
    },
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
      this.title = '添加接口管理'
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
      const id =
                row.id || this.ids
      getSysApi(id).then(response => {
        this.form = response.data
        this.open = true
        this.title = '修改接口管理'
        this.isEdit = true
      })
    },
    /** 提交按钮 */
    submitForm: function() {
      this.$refs['form'].validate(valid => {
        if (valid) {
          if (this.form.id !== undefined) {
            updateSysApi(this.form).then(response => {
              if (response.code === 200) {
                this.msgSuccess('修改成功')
                this.open = false
                this.getList()
              } else {
                this.msgError(response.msg)
              }
            })
          } else {
            addSysApi(this.form).then(response => {
              if (response.code === 200) {
                this.msgSuccess('新增成功')
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
      var Ids = (row.id && [row.id]) || this.ids

      this.$confirm('是否确认删除编号为"' + Ids + '"的数据项?', '警告', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(function() {
        return delSysApi({ 'ids': Ids })
      }).then(() => {
        this.getList()
        this.msgSuccess('删除成功')
      }).catch(function() {
      })
    }
  }
}
</script>
