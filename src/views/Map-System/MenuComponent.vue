<template>
  <el-menu
    :default-active="activeIndex"
    class="menu-horizontal"
    mode="horizontal"
    background-color="#545c64"
    text-color="#fff"
    active-text-color="#ffd04b"
  >
    <el-sub-menu index="1">
      <template #title> 数据加载 </template>
      <el-menu-item index="1-1" @click="addLayerToMap('optical')"
        >光学遥感数据</el-menu-item
      >
      <el-menu-item index="1-2" @click="addLayerToMap('sar')"
        >SAR遥感数据</el-menu-item
      >
      <el-menu-item index="1-3" @click="addLayerToMap('vector')"
        >研究区矢量数据</el-menu-item
      >
      <el-menu-item index="1-4" @click="addLayerToMap('dem')"
        >DEM数据</el-menu-item
      >
      <el-menu-item index="1-5" @click="addLayerToMap('insar')"
        >InSAR形变结果数据</el-menu-item
      >
      <el-menu-item index="1-6" @click="addLayerToMap('predict')"
        >检测结果栅格数据</el-menu-item
      >
    </el-sub-menu>
    <el-sub-menu index="2">
      <template #title> 计算工具 </template>
      <el-menu-item index="2-1">坡度计算</el-menu-item>
      <el-menu-item index="2-2">坡向计算</el-menu-item>
      <el-menu-item index="2-3">矢量转栅格</el-menu-item>
      <el-menu-item index="2-4">栅格转矢量</el-menu-item>
    </el-sub-menu>
    <el-sub-menu index="3">
      <template #title> 数据预处理 </template>
      <el-menu-item index="3-1" @click="Standardized()"
        >多源栅格数据标准化</el-menu-item
      >
    </el-sub-menu>
    <el-sub-menu index="4">
      <template #title> 灾害检测 </template>
      <el-menu-item index="4-1" @click="OpticalDetection()"
        >光学遥感检测</el-menu-item
      >
      <el-menu-item index="4-2" @click="InsarDetection()"
        >InSAR地质灾害检测</el-menu-item
      >
      <el-menu-item index="4-3" @click="SusceptibleDetection()"
        >滑坡易发性评估</el-menu-item
      >
      <el-menu-item index="4-4" @click="MultiDetection()"
        >多源遥感综合检测</el-menu-item
      >
    </el-sub-menu>
    <el-sub-menu index="5">
      <template #title> 样本管理 </template>
      <el-menu-item index="5-1">光学样本数据集</el-menu-item>
      <el-menu-item index="5-2">InSAR样本数据集</el-menu-item>
    </el-sub-menu>
  </el-menu>
</template>

<script setup>
import { ref } from "vue";

const activeIndex = ref("1");

// 定义可以发出的事件
const emit = defineEmits([
  "load-data",
  // "load-sample",
  // "calculate-tool",
  // "toggle-property-sheet",
  "standard-preprocess",
  "optical-detection",
  "insar-detection",
  "susceptible-detection",
  "multi-detection"
]);

const addLayerToMap = dataType => {
  emit("load-data", dataType);
};
const Standardized = () => {
  emit("standard-preprocess");
};
const OpticalDetection = () => {
  emit("optical-detection");
};
const InsarDetection = () => {
  emit("insar-detection");
};
const SusceptibleDetection = () => {
  emit("susceptible-detection");
};
const MultiDetection = () => {
  emit("multi-detection");
};
</script>

<style lang="scss" scoped>
:deep(.el-sub-menu__title) {
  font-size: 18px;
}
:deep(.el-sub-menu) {
  background-color: #545c64; // 修改为所需的背景颜色
}
:deep(.el-menu-item) {
  color: #fff;
}
</style>
