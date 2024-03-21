<template>
  <div class="map-wrapper">
    <div id="map" class="map-container"></div>
    <div class="status-bar">
      纬度: {{ currentPosition.lat.toFixed(3) }}°, 经度:
      {{ currentPosition.lng.toFixed(3) }}°, Zoom: {{ currentZoom }}
    </div>
    <!-- 引入菜单组件 -->
    <MenuComponent />
    <!-- 引入侧边菜单 -->
    <div class="side-menu-container">
      <SideMenuComponent />
    </div>
    <!-- 引入标准化预处理操作面板 -->
    <Standardized v-model="standardVisible" />
  </div>
</template>

<script setup>
import { onMounted, ref } from "vue";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import MenuComponent from "./MenuComponent.vue";
import Standardized from "./Standardized.vue";
import SideMenuComponent from "./SideMenuComponent.vue";

const map = ref(null);
const layerControl = ref(null); // 图层控制器的引用
const currentZoom = ref(9); // 默认缩放级别，根据需要调整
const currentPosition = ref({ lat: 0, lng: 0 });
const baseLayers = ref({
  OSM: L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 17
    // attribution: '© OpenStreetMap contributors'
  }),
  Topo: L.tileLayer("https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png", {
    maxZoom: 17
    // attribution: '© OpenTopoMap contributors'
  }),
  Satellite: L.tileLayer(
    "https://api.mapbox.com/styles/v1/mapbox/satellite-v9/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoieXVrdW44MCIsImEiOiJjbHIyNmNrbDAweW83MnhsbWVsMDM0MDI3In0.twJQOS07PF5XQ76xl2MimA",
    {
      maxZoom: 17
      // attribution: '© Satellite contributors'
    }
  )
});
onMounted(() => {
  initMap();
  addVecWFSLayers();
});
function initMap() {
  map.value = L.map("map", {
    center: [30.586377, 98.85313], // Adjust the center as needed
    zoom: currentZoom.value,
    layers: [baseLayers.value.Satellite], // Default layer
    zoomControl: false, // This will hide the zoom control
    attributionControl: false // 禁用默认的版权控件
  });

  // 添加比例尺控件到地图
  L.control
    .scale({
      position: "bottomright", // 比例尺显示在右下角
      maxWidth: 100, // 最大宽度
      metric: true, // 使用公制单位
      imperial: false // 不使用英制单位
    })
    .addTo(map.value);

  // 添加图层切换控件
  layerControl.value = L.control.layers(baseLayers.value).addTo(map.value);
  // 监听地图事件来更新状态栏信息
  map.value.on("mousemove", e => {
    currentPosition.value = e.latlng;
  });
  map.value.on("zoomend", () => {
    currentZoom.value = map.value.getZoom();
  });
}
</script>

<style scoped>
.map-wrapper {
  display: flex;
  /* position: relative; */
  height: 95vh;
}

.map-container {
  flex-grow: 1;
  /* height: calc(100%); */
  height: 100%;
}

.menu-horizontal {
  position: absolute;
  top: 2vh;
  right: 50vh;
  left: 50vh;
  z-index: 500;
  height: 50px;
}
/* 添加到index.vue的<style scoped>中 */
.side-menu-container {
  position: absolute;
  top: 0; /* 与顶部对齐 */
  left: 0; /* 与左侧对齐 */
  bottom: 0; /* 与底部对齐，确保填充高度 */
  z-index: 1000; /* 确保菜单在地图上方显示 */
  overflow-y: auto; /* 添加滚动条以适应内容 */
}

.status-bar {
  position: absolute; /* 绝对定位相对于最近的相对定位祖先（.map-container） */
  right: 0;
  bottom: 0; /* 对齐到底部 */
  left: 0;
  z-index: 500;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  height: 3vh; /* 或根据需要调整高度 */
  padding: 2px;
  font-size: 15px;
  color: white;
  background-color: rgb(0 0 0 / 70%); /* 半透明黑色背景 */
  backdrop-filter: blur(5px);
}

/* Scoped styles with deep selector to target layer control items */
:deep(.leaflet-control-layers-selector) {
  text-align: center;

  /* Aligns text to the left */
}

/* Fix for the layer labels if needed */
:deep(.leaflet-control-layers label) {
  display: flex;
  align-items: center;
  text-align: left;
}
</style>
