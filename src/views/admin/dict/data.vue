<template>
  <div class="container">
    <a-card :bordered="false" class="cardStyle" style="margin-bottom: 16px;">
      <a-list-item-meta>
        <template #title>
          <div class="akaInfoTitle">字典管理</div>
        </template>
        <template #description>
          <div class="akaInfoDesc">管理数据绑定字典</div>
        </template>
        <template #avatar>
          <div style="border-radius: 100px 0 100px 100px; background-color: #eff4f9; padding: 6px;">
            <Iconify icon="fluent-mdl2:dictionary" style="color: black;" width="48" height="48" />
          </div>
        </template>
      </a-list-item-meta>
      <a-divider />
      <a-card-meta>
        <template #avatar>
          <a-form :model="queryForm" layout="inline">
            <a-form-item field="dictType" label="字典名称">
              <a-select v-model="queryForm.dictType" :options="dictTypeOptions" :field-names="{ value: 'dictType', label: 'dictName' }" />
            </a-form-item>
            <a-form-item field="dictTag" label="字典标签">
              <a-input v-model="queryForm.dictTag" placeholder="请输入字典标签" />
            </a-form-item>
            <a-form-item field="status" label="字典状态">
              <a-select v-model="queryForm.status" placeholder="请选择字典状态">
                <a-option :value="2">正常</a-option>
                <a-option :value="1">关闭</a-option>
              </a-select>
            </a-form-item>
            <a-form-item>
              <a-space>
                <a-button v-has="'admin:sysDictData:query'" type="primary">搜索</a-button>
                <a-button>重置</a-button>
              </a-space>
            </a-form-item>
          </a-form>
        </template>
      </a-card-meta>
      <template #actions>
        <a-space class="action">
          <a-button v-has="'admin:sysDictData:add'" type="primary" @click="handleAdd">新增</a-button>
        </a-space>
      </template>
    </a-card>

    <a-card :bordered="false" class="cardStyle">
      <a-table
        :data="tableData"
        :columns="columns"
        :pagination="{ 'show-total': true, 'show-jumper': true, 'show-page-size': true, total: pager.count, current: currentPage }"
        @page-change="handlePageChange"
      >
        <template #createdAt="{ record }">
          {{ parseTime(record.createdAt) }}
        </template>

        <template #action="{ record }">
          <a-button v-has="'admin:sysDictData:edit'" type="text" @click="handleEdit(record)">修改</a-button>
          <a-button v-has="'admin:sysDictData:remove'" type="text" @click="() => { deleteVisible = true; deleteData = [record.dictCode];  }">删除</a-button>
        </template>

        <template #status="{ record }">
          <a-tag v-if="record.status == 2" color="green">正常</a-tag>
          <a-tag v-else-if="record.status == 1" color="red">停用</a-tag>
        </template>
      </a-table>
    </a-card>

    <a-modal
      v-model:visible="modalVisible"
      :title="modalTitle"
      title-align="start"
      @close="$refs.modalFormRef.resetFields()"
      @before-ok="handleBeforeOk"
      @ok="handleSubmit"
    >
      <a-form :model="modalForm" :rules="rules" ref="modalFormRef">
        <a-form-item field="dictType" label="字典类型">
          <a-input v-model="modalForm.dictType" disabled></a-input>
        </a-form-item>
        <a-form-item field="dictLabel" label="数据标签">
          <a-input
            v-model="modalForm.dictLabel"
            placeholder="请输入数据标签"
          ></a-input>
        </a-form-item>
        <a-form-item field="dictValue" label="数据键值">
          <a-input
            v-model="modalForm.dictValue"
            placeholder="请输入数据键值"
          ></a-input>
        </a-form-item>
        <a-form-item field="dictSort" label="显示排序">
          <a-input-number
            v-model="modalForm.dictSort"
            :default-value="0"
            mode="button"
          ></a-input-number>
        </a-form-item>
        <a-form-item field="status" label="状态">
          <a-radio-group v-model="modalForm.status">
            <a-radio :value="2">正常</a-radio>
            <a-radio :value="1">停用</a-radio>
          </a-radio-group>
        </a-form-item>
        <a-form-item field="remark" label="备注">
          <a-textarea v-model="modalForm.remark"></a-textarea>
        </a-form-item>
      </a-form>
    </a-modal>
    <!-- Akiraka 20230223 删除与批量删除 开始 -->
    <DeleteModal 
      :data="deleteData" 
      :visible="deleteVisible" 
      :apiDelete="deleteDictData" 
      @deleteVisibleChange="() => deleteVisible = false"
    />
    <!-- Akiraka 20230223 删除与批量删除 结束 -->
  </div>
