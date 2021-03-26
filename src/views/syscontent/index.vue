<template>
  <BasicLayout>
    <template #wrapper>
      <el-card class="box-card">
        <el-form ref="queryForm" :model="queryParams" :inline="true" label-width="68px">
          <el-form-item label="分类" prop="cateId"><el-select
            v-model="queryParams.cateId"
            placeholder="请选择"
          >
            <el-option
              v-for="dict in cateIdOptions"
              :key="dict.key"
              :label="dict.value"
              :value="dict.key"
            />
          </el-select>
          </el-form-item>
          <el-form-item label="名称" prop="name"><el-input
            v-model="queryParams.name"
            placeholder="请输入名称"
            clearable
            size="small"
            @keyup.enter.native="handleQuery"
          />
          </el-form-item>
          <el-form-item label="状态" prop="status"><el-select
            v-model="queryParams.status"
            placeholder="内容管理状态"
            clearable
            size="small"
          >
            <el-option
              v-for="dict in statusOptions"
              :key="dict.dictValue"
              :label="dict.dictLabel"
              :value="dict.dictValue"
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
              v-permisaction="['syscontent:syscontent:add']"
              type="primary"
              icon="el-icon-plus"
              size="mini"
              @click="handleAdd"
            >新增
            </el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button
              v-permisaction="['syscontent:syscontent:edit']"
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
              v-permisaction="['syscontent:syscontent:remove']"
              type="danger"
              icon="el-icon-delete"
              size="mini"
              :disabled="multiple"
              @click="handleDelete"
            >删除
            </el-button>
          </el-col>
        </el-row>

        <el-table v-loading="loading" :data="syscontentList" @selection-change="handleSelectionChange">
          <el-table-column type="selection" width="55" align="center" />
          <el-table-column label="分类" align="center" prop="cateId" :formatter="cateIdFormat" width="100">
            <template slot-scope="scope">
              {{ cateIdFormat(scope.row) }}
            </template>
          </el-table-column>
          <el-table-column
            label="名称"
            align="center"
            prop="name"
            :show-overflow-tooltip="true"
          /><el-table-column
            label="状态"
            align="center"
            prop="status"
            :formatter="statusFormat"
            width="100"
          >
            <template slot-scope="scope">
              {{ statusFormat(scope.row) }}
            </template>
          </el-table-column><el-table-column
            label="创建时间"
            align="center"
            prop="createdAt"
            :show-overflow-tooltip="true"
          />
          <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
            <template slot-scope="scope">
              <el-button
                v-permisaction="['syscontent:syscontent:edit']"
                size="mini"
                type="text"
                icon="el-icon-edit"
                @click="handleUpdate(scope.row)"
              >修改
              </el-button>
              <el-button
                v-permisaction="['syscontent:syscontent:remove']"
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
      </el-card>
    </template>

  </BasicLayout>
</template>

<script>
import { delSysContent, listSysContent } from '@/api/syscontent'
import { listSysCategory } from '@/api/syscategory'

// import FileChoose from '@/components/FileChoose'
// import RictText from '@/components/richtext'
export default {
  name: 'SysContent',
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
      // 弹出层标题
      title: '',
      // 是否显示弹出层
      open: false,
      fileOpen: false,
      fileIndex: undefined,
      isEdit: false,
      // 类型数据字典
      typeOptions: [],
      syscontentList: [],
      statusOptions: [],
      // 关系表类型
      cateIdOptions: [],
      // 查询参数
      queryParams: {
        pageIndex: 1,
        pageSize: 10,
        cateId: undefined,
        name: undefined,
        status: undefined
      }
    }
  },
  created() {
    this.getList()
    this.getSysCategoryItems()
    this.getDicts('sys_content_status').then(response => {
      this.statusOptions = response.data
    })
  },
  methods: {
    /** 查询参数列表 */
    getList() {
      this.loading = true
      listSysContent(this.addDateRange(this.queryParams, this.dateRange)).then(response => {
        this.syscontentList = response.data.list
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
    cateIdFormat(row) {
      return this.selectItemsLabel(this.cateIdOptions, row.cateId)
    },
    statusFormat(row) {
      return this.selectDictLabel(this.statusOptions, row.status)
    },
    // 关系
    getSysCategoryItems() {
      this.getItems(listSysCategory, undefined).then(res => {
        this.cateIdOptions = this.setItems(res, 'id', 'name')
      })
    },
    /** 搜索按钮操作 */
    handleQuery() {
      debugger
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
      this.$router.push({ name: 'SysContentCreate' })
    },
    // 多选框选中数据
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.id)
      this.single = selection.length !== 1
      this.multiple = !selection.length
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.$router.push({ name: 'SysContentEdit', params: { id: row.id }})
    },
    /** 删除按钮操作 */
    handleDelete(row) {
      // const Ids = row.id || this.ids
      const Ids = (row.id && [row.id]) || this.ids
      this.$confirm('是否确认删除编号为"' + Ids + '"的数据项?', '警告', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(function() {
        return delSysContent(Ids)
      }).then(() => {
        this.getList()
        this.msgSuccess('删除成功')
      }).catch(function() {
      })
    }
  }
}
</script>
