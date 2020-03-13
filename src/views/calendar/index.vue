<template>
  <div class="app-container">
    <el-calendar>
      <!-- 这里使用的是 2.5 slot 语法，对于新项目请使用 2.6 slot 语法-->
      <template
        slot="dateCell"
        slot-scope="{date, data}"
      >
        <el-row :gutter="24">
          <el-col :span="18">
            <div :class="data.isSelected ? 'is-selected' : ''">
              {{ data.day.split('-')[2] }} {{ data.isSelected ? '✔️' : '' }}
            </div>
          </el-col>
          <el-col :span="6">
            <div class="gz">
              {{ getData(data).term }}
            </div>
          </el-col>
        </el-row>
        <div class="gz">
          {{ getData(data).gzYear }}年 {{ getData(data).gzMonth }}月 {{ getData(data).gzDay }}日
        </div>
        <div class="gz">
          {{ getData(data).monthCn }}-{{ getData(data).dayCn }}
        </div>

      </template>
    </el-calendar>
  </div>
</template>
<script>
import solarLunar from 'solarlunar'
export default {
  methods: {
    getData(data) {
      console.log(data)
      var list = data.day.split('-')
      var solar2lunarData = solarLunar.solar2lunar(list[0], list[1], list[2])
      return solar2lunarData
    }
  }
}
</script>
<style>
  .is-selected {
    color: #1989FA;
  }
  .gz{
      font-size: 10px;
      margin-top: 3px;
  }
  .gz > .greenc{      color:green;}
  .gz > .redc{      color: red;}
  .gz > .bluec{color: blue}
  .gz > .goldc{color: gold}
  .gz > .siennac{color: sienna}
</style>
