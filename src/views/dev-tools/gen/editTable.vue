<template>
  <div class="app-container">
    <a-form :model="dataInfo" :rules="rules" ref="modalFormRef" auto-label-width size="mini">
      <a-card bordered>
        <!-- 卡片插槽 开始 -->
        <template #actions>
          <a-button type="primary" @click="handleSubmit" long>提交</a-button>
          <a-button type="primary" @click="close" long>返回</a-button>
        </template>
        <!-- 卡片插槽 结束 -->
        <a-tabs default-active-key="2">
          <a-tab-pane key="1" title="基本信息">
            <a-row :gutter="24">
              <a-col :span="12">
                <a-form-item field="tableName">
                  <template #label>
                    数据表名称
                    <a-tooltip content="数据库表名称，针对gorm对应的table()使用，⚠️这里必须是蛇形结构">
                      <icon-question-circle-fill />
                    </a-tooltip>
                  </template>
                  <a-input v-model="dataInfo.tableName" placeholder="请输入表名称" />
                </a-form-item>
              </a-col>
              <a-col :span="12">
                <a-form-item field="tableComment">
                  <template #label>
                    菜单名称
                    <a-tooltip content="同步的数据库表名称，生成配置数据时，用作菜单名称">
                      <icon-question-circle-fill />
                    </a-tooltip>
                  </template>
                  <a-input v-model="dataInfo.tableComment" placeholder="请输入菜单名称" />
                </a-form-item>
              </a-col>
              <a-col :span="12">
                <a-form-item field="className">
                  <template #label>
                    结构体模型名称
                    <a-tooltip content="结构体模型名称，代码中的struct名称定义使用">
                      <icon-question-circle-fill />
                    </a-tooltip>
                  </template>
                  <a-input v-model="dataInfo.className" placeholder="请输入" />
                </a-form-item>
              </a-col>
              <a-col :span="12">
                <a-form-item field="functionAuthor" label="作者名称">
                  <a-input v-model="dataInfo.functionAuthor" placeholder="请输入作者名称" />
                </a-form-item>
              </a-col>
              <a-col :span="24">
                <a-form-item field="remark" label="备注">
                  <a-textarea v-model="dataInfo.remark" placeholder="请输入备注" />
                </a-form-item>
              </a-col>
            </a-row>
          </a-tab-pane>

          <a-tab-pane key="2" title="字段信息">
            <a-alert type="warning" style="margin-bottom: 16px;">表字段中的id、create_by、update_by、created_at、updated_at、deleted_at的字段在此列表中已经隐藏.</a-alert>
            <a-table  :data="tableData" :virtual-list-props="{height:600}" :pagination="false" :scroll="{x: '100%'}">
              <template #columns>
                <!-- <a-table-column title="序号" data-index="tableId" :width="180" ellipsis tooltip/> -->
                <a-table-column title="字段列名" data-index="columnName"/>
                <a-table-column title="字段描述" :width="120">
                  <template #cell="{ record }">
                    <a-input v-model="record.columnComment" />
                  </template>
                </a-table-column>
                <a-table-column title="物理类型" data-index="columnType"  align="center"  :width="120" />
                <a-table-column title="go类型"  align="center"  :width="140">
                  <template #cell="{ record }">
                    <a-select v-model="record.goType" placeholder="请选择 ...">
                      <a-option value="int64">int64</a-option>
                      <a-option value="string">string</a-option>
                    </a-select>
                  </template>
                </a-table-column>
                <a-table-column title="go属性"  align="center" >
                  <template #cell="{ record }">
                    <a-input v-model="record.goField"/>
                  </template>
                </a-table-column>
                <a-table-column title="json属性"  align="center"  >
                  <template #cell="{ record }">
                    <a-input v-model="record.jsonField"/>
                  </template>
                </a-table-column>
                <a-table-column title="编辑" align="center" :width="60">
                  <template #cell="{ record }">
                    <a-switch v-model="record.isInsert" type="large" checked-value="1" unchecked-value="0">
                      <template #checked-icon>
                        <icon-check/>
                      </template>
                      <template #unchecked-icon>
                        <icon-close/>
                      </template>
                    </a-switch>
                  </template>
                </a-table-column>
                <a-table-column title="列表" align="center" :width="60">
                  <template #cell="{ record }">
                    <a-switch v-model="record.isList" type="large" checked-value="1" unchecked-value="0">
                      <template #checked-icon>
                        <icon-check/>
                      </template>
                      <template #unchecked-icon>
                        <icon-close/>
                      </template>
                    </a-switch>
                  </template>
                </a-table-column>
                <a-table-column title="查询" align="center" :width="60">
                  <template #cell="{ record }">
                    <a-switch v-model="record.isQuery" type="large" checked-value="1" unchecked-value="0">
                      <template #checked-icon>
                        <icon-check/>
                      </template>
                      <template #unchecked-icon>
                        <icon-close/>
                      </template>
                    </a-switch>
                  </template>
                </a-table-column>
                <a-table-column title="查询方式" :width="90">
                  <template #cell="{ record }">
                    <a-select v-model="record.queryType" placeholder="请选择 ...">
                      <a-option label="=" value="EQ" />
                      <a-option label="!=" value="NE" />
                      <a-option label=">" value="GT" />
                      <a-option label=">=" value="GTE" />
                      <a-option label="<" value="LT" />
                      <a-option label="<=" value="LTE" />
                      <a-option label="LIKE" value="LIKE" />
                    </a-select>
                  </template>
                </a-table-column>
                <a-table-column title="必填" :width="70">
                  <template #cell="{ record }">
                    <!-- <a-checkbox v-model="record.isRequired"/> -->
                    <a-switch v-model="record.isRequired" type="large" checked-value="1" unchecked-value="0">
                      <template #checked-icon>
                        <icon-check/>
                      </template>
                      <template #unchecked-icon>
                        <icon-close/>
                      </template>
                    </a-switch>
                  </template>
                </a-table-column>
                <a-table-column title="显示类型" :width="140">
                  <template #cell="{ record }">
                    <a-select v-model="record.htmlType" placeholder="请选择 ...">
                      <a-option value="input">文本框</a-option>
                      <a-option value="select">下拉框</a-option>
                      <a-option value="radio">单选框</a-option>
                      <a-option value="textarea">文本域</a-option>
                    </a-select>
                  </template>
                </a-table-column>
                <a-table-column title="字典类型">
                  <template #cell="{ record }">
                    <a-select v-model="record.dictType" allow-clear allow-search placeholder="请选择">
                      <a-option v-for="dict in dictOptions" :key="dict.dictType" :label="dict.dictName" :value="dict.dictType" >
                        <a-descriptions :column="1" size="mini">
                          <a-descriptions-item :label="dict.dictName">
                          {{ dict.dictType }}
                          </a-descriptions-item>
                        </a-descriptions>
                      </a-option>
                    </a-select>
                  </template>
                </a-table-column>
                <a-table-column title="关系表">
                  <template #cell="{ record }">
                    <a-select v-model="record.fkTableName" allow-clear allow-search placeholder="请选择" @change="handleChangeConfig(record)">
                      <a-option v-for="table in tableTree" :key="table.tableName" :label="table.tableName" :value="table.tableName">
                        <span style="float: left; margin-right: 5px; font-size: 12px;">{{ table.tableName }}</span>
                        <span style="float: right; color: #8492a6; font-size: 13px">{{ table.tableComment }}</span>
                      </a-option>
                    </a-select>
                  </template>
                </a-table-column>
                <a-table-column title="关系表key">
                  <template #cell="{ record }">
                    <a-select v-model="record.fkLabelId" allow-clear allow-search placeholder="请选择">
                      <a-option v-for="column in record.fkCol" :key="column.columnName" :label="column.columnName" :value="column.jsonField">
                        <span style="float: left; margin-right: 5px; font-size: 12px;">{{ column.jsonField }}</span>
                        <span style="float: right; color: #8492a6; font-size: 12px;">{{ column.columnComment }}</span>
                      </a-option>
                    </a-select>
                  </template>
                </a-table-column>
                <a-table-column title="关系表value">
                  <template #cell="{ record }">
                    <a-select v-model="record.fkLabelName" allow-clear allow-search placeholder="请选择">
                      <a-option v-for="column in record.fkCol" :key="column.columnName" :label="column.columnName" :value="column.jsonField">
                        <span style="float: left; margin-right: 5px; font-size: 12px;">{{ column.jsonField }}</span>
                        <span style="float: right; color: #8492a6; font-size: 13px">{{ column.columnComment }}</span>
                      </a-option>
                    </a-select>
                  </template>
                </a-table-column>
              </template>
            </a-table>
          </a-tab-pane>

          <a-tab-pane key="3" title="生成信息">
            <a-row :gutter="24">
              <a-col :span="12">
                <a-form-item field="tplCategory" label="生成模板">
                  <a-select v-model="dataInfo.tplCategory">
                    <a-option label="关系表（增删改查）" value="crud" />
                  </a-select>
                </a-form-item>
              </a-col>
              <a-col :span="12">
                <a-form-item field="packageName">
                  <template #label>
                    应用名
                    <a-tooltip content="应用名，例如：在app文件夹下将该功能发到那个应用中，默认：admin">
                      <icon-question-circle-fill />
                    </a-tooltip>
                  </template>
                  <a-input v-model="dataInfo.packageName" placeholder="请输入应用名" />
                </a-form-item>
              </a-col>
              <a-col :span="12">
                <a-form-item field="businessName">
                  <template #label>
                    业务名
                    <a-tooltip content="可理解为功能英文名，例如 user">
                      <icon-question-circle-fill />
                    </a-tooltip>
                  </template>
                  <a-input v-model="dataInfo.businessName" placeholder="请输入业务名" />
                </a-form-item>
              </a-col>
              <a-col :span="12">
                <a-form-item field="functionName" label="功能描述">
                  <template #label>
                    功能描述
                    <a-tooltip content="同步的数据库表备注，用作类描述，例如：用户">
                      <icon-question-circle-fill />
                    </a-tooltip>
                  </template>
                  <a-input v-model="dataInfo.functionName" placeholder="请输入功能描述" />
                </a-form-item>
              </a-col>
              <a-col :span="12">
                <a-form-item field="moduleName">
                  <template #label>
                    接口路径
                    <a-tooltip content="接口路径，例如：api/v1/{sys-user}">
                      <icon-question-circle-fill />
                    </a-tooltip>
                  </template>
                  <a-input v-model="dataInfo.moduleName" placeholder="请输入接口路径" >
                    <template #prepend>api/{version}/</template>
                  </a-input>
                </a-form-item>
              </a-col>
            </a-row>
          </a-tab-pane>
        </a-tabs>
      </a-card>
    </a-form>
  </div>
