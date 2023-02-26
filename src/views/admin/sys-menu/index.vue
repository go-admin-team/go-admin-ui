<template>
  <div class="app-container">
    <a-form :model="queryForm" ref="queryFormRef" layout="inline">
      <a-form-item field="menuName" label="菜单名称">
        <a-input v-model="queryForm.menuName" placeholder="请输入菜单名称" />
      </a-form-item>
      <a-form-item field="visible" label="状态">
        <a-select v-model="queryForm.visible" placeholder="请选择菜单状态">
          <a-option value="0">显示</a-option>
          <a-option value="1">隐藏</a-option>
        </a-select>
      </a-form-item>
      <a-form-item>
        <a-space>
          <a-button v-has="'admin:sysMenu:query'" type="primary" @click="handleQuery">搜索</a-button>
          <a-button @click="$refs.queryFormRef.resetFields()">重置</a-button>
        </a-space>
      </a-form-item>
    </a-form>

    <a-divider />

    <!-- action -->
    <div class="action">
      <a-space>
        <a-button v-has="'admin:sysMenu:add'" type="primary" @click="handleAddMenu">新增菜单</a-button>
      </a-space>
    </div>

    <!-- table -->
    <a-table :columns="columns" :data="tableData" row-key="menuId">
      <template #icon="{ record }">
        <component :is="record.icon" :style="{ fontSize: '18px' }"></component>
      </template>
      <template #menutype="{ record }">
        <span v-if="record.menuType === 'M'">目录</span>
        <span v-else-if="record.menuType === 'C'">菜单</span>
        <span v-else-if="record.menuType === 'F'">按钮</span>
      </template>
      <template #visible="{ record }">
        <a-tag v-if="record.visible == 0" color="green">显示</a-tag>
        <a-tag v-else color="red">隐藏</a-tag>
      </template>
      <template #action="{ record }">
        <a-button v-has="'admin:sysMenu:add'" type="text" @click="handleAddMenu(record.menuId)">新增</a-button>
        <a-button v-has="'admin:sysMenu:edit'" type="text" @click="handleUpdate(record)">修改</a-button>
        <a-button v-has="'admin:sysMenu:remove'" type="text" @click="() => { deleteVisible = true; deleteData = [record.menuId];  }">删除</a-button>
      </template>
    </a-table>

    <!-- modal -->
    <a-modal
      v-model:visible="modalVisible"
      :title="modalTitle"
      title-align="start"
      :width="800"
      modal-class="menu-modal"
      @before-ok="handleSubmit"
      @close="() => proxy.$refs.modalFormRef.resetFields()"
    >
      <a-form
        :model="modalForm"
        :rules="modalRules"
        ref="modalFormRef"
        auto-label-width
      >
        <a-form-item field="menuType" label="菜单类型">
          <a-radio-group v-model="modalForm.menuType">
            <a-radio value="M">目录</a-radio>
            <a-radio value="C">菜单</a-radio>
            <a-radio value="F">按钮</a-radio>
          </a-radio-group>
        </a-form-item>
        <a-row :gutter="24">
          <a-col :span="12">
            <a-form-item field="parentId" label="上级菜单">
              <a-tree-select
                v-model="modalForm.parentId"
                :data="selectTreeData"
                :field-names="{ key: 'menuId', icon: '_' }"
                :allow-search="true"
                :filter-tree-node="filterTreeNode"
                placeholder="请选择上级菜单"
              />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item field="title" label="菜单标题">
              <a-input v-model="modalForm.title" placeholder="请输入菜单标题" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="24">
          <a-col :span="12">
            <a-form-item field="icon" label="菜单图标">
              <a-select
                v-model="modalForm.icon"
                :options="parseIconName"
                :field-names="{ name: 'value' }"
                :trigger-props="{ contentClass: 'iconselect-trigger' }"
                allow-search
                placeholder="请选择菜单图标"
              >
                <template #option="{ data }">
                  <component :is="data.value" />
                </template>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item field="sort" label="显示排序">
              <a-input-number v-model="modalForm.sort" mode="button" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="24">
          <a-col :span="12" v-if="modalForm.menuType !== 'F'">
            <a-form-item field="menuName" label="路由名称">
              <a-input
                v-model="modalForm.menuName"
                placeholder="请输入路由名称"
              />
            </a-form-item>
          </a-col>
          <a-col :span="12" v-if="modalForm.menuType !== 'F'">
            <a-form-item field="component" label="组件名称">
              <a-input
                v-model="modalForm.component"
                placeholder="请输入组件名称"
              />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="24">
          <a-col :span="12" v-if="modalForm.menuType !== 'F'">
            <a-form-item field="path" label="路由地址">
              <a-input v-model="modalForm.path" placeholder="请输入路由地址" />
            </a-form-item>
          </a-col>
          <a-col
            :span="12"
            v-if="modalForm.menuType === 'C' || modalForm.menuType === 'F'"
          >
            <a-form-item field="permission" label="权限标识">
              <a-input
                v-model="modalForm.permission"
                placeholder="请输入权限标识"
              />
            </a-form-item>
          </a-col>
        </a-row>
        <a-form-item
          field="isFrame"
          label="是否外链"
          v-if="modalForm.menuType !== 'F'"
        >
          <a-radio-group v-model="modalForm.isFrame">
            <a-radio value="0">是</a-radio>
            <a-radio value="1">否</a-radio>
          </a-radio-group>
        </a-form-item>
        <a-form-item
          field="visible"
          label="菜单状态"
          v-if="modalForm.menuType !== 'F'"
        >
          <a-radio-group v-model="modalForm.visible">
            <a-radio value="0">显示</a-radio>
            <a-radio value="1">隐藏</a-radio>
          </a-radio-group>
        </a-form-item>
        <a-form-item
          field="apis"
          label="API权限"
          v-if="modalForm.menuType !== 'M'"
        >
          <a-transfer
            v-model:model-value="modalForm.apis"
            :data="transferData"
            :title="['未授权', '已授权']"
            show-search
          ></a-transfer>
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- Akiraka 20230223 删除与批量删除 开始 -->
    <DeleteModal 
      :data="deleteData" 
      :visible="deleteVisible" 
      :apiDelete="removeMenu" 
      @deleteVisibleChange="() => deleteVisible = false"
    />
    <!-- Akiraka 20230223 删除与批量删除 结束 -->
  </div>