</template>

<script setup>
import { reactive, ref, getCurrentInstance, onBeforeMount, watch } from 'vue';
import { getDictData, addDictData, updateDictData, deleteDictData } from '@/api/admin/sys-dict-data';
import { getDictType } from '@/api/admin/sys-dict';
import {IconLoop, IconSearch} from "@arco-design/web-vue/es/icon";

// Akiraka 20230210 删除数据
const deleteData = ref([])
// Akiraka 20230210 删除对话框
const deleteVisible = ref(false)
// Akiraka 20230210 监听删除事件
watch(() => deleteVisible.value ,(value) => {
  if ( value === false ) {
    getDictDataInfo({...proxy.$route.params, ...pager});
  }
})


const { proxy } = getCurrentInstance();

// 当前页码
const currentPage = ref(1);

// 分页
const pager = {
  count: 0,
  pageIndex: 1,
  pageSize: 10,
};

// Rules
const rules = {
  dictLabel: [{ required: true, message: '请输入数据标签' }],
  dictValue: [{ required: true, message: '请输入数据键值' }],
  dictSort: [{ required: true, message: '请选择排序' }],
};

// Modal
const modalVisible = ref(false);
const modalTitle = ref('默认标题');

// DictType Options
const dictTypeOptions = ref([]);

// 搜索表单
const queryForm = reactive({});

// Modal表单
const modalForm = reactive({
  status: 2
});

// 表格
const tableData = ref([]);
const columns = [
  { title: '字典编码', dataIndex: 'dictCode' },
  { title: '字典标签', dataIndex: 'dictLabel' },
  { title: '字典键值', dataIndex: 'dictValue' },
  { title: '字典排序', dataIndex: 'dictSort' },
  { title: '状态', dataIndex: 'status', slotName: 'status' },
  { title: '备注', dataIndex: 'remark' },
  { title: '创建时间', dataIndex: 'createdAt', slotName: 'createdAt' },
  { title: '操作', dataIndex: 'action', slotName: 'action' },
];

// 新增字典数据
const handleAdd = () => {
  modalVisible.value = true;
  modalTitle.value = '新增字典数据';

  Object.assign(modalForm, proxy.$route.params);
};

// 修改字典数据
const handleEdit = (record) => {
  modalVisible.value = true;
  modalTitle.value = '修改字典数据';

  Object.assign(modalForm, proxy.$route.params, record);
  console.log(modalForm)
};

// 提交表单前检查
const handleBeforeOk = (done) => {
  proxy.$refs.modalFormRef.validate((err) => {
    if (err) {
      proxy.$message.error('表单校验失败');
      done(false);
    } else {
      done();
    }
  })
}

// 提交表单
const handleSubmit = async () => {
  if (modalForm.dictCode) {
    const { code, msg } = await updateDictData(modalForm, modalForm.dictCode);
    if ( code === 200 ) {
      proxy.$notification.success('修改成功');
    } else {
      proxy.$notification.error(msg);
    }
  } else {
    const { code, msg } = await addDictData(modalForm);
    if (code === 200 ) {
      proxy.$notification.success('新增成功');
    } else {
      proxy.$notification.error(msg);
    }
  }
  getDictDataInfo({...proxy.$route.params, ...pager});
}

// 页码改变
const handlePageChange = (pagerIndex) => {
  currentPage.value = pagerIndex;
  pager.pageIndex = pagerIndex;
  getDictDataInfo({...proxy.$route.params, ...pager});
}

// 获取字典数据
const getDictDataInfo = async (params = {}) => {
  const { data, code, msg } = await getDictData(params);
  if ( code === 200 ) {
    tableData.value = data.list;
    Object.assign(pager, { count: data.count, pageIndex: data.pageIndex, pageSize: data.pageSize });
  } else {
    proxy.$notification.error(msg);
  }
};

// 获取字典类型
const getDictTypeInfo = async () => {
  const res = await getDictType({ pageSize: 1000 });

  dictTypeOptions.value = res.data.list;
  Object.assign(queryForm, proxy.$route.params);
};

onBeforeMount(() => {
  getDictDataInfo(proxy.$route.params);
  getDictTypeInfo();
});
</script>

<style lang="scss" scoped>
.table-action {
  margin-bottom: 12px;
}
</style>
