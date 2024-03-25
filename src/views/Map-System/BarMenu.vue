<template>
  <el-menu
    :default-active="activeIndex"
    class="bar-menu"
    mode="horizontal"
    background-color="transparent"
    text-color="#fff"
    active-text-color="transparent"
  >
    <el-menu-item index="1" @click="locationStatistics()">
      <el-icon><location /></el-icon>
      <span>地质灾害信息统计</span>
    </el-menu-item>
    <el-menu-item index="2" @click="quantifyAnalysis()">
      <el-icon><TrendCharts /></el-icon>
      <span>定量评估</span>
    </el-menu-item>
    <el-menu-item index="3" @click="addLegend()">
      <el-icon><Guide /></el-icon>
      <span>地图图例</span>
    </el-menu-item>
    <el-menu-item index="4" @click="addSystemLog()">
      <el-icon><List /></el-icon>
      <span>系统日志</span>
    </el-menu-item>
  </el-menu>
</template>

<script setup>
import { ref } from "vue";

const activeIndex = ref("1");

// 定义可以发出的事件
const emit = defineEmits([
  "location-statistics",
  "quantify-view",
  "legend-view",
  "system-log"
]);
const locationStatistics = () => {
  emit("location-statistics");
};
const quantifyAnalysis = () => {
  emit("quantify-view");
};
const addLegend = () => {
  emit("legend-view");
};
const addSystemLog = () => {
  emit("system-log");
};
</script>

<style lang="scss" scoped>
:deep(.el-menu-item span) {
  font-size: 20px; /* 设置文字大小为20px */
}
</style>