</template>

<script setup>
import { onMounted, reactive, ref, getCurrentInstance, computed, watch } from 'vue';
import * as ArcoIconModules from '@arco-design/web-vue/es/icon';
import { getMenu } from '@/api/admin/menu';
import { getSysApi } from '@/api/admin/sys-api';
import { addMenu, removeMenu, updateMenu, getMenuDetails } from '@/api/admin/menu';

// Akiraka 20230210 删除数据
const deleteData = ref([])
// Akiraka 20230210 删除对话框
const deleteVisible = ref(false)
// Akiraka 20230210 监听删除事件
watch(() => deleteVisible.value ,(value) => {
  if ( value == false ) {
    getSysMenuInfo(queryForm);
  }
})

const { proxy } = getCurrentInstance();

const { queryForm, handleQuery } = useQueryData();

// QueryModel
function useQueryData() {
  const queryForm = reactive({});

  const handleQuery = () => {
    getSysMenuInfo(queryForm);
  };

  return {
    queryForm,
    handleQuery,
  };
}

// from
const modalForm = reactive({
  menuType: 'M',
  sort: 0,
  isFrame: '1',
  visible: '0',
});

// rules
const modalRules = {
  menuName: [{ required: true, message: '请输入菜单标题' }],
};

// Table
const columns = [
  { title: '菜单名称', dataIndex: 'title' },
  { title: '图标', dataIndex: 'icon', slotName: 'icon' },
  { title: '组件路径', dataIndex: 'component' },
  { title: '路由路径', dataIndex: 'path' },
  { title: '排序', dataIndex: 'sort' },
  { title: '类型', dataIndex: 'menuType', slotName: 'menutype' },
  { title: '显示状态', dataIndex: 'visible', slotName: 'visible' },
  { title: '操作', slotName: 'action' },
];
const tableData = ref([]);

const selectTreeData = ref([]);

// Transfer Data
const transferData = ref([]);

// Modal
const modalVisible = ref(false);
const modalTitle = ref('默认标题');

// 创建新菜单
const handleAddMenu = (parentId = null) => {
  modalVisible.value = true;
  modalTitle.value = '新增菜单';

  if (parentId) modalForm.parentId = parentId;
};

// TreeSearchFilter
const filterTreeNode = (searchVal, nodeData) => {
  return nodeData.title.indexOf(searchVal) > -1;
};

// 修改菜单
const handleUpdate = async (record) => {
  const res = await getMenuDetails(record.menuId);
  Object.assign(modalForm, res.data);
  
  modalTitle.value = '修改菜单';
  modalVisible.value = true;
};

// Submit
const handleSubmit = (done) => {
  proxy.$refs.modalFormRef.validate(async (err) => {
    if (!err) {
      let res;
      if (Reflect.has(modalForm, 'menuId')) {
        res = await updateMenu(modalForm, modalForm.menuId);
      } else {
        res = await addMenu(modalForm);
      }
      proxy.$message.success(res.msg);
      done();
      getSysMenuInfo();
    } else {
      proxy.$message.error('表单校验失败请检查');
      done(false);
    }
  });
};

// 获取菜单信息
const getSysMenuInfo = async (params = {}) => {
  const res = await getMenu(params);
  tableData.value = res.data;
  selectTreeData.value = [{"title": "根", "menuId": 0, "parentId": 0, children: res.data}]
};

// 获取API接口信息
const getSysApiInfo = async () => {
  const res = await getSysApi({ pageSize: 10000, type: 'BUS' });
  transferData.value = res.data.list.map((item) => {
    return { value: item.id, label: item.title };
  });
};

// 转换Icon Object 为 list
const parseIconName = computed(() => {
  const iconNameList = [];

  for (let key in ArcoIconModules) {
    if (ArcoIconModules[key].name) {
      iconNameList.push({ value: ArcoIconModules[key].name });
    }
  }

  return iconNameList;
});

onMounted(() => {
  getSysMenuInfo();
  getSysApiInfo();
});
</script>

<style lang="scss">
.action {
  margin-bottom: 12px;
}

// 覆盖默认 select trigger 样式
.iconselect-trigger .arco-select-dropdown-list {
  display: flex;
  flex-wrap: wrap;
}

.iconselect-trigger .arco-select-option {
  width: auto;
}

// 覆盖默认穿梭框样式
.menu-modal {
  .arco-transfer-view {
    height: 350px;
    width: 250px;
  }
}
</style>
