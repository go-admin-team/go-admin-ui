<template>
  <el-card>
    <el-tabs v-model="activeName">
      <el-tab-pane label="基本信息" name="basic">
        <basic-info-form ref="basicInfo" :info="info" />
      </el-tab-pane>
      <el-tab-pane label="字段信息" name="cloum">
        <el-alert
          title="⚠️表字段中的id、create_by、update_by、created_at、updated_at、deleted_at的字段在此列表中已经隐藏"
          type="warning"
          show-icon
        />
        <el-table :data="columns" :max-height="tableHeight" style="width: 100%">
          <el-table-column fixed label="序号" type="index" width="50" />
          <el-table-column
            fixed
            label="字段列名"
            prop="columnName"
            width="150"
            :show-overflow-tooltip="true"
          />
          <el-table-column fixed label="字段描述" width="150">
            <template slot-scope="scope">
              <el-input v-model="scope.row.columnComment" />
            </template>
          </el-table-column>
          <el-table-column
            label="物理类型"
            prop="columnType"
            width="120"
            :show-overflow-tooltip="true"
          />
          <el-table-column label="go类型" width="120">
            <template slot-scope="scope">
              <el-select v-model="scope.row.goType">
                <el-option label="int64" value="int64" />
                <el-option label="string" value="string" />
                <!-- <el-option label="int" value="int" />
                <el-option label="bool" value="bool" /> -->
              </el-select>
            </template>
          </el-table-column>
          <el-table-column label="go属性" width="150">
            <template slot-scope="scope">
              <el-input v-model="scope.row.goField" />
            </template>
          </el-table-column>
          <el-table-column label="json属性" width="150">
            <template slot-scope="scope">
              <el-input v-model="scope.row.jsonField" />
            </template>
          </el-table-column>

          <el-table-column label="编辑" width="50">
            <template slot-scope="scope">
              <el-checkbox v-model="scope.row.isInsert" true-label="1" false-label="0" />
            </template>
          </el-table-column>
          <!-- <el-table-column label="编辑" width="70" :render-header="renderHeadeUpdate" :cell-style="{'text-align':'center'}">
            <template slot-scope="scope">
              <el-checkbox v-model="scope.row.isEdit" true-label="1" false-label="0" />
            </template>
          </el-table-column> -->
          <el-table-column label="列表" width="70" :render-header="renderHeadeList" :cell-style="{'text-align':'center'}">
            <template slot-scope="scope">
              <el-checkbox v-model="scope.row.isList" true-label="1" false-label="0" />
            </template>
          </el-table-column>
          <el-table-column label="查询" width="70" :render-header="renderHeadeSearch" :cell-style="{'text-align':'center'}">
            <template slot-scope="scope">
              <el-checkbox v-model="scope.row.isQuery" true-label="1" false-label="0" />
            </template>
          </el-table-column>
          <el-table-column label="查询方式" width="120">
            <template slot-scope="scope">
              <el-select v-model="scope.row.queryType">
                <el-option label="=" value="EQ" />
                <el-option label="!=" value="NE" />
                <el-option label=">" value="GT" />
                <el-option label=">=" value="GTE" />
                <el-option label="<" value="LT" />
                <el-option label="<=" value="LTE" />
                <el-option label="LIKE" value="LIKE" />
                <!-- <el-option label="BETWEEN" value="BETWEEN" /> -->
              </el-select>
            </template>
          </el-table-column>
          <el-table-column label="必填" width="50">
            <template slot-scope="scope">
              <el-checkbox v-model="scope.row.isRequired" true-label="1" />
            </template>
          </el-table-column>
          <el-table-column label="显示类型" width="140">
            <template slot-scope="scope">
              <el-select v-model="scope.row.htmlType">
                <el-option label="文本框" value="input" />
                <el-option label="下拉框" value="select" />
                <el-option label="单选框" value="radio" />
                <!-- <el-option label="文件选择" value="file" /> -->
                <!-- <el-option label="复选框" value="checkbox" />
                <el-option label="日期控件" value="datetime" />-->
                <el-option label="文本域" value="textarea" />

              </el-select>
            </template>
          </el-table-column>
          <el-table-column label="字典类型" width="160">
            <template slot-scope="scope">
              <el-select v-model="scope.row.dictType" clearable filterable placeholder="请选择">
                <el-option
                  v-for="dict in dictOptions"
                  :key="dict.dictType"
                  :label="dict.dictName"
                  :value="dict.dictType"
                >
                  <span style="float: left">{{ dict.dictName }}</span>
                  <span style="float: right; color: #8492a6; font-size: 13px">{{ dict.dictType }}</span>
                </el-option>
              </el-select>
            </template>
          </el-table-column>
          <el-table-column label="关系表" width="160">
            <template slot-scope="scope">
              <el-select v-model="scope.row.fkTableName" clearable filterable placeholder="请选择" @change="handleChangeConfig(scope.row,scope.$index)">
                <el-option
                  v-for="table in tableTree"
                  :key="table.tableName"
                  :label="table.tableName"
                  :value="table.tableName"
                >
                  <span style="float: left">{{ table.tableName }}</span>
                  <span style="float: right; color: #8492a6; font-size: 13px">{{ table.tableComment }}</span>
                </el-option>
              </el-select>
            </template>
          </el-table-column>
          <el-table-column label="关系表key" width="150">
            <template slot-scope="scope">
              <el-select v-model="scope.row.fkLabelId" clearable filterable placeholder="请选择">
                <el-option
                  v-for="column in scope.row.fkCol"
                  :key="column.columnName"
                  :label="column.columnName"
                  :value="column.jsonField"
                >
                  <span style="float: left">{{ column.jsonField }}</span>
                  <span style="float: right; color: #8492a6; font-size: 13px">{{ column.columnComment }}</span>
                </el-option>
              </el-select>
            </template>
          </el-table-column>
          <el-table-column label="关系表value" width="150">
            <template slot-scope="scope">
              <el-select v-model="scope.row.fkLabelName" clearable filterable placeholder="请选择">
                <el-option
                  v-for="column in scope.row.fkCol"
                  :key="column.columnName"
                  :label="column.columnName"
                  :value="column.jsonField"
                >
                  <span style="float: left">{{ column.jsonField }}</span>
                  <span style="float: right; color: #8492a6; font-size: 13px">{{ column.columnComment }}</span>
                </el-option>
              </el-select>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
      <el-tab-pane label="生成信息" name="genInfo">
        <gen-info-form ref="genInfo" :info="info" />
      </el-tab-pane>
    </el-tabs>
    <el-form label-width="100px">
      <el-form-item style="text-align: center;margin-left:-100px;margin-top:10px;">
        <el-button type="primary" @click="submitForm()">提交</el-button>
        <el-button @click="close()">返回</el-button>
      </el-form-item>
    </el-form>
  </el-card>
