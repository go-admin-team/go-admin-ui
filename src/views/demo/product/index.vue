<template>
  <BasicLayout>
    <template #wrapper>
      <el-card class="box-card">
        <!-- 搜索表单：prop 需与 queryParams 字段同名，resetQuery 依赖它重置 -->
        <el-form ref="queryForm" :model="queryParams" :inline="true">
          <el-form-item label="名称" prop="name">
            <el-input
              v-model="queryParams.name"
              placeholder="请输入名称"
              clearable
              @keyup.enter="handleQuery"
            />
          </el-form-item>
          <el-form-item label="状态" prop="status">
            <el-select v-model="queryParams.status" placeholder="请选择状态" clearable>
              <el-option label="正常" value="1" />
              <el-option label="停用" value="2" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleQuery">搜索</el-button>
            <el-button @click="resetQuery">重置</el-button>
          </el-form-item>
        </el-form>

        <!-- 操作按钮：权限标识格式为 模块:资源:操作，需与后端菜单配置一致 -->
        <el-row :gutter="10" class="mb8">
          <el-col :span="1.5">
            <el-button v-permisaction="['demo:product:add']" type="primary" @click="handleAdd">
              新增
            </el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button
              v-permisaction="['demo:product:delete']"
              type="danger"
              :disabled="multiple"
              @click="handleDelete()"
            >
              删除
            </el-button>
          </el-col>
        </el-row>

        <el-table v-loading="loading" :data="list" @selection-change="handleSelectionChange">
          <el-table-column type="selection" width="55" align="center" />
          <el-table-column label="名称" align="center" prop="name" :show-overflow-tooltip="true" />
          <el-table-column label="编码" align="center" prop="code" />
          <el-table-column label="单价" align="center" prop="price" />
          <el-table-column label="状态" align="center">
            <template #default="{ row }">
              <el-tag :type="row.status === '1' ? 'success' : 'info'">
                {{ row.status === '1' ? '正常' : '停用' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="创建时间" align="center" width="180">
            <template #default="{ row }">
              {{ $parseTime(row.createdAt) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" align="center" width="160">
            <template #default="{ row }">
              <el-button v-permisaction="['demo:product:edit']" link type="primary" @click="handleUpdate(row)">
                修改
              </el-button>
              <el-button v-permisaction="['demo:product:delete']" link type="danger" @click="handleDelete(row)">
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <AppPagination
          v-show="total > 0"
          :total="total"
          :page="queryParams.pageIndex"
          :limit="queryParams.pageSize"
          @update:page="val => (queryParams.pageIndex = val)"
          @update:limit="val => (queryParams.pageSize = val)"
          @pagination="getList"
        />

        <!-- 新增与修改共用同一个弹窗，由 form 中是否带主键区分 -->
        <el-dialog v-model="open" :title="title" width="500px" :close-on-click-modal="false">
          <el-form ref="form" :model="form" :rules="rules" label-width="80px">
            <el-form-item label="名称" prop="name">
              <el-input v-model="form.name" placeholder="请输入名称" />
            </el-form-item>
            <el-form-item label="编码" prop="code">
              <el-input v-model="form.code" placeholder="请输入编码" />
            </el-form-item>
            <el-form-item label="单价" prop="price">
              <el-input-number v-model="form.price" :min="0" :precision="2" />
            </el-form-item>
            <el-form-item label="状态" prop="status">
              <el-radio-group v-model="form.status">
                <el-radio value="1">正常</el-radio>
                <el-radio value="2">停用</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="备注" prop="remark">
              <el-input v-model="form.remark" type="textarea" placeholder="请输入内容" />
            </el-form-item>
          </el-form>
          <template #footer>
            <el-button type="primary" @click="submitForm">确 定</el-button>
            <el-button @click="cancel">取 消</el-button>
          </template>
        </el-dialog>
      </el-card>
    </template>
  </BasicLayout>
</template>

<script>
import crud from '@/mixins/crud'
import { listProduct, getProduct, addProduct, updateProduct, delProduct } from '@/api/demo/product'

export default {
  // name 必须与后端菜单配置的 menu_name 一致，否则 keep-alive 缓存无法命中
  name: 'DemoProduct',

  mixins: [crud],

  data() {
    return {
      // 仅声明本页特有的内容；list/total/loading/open/form 等由 crud mixin 提供
      rules: {
        name: [{ required: true, message: '名称不能为空', trigger: 'blur' }],
        code: [{ required: true, message: '编码不能为空', trigger: 'blur' }]
      }
    }
  },

  created() {
    this.getList()
  },

  methods: {
    // 向 crud mixin 声明差异部分：接口、主键字段、表单初始值
    crudOptions() {
      return {
        idKey: 'id',
        api: {
          list: listProduct,
          get: getProduct,
          add: addProduct,
          update: updateProduct,
          del: delProduct
        },
        defaultForm: () => ({
          id: undefined,
          name: undefined,
          code: undefined,
          price: 0,
          status: '1',
          remark: undefined
        })
      }
    }
  }
}
</script>
