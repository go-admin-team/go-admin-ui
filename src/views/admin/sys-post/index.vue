<template>
  <PageContainer>
    <ProTable :table="table" selection row-key="postId" :actions-width="120">
      <template #search>
        <el-form-item label="岗位编码">
          <el-input v-model="table.query.postCode" placeholder="请输入岗位编码" clearable style="width: 160px" />
        </el-form-item>
        <el-form-item label="岗位名称">
          <el-input v-model="table.query.postName" placeholder="请输入岗位名称" clearable style="width: 160px" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="table.query.status" placeholder="岗位状态" clearable style="width: 140px">
            <el-option
              v-for="item in sys_normal_disable"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
      </template>

      <template #toolbar>
        <el-button v-permisaction="['admin:sysPost:add']" type="primary" @click="form.openCreate()">
          新增
        </el-button>
        <el-button
          v-permisaction="['admin:sysPost:edit']"
          :disabled="table.single"
          @click="form.openEdit(table.selection[0])"
        >修改</el-button>
        <el-button
          v-permisaction="['admin:sysPost:remove']"
          type="danger"
          plain
          :disabled="table.multiple"
          @click="remove(table.selectedIds)"
        >删除</el-button>
        <el-button
          v-permisaction="['admin:sysPost:export']"
          :loading="exporting"
          @click="handleExport"
        >导出</el-button>
      </template>

      <el-table-column label="岗位编号" prop="postId" min-width="90" />
      <el-table-column label="岗位编码" prop="postCode" min-width="120" show-overflow-tooltip />
      <el-table-column label="岗位名称" prop="postName" min-width="120" show-overflow-tooltip />
      <el-table-column label="岗位排序" prop="sort" min-width="90" />
      <el-table-column label="状态" prop="status" min-width="90">
        <template #default="{ row }">
          <el-tag :type="Number(row.status) === 1 ? 'danger' : 'success'" disable-transitions>
            {{ dictLabel(sys_normal_disable, row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="创建时间" prop="createdAt" min-width="110">
        <template #default="{ row }"><DateCell :value="row.createdAt" /></template>
      </el-table-column>

      <template #actions="{ row }">
        <el-button v-permisaction="['admin:sysPost:edit']" link type="primary" @click="form.openEdit(row)">
          修改
        </el-button>
        <el-button v-permisaction="['admin:sysPost:remove']" link type="danger" @click="remove(row.postId)">
          删除
        </el-button>
      </template>
    </ProTable>

    <el-dialog
      v-model="form.visible"
      :title="form.title"
      width="500px"
      :close-on-click-modal="false"
      @closed="form.reset"
    >
      <el-form
        :ref="form.bindFormRef"
        v-loading="form.loading"
        :model="form.model"
        :rules="form.rules"
        label-width="88px"
      >
        <el-form-item label="岗位名称" prop="postName">
          <el-input v-model="form.model.postName" placeholder="请输入岗位名称" />
        </el-form-item>
        <el-form-item label="岗位编码" prop="postCode">
          <el-input v-model="form.model.postCode" placeholder="请输入编码名称" />
        </el-form-item>
        <el-form-item label="岗位顺序" prop="sort">
          <el-input-number v-model="form.model.sort" controls-position="right" :min="0" />
        </el-form-item>
        <el-form-item label="岗位状态" prop="status">
          <el-radio-group v-model="form.model.status">
            <el-radio
              v-for="item in sys_normal_disable"
              :key="item.value"
              :value="item.value"
            >{{ item.label }}</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="form.model.remark" type="textarea" placeholder="请输入内容" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="form.close">取 消</el-button>
        <el-button type="primary" :loading="form.submitting" @click="form.submit">确 定</el-button>
      </template>
    </el-dialog>
  </PageContainer>
</template>

<script setup lang="ts">
import type { FormRules } from 'element-plus'

import PageContainer from '@/components/PageContainer/index.vue'
import ProTable from '@/components/ProTable/index.vue'
import DateCell from '@/components/DateCell/index.vue'
import { useTable, useForm, useRemove, useDict, useExport, dictLabel } from '@/composables'

import { listPost, getPost, addPost, updatePost, delPost } from '@/api/admin/sys-post'
import type { SysPost, SysPostQuery } from '@/types/admin'

// Must match the menu_name the backend serves, or keep-alive silently misses
defineOptions({ name: 'SysPostManage' })

const { sys_normal_disable } = useDict('sys_normal_disable')

const table = useTable<SysPost, SysPostQuery>({
  api: listPost,
  idKey: 'postId',
  defaultQuery: () => ({ postCode: undefined, postName: undefined, status: undefined })
})

const rules: FormRules = {
  postName: [{ required: true, message: '岗位名称不能为空', trigger: 'blur' }],
  postCode: [{ required: true, message: '岗位编码不能为空', trigger: 'blur' }],
  sort: [{ required: true, message: '岗位顺序不能为空', trigger: 'blur' }]
}

/** Status is a number on the wire and a string in the dictionary; see sys-dept. */
const toPayload = (model: SysPost): SysPost => ({ ...model, status: Number(model.status) as never })

const form = useForm<SysPost, number>({
  defaultModel: () => ({
    postId: undefined,
    postCode: undefined,
    postName: undefined,
    sort: 0,
    status: '1',
    remark: undefined
  }),
  idKey: 'postId',
  rules,
  title: { create: '添加岗位', edit: '修改岗位' },
  api: {
    get: async(id: number) => {
      const response = await getPost(id)
      return { ...response, data: { ...response.data, status: String(response.data?.status ?? '1') }}
    },
    add: model => addPost(toPayload(model)),
    update: model => updatePost(toPayload(model), model.postId as number)
  },
  onSuccess: () => table.getList()
})

const { remove } = useRemove({
  api: ids => delPost({ ids: ids.map(Number) }),
  onSuccess: () => table.getList()
})

const { exportExcel, exporting } = useExport()

const handleExport = () => exportExcel({
  header: ['岗位编号', '岗位编码', '岗位名称', '排序', '创建时间'],
  fields: ['postId', 'postCode', 'postName', 'sort', 'createdAt'],
  rows: table.rows as Array<Record<string, unknown>>,
  filename: '岗位管理'
})
</script>