</template>
  
<script setup>
import { reactive, ref, getCurrentInstance, onMounted, unref } from 'vue';
import { optionselect as getDictOptionselect } from '@/api/admin/sys-dict'
import { getGenTable, updateGenTable, getTableTree } from '@/api/tools/gen';

const { proxy } = getCurrentInstance();

// Rules
const rules = {
  tableName: [
    { required: true, message: '请输入表名称' },
    { match: /^[a-z\._]*$/g, message: '只允许小写字母,例如 sys_demo 格式'}
  ],
  tableComment: [
    { required: true, message: '请输入菜单名称' },
  ],
  className: [
    { required: true, message: '请输入模型名称' },
    { match: /^[A-Z][A-z0-9]*$/g, message: '只允许小写字母,例如 sys_demo 格式'}
  ],
  functionAuthor: [
    { required: true, message: '请输入作者' },
    { match: /^[A-Za-z]+$/, message: '必须以大写字母开头,例如 SysDemo 格式'}
  ],
  tplCategory: [
    { required: true, message: '请选择生成模板' },
  ],
  packageName: [
    { required: true, message: '请输入生成包路径' },
  ],
  moduleName: [
    { required: true, message: '请输入生成模块名' },
    { match: /^[a-z\-]*[a-z]$/g, message: '只允许小写字母,例如 sys-demo 格式'}
  ],
  businessName: [
    { required: true, message: '请输入生成业务名' },
    { match: /^[a-z][A-Za-z]+$/, message: '校验规则:  只允许输入字母 a-z 或大写 A-Z ，并且小写字母开头'}
  ],
  functionName: [
    { required: true, message: '请输入生成功能名' },
  ],
}