</template>
<script>
import { getGenTable, updateGenTable, getTableTree } from '@/api/tools/gen'
// import { listTable } from '@/api/tools/gen'
import { optionselect as getDictOptionselect } from '@/api/admin/dict/type'
import basicInfoForm from './basicInfoForm'
import genInfoForm from './genInfoForm'
export default {
  name: 'GenEdit',
  components: {
    basicInfoForm,
    genInfoForm
  },
  data() {
    return {
      // 选中选项卡的 name
      activeName: 'cloum',
      // 表格的高度
      tableHeight: document.documentElement.scrollHeight - 245 + 'px',
      // 表列信息
      columns: [],
      tableTree: [],
      // 字典信息
      dictOptions: [],
      // 表详细信息
      info: {}
    }
  },

  beforeCreate() {
    getTableTree().then(response => {
      this.tableTree = response.data
      this.tableTree.unshift({ tableId: 0, className: '请选择' })
    })
    const { tableId } = this.$route.query
    if (tableId) {
      // 获取表详细信息
      getGenTable(tableId).then(res => {
        this.columns = res.data.list
        this.info = res.data.info

        this.info.isDataScope = this.info.isDataScope.toString()
        this.info.isActions = this.info.isActions.toString()
        this.info.isAuth = this.info.isAuth.toString()

        this.columns.forEach(item => {
          this.tableTree.filter(function(e) {
            if (e.tableId === item.fkTableNameClass) {
              item.fkCol = e.columns || [{ columnId: 0, columnName: '请选择' }]
              // item.fkCol.unshift({ columnId: 0, columnName: '请选择' })
            }
          })
        })
      })

      /** 查询字典下拉列表 */
      getDictOptionselect().then(response => {
        this.dictOptions = response.data
      })
    }
  },
  methods: {
    renderHeadeUpdate(h, { column, $index }) {
      // h 是一个渲染函数       column 是一个对象表示当前列      $index 第几列
      return h('div', [
        h('span', column.label + '  ', { align: 'center', marginTop: '0px' }),
        h(
          'el-popover',
          { props: { placement: 'top-start', width: '270', trigger: 'hover' }},
          [
            h('p', '是否在表单编辑时能够编辑，打√表示需要', { class: 'text-align: center; margin: 0' }),
            // 生成 i 标签 ，添加icon 设置 样式，slot 必填
            h('i', { class: 'el-icon-question', style: 'color:#ccc,padding-top:5px', slot: 'reference' })
          ]
        )
      ])
    },
    renderHeadeList(h, { column, $index }) {
      // h 是一个渲染函数       column 是一个对象表示当前列      $index 第几列
      return h('div', [
        h('span', column.label + '  ', { align: 'center', marginTop: '0px' }),
        h(
          'el-popover',
          { props: { placement: 'top-start', width: '260', trigger: 'hover' }},
          [
            h('p', '是否在列表中展示，打√表示需要展示', { class: 'text-align: center; margin: 0' }),
            h('i', { class: 'el-icon-question', style: 'color:#ccc,padding-top:5px', slot: 'reference' })
          ]
        )
      ])
    },
    renderHeadeSearch(h, { column, $index }) {
      return h('div', [
        h('span', column.label + '  ', { align: 'center', marginTop: '0px' }),
        h(
          'el-popover',
          { props: { placement: 'top-start', width: '270', trigger: 'hover' }},
          [
            h('p', '是都当做搜索条件，打√表示做为搜索条件', { class: 'text-align: center; margin: 0' }),
            h('i', { class: 'el-icon-question', style: 'color:#ccc,padding-top:5px', slot: 'reference' })
          ]
        )
      ])
    },
    handleChangeConfig(row, index) {
      this.tableTree.filter(function(item) {
        if (item.tableName === row.fkTableName) {
          row.fkCol = item.columns
          // row.fkCol.unshift({ columnId: 0, columnName: '请选择' })
        }
      })
    },
    /** 提交按钮 */
    submitForm() {
      const basicForm = this.$refs.basicInfo.$refs.basicInfoForm
      const genForm = this.$refs.genInfo.$refs.genInfoForm

      Promise.all([basicForm, genForm].map(this.getFormPromise)).then(res => {
        const validateResult = res.every(item => !!item)
        if (validateResult) {
          const genTable = Object.assign({}, basicForm.model, genForm.model)
          genTable.columns = this.columns
          genTable.params = {
            treeCode: genTable.treeCode,
            treeName: genTable.treeName,
            treeParentCode: genTable.treeParentCode
          }
          genTable.isDataScope = JSON.parse(genTable.isDataScope)
          genTable.isActions = JSON.parse(genTable.isActions)
          genTable.isAuth = JSON.parse(genTable.isAuth)
          updateGenTable(genTable).then(res => {
            this.msgSuccess(res.msg)
            if (res.code === 200) {
              this.close()
            }
          })
        } else {
          this.msgError('表单校验未通过，请重新检查提交内容')
        }
      })
    },
    getTables() {
      getTableTree().then(response => {
        this.tableTree = response.data
        this.tableTree.unshift({ tableId: 0, className: '请选择' })
      })
    },
    getTablesCol(tableName) {
      return this.tableTree.filter(function(item) {
        if (item.tableName === tableName) {
          return item.columns
        }
      })
    },
    getFormPromise(form) {
      return new Promise(resolve => {
        form.validate(res => {
          resolve(res)
        })
      })
    },
    /** 关闭按钮 */
    close() {
      this.$store.dispatch('tagsView/delView', this.$route)
      this.$router.push({ path: '/dev-tools/gen', query: { t: Date.now() }})
    }
  }
}
</script>