// 字符串转布尔类型
const stringToBool = (value) => {
  if (value == "1") {
    return true
  } else {
    return false
  }
}

// 表详细信息
const dataInfo = ref({})
// 默认表格内容
const tableData = ref([]);
// 获取 服务数据
const getGenTableQuery = async (params = {}) => {
  const res = await getGenTable(params);
  tableData.value = res.data.list;
  // 编辑 isInsert
  // 列表 isList
  // 查询 isQuery
  // 必填 isRequired
  dataInfo.value = res.data.info;
};


// 接收数据库表树
const tableTree = ref([]);
// 获取数据库表树
const getTableTreeQuery = async (params = {}) => {
  getTableTree().then(response => {
    tableTree.value = response.data
    tableTree.value.unshift({ tableId: 0, className: '请选择' })
  })
};
// 关系表
const handleChangeConfig = (row) => {
  tableTree.value.filter(function(item) {
    if (item.tableName === row.fkTableName) {
      row.fkCol = item.columns
    }
  })
}


// 字典类型列表
const dictOptions = ref([]);
// 查询字典下拉列表
const getDictOption = async () => {
  const res =await getDictOptionselect();
  dictOptions.value = res.data
};


const modalFormRef = ref(null);
// handleSubmit 修改按钮方法 20221101
const handleSubmit = () => {
  const genTable = Object.assign({}, dataInfo.value)
  genTable.columns = tableData.value
  genTable.params = {
    treeCode: genTable.treeCode,
    treeName: genTable.treeName,
    treeParentCode: genTable.treeParentCode
  }

  proxy.$refs.modalFormRef.validate(async (valid) => {
    if (!valid) {
      const { code, msg } = await updateGenTable(genTable);
      if (code == 200 ) {
        proxy.$notification.success('修改成功');
      } else {
        proxy.$notification.error(msg);
      }
      // 成功调用关闭方法
      close()
    } else {
      proxy.$message.error('表单校验失败');
    }
  });
};

/** 关闭按钮 */
const close = () => {
  proxy.$router.push({ path: '/dev-tools/gen', query: { t: Date.now() }})
}

onMounted(() => {
  const { tableId } = proxy.$route.query
  getGenTableQuery(tableId);
  getTableTreeQuery()
  getDictOption()
});

</script>

<style lang="scss">
</style>
