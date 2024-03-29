<template>
  <div class="map-wrapper">
    <div id="map" class="map-container"></div>
    <div class="status-bar">
      纬度: {{ currentPosition.lat.toFixed(3) }}°, 经度:
      {{ currentPosition.lng.toFixed(3) }}°, Zoom: {{ currentZoom }}
      &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
    </div>
    <!-- 引入菜单组件 -->
    <MenuComponent
      @load-data="handleDataLoad"
      @load-sample="handleSampleLoad"
      @calculate-tool="calculate"
      @run-model="runDisasterModel"
      :layers="layersWithRaster"
      @standard-preprocess="multiBandStandardized"
      @optical-detection="opticalDetection"
      @insar-detection="insarDetection"
      @susceptible-detection="susceptibleDetection"
      @multi-detection="multiDetection"
    />
    <!-- 引入标准化预处理操作面板 -->
    <Standardized v-model="standardVisible" />
    <!-- 引入光学检测操作面板 -->
    <OpticalDetection
      @load-result="addDynamicWMSLayer"
      v-model="opticalDetectVisible"
    />
    <!-- 引入INSAR检测操作面板 -->
    <InsarDetection
      @load-result="addDynamicWMSLayer"
      v-model="insarDetectVisible"
    />
    <!-- 引入综合检测操作面板 -->
    <MultiDetection
      @load-result="addDynamicWMSLayer"
      v-model="multiDetectVisible"
    />
    <!-- 引入状态栏菜单 -->
    <BarMenu
      @location-statistics="toggleAttributeVisibility"
      @legend-view="toggleLegendVisibility"
      @quantify-view="toggleQuantify"
      @system-log="toggleLogVisibility"
    />
    <AttributePanel
      @attribution-close="toggleAttributeVisibility"
      v-model="isAttributeVisible"
    />
    <QuantifyAnalysis
      @quantify-close="toggleQuantify"
      v-model="quantifyVisible"
    />
    <LegendComponent v-if="isLegendVisible" />
    <LogPanel @close-Log="toggleLogVisibility" v-if="isLogVisible" />
  </div>
</template>

<script setup>
import { onMounted, ref } from "vue";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import axios from "axios";
import MenuComponent from "./MenuComponent.vue";
import Standardized from "./Standardized.vue";
import OpticalDetection from "./OpticalDetection.vue";
import InsarDetection from "./InsarDetection.vue";
import MultiDetection from "./MultiDetection.vue";
import BarMenu from "./BarMenu.vue";
import QuantifyAnalysis from "./QuantifyAnalysis.vue";
import LegendComponent from "./LegendComponent.vue";
import LogPanel from "./LogPanel.vue";
import AttributePanel from "./AttributePanel.vue";

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
      maxWidth: 120, // 最大宽度
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

const layersWithRaster = ref([]); // 这是存储图层信息的数组
// 创建弹窗
const createPopup = (properties, latlng) => {
  // 生成弹窗内容
  const popupContent = generatePopupContent(properties);
  // 设置弹窗位置、内容，并在地图上打开
  L.popup().setLatLng(latlng).setContent(popupContent).openOn(map.value);
};

// 生成弹窗内容
const generatePopupContent = properties => {
  let content = '<div class="popup-content">';
  for (const key in properties) {
    // 对每个属性创建一行，格式为 "Key: Value"
    content += `<div><strong>${key}</strong>: ${properties[key]}</div>`;
  }
  content += "</div>";
  return content;
};

const isOpticalWMSAdded = ref(false);
const isSarWMSAdded = ref(false);
const isVectorAdded = ref(true);
const isDemWMSAdded = ref(false);
const isInsarWMSAdded = ref(false);
const isPredictResAdded = ref(false);

function handleDataLoad(dataType) {
  if (dataType === "optical") {
    isOpticalWMSAdded.value ^= 1;
    addOpticalWMSLayers();
  } else if (dataType === "sar") {
    isSarWMSAdded.value ^= 1;
    addSarWMSLayers();
  } else if (dataType === "vector") {
    isVectorAdded.value ^= 1;
    addVecWFSLayers();
  } else if (dataType === "dem") {
    isDemWMSAdded.value ^= 1;
    addDemWMSLayers();
  } else if (dataType === "insar") {
    isInsarWMSAdded.value ^= 1;
    addInSARLayers();
  } else if (dataType === "predict") {
    isPredictResAdded.value ^= 1;
    addPredictResult();
  }
}

// 添加或移除光学WMS图层的函数
const cz_s2_band234 = ref(null);
function addOpticalWMSLayers() {
  if (isOpticalWMSAdded.value) {
    // 添加图层
    const cz_s2_band234Layer = L.tileLayer.wms(
      "http://localhost:8080/geoserver/wms",
      {
        layers: "cztif:cz_S2_band234_",
        format: "image/png",
        transparent: true,
        version: "1.3.0"
      }
    );
    cz_s2_band234.value = cz_s2_band234Layer;
    layerControl.value.addOverlay(cz_s2_band234Layer, "S-2:Band 2,3,4");
    layersWithRaster.value.push({
      name: "S-2:Band 2,3,4"
    });
  } else {
    layerControl.value.removeLayer(cz_s2_band234.value);
    map.value.removeLayer(cz_s2_band234.value);
    cz_s2_band234.value = null;
  }
}

// 加载SAR影像数据
const cz_SarVH_Asc = ref(null);
function addSarWMSLayers() {
  if (isSarWMSAdded.value) {
    // 川藏研究区 GeoServer WMS 服务的 URL
    const cz_SarVH_AscLayer = L.tileLayer.wms(
      "http://localhost:8080/geoserver/wms",
      {
        layers: "cztif:VH_IW_Asc",
        format: "image/png",
        transparent: true,
        version: "1.3.0"
      }
    );
    cz_SarVH_Asc.value = cz_SarVH_AscLayer;
    layerControl.value.addOverlay(cz_SarVH_AscLayer, "S-1_VH_IW_Asc");
    layersWithRaster.value.push({
      name: "S-1_VH_IW_Asc"
    });
  } else {
    layerControl.value.removeLayer(cz_SarVH_Asc.value);
    map.value.removeLayer(cz_SarVH_Asc.value);
    cz_SarVH_Asc.value = null;
  }
}

// 用于存储图层的响应式引用
const railway = ref(null);
const cz_railway_buffer5 = ref(null);
const cz_railway_buffer_20 = ref(null);
const cz_fault = ref(null);
const cz_reservoir = ref(null);
const china_river_level3 = ref(null);
// 加载矢量数据
function addVecWFSLayers() {
  if (isVectorAdded.value) {
    // 川藏研究区 GeoServer WFS 服务的 URL
    const railwayUrl =
      "http://localhost:8080/geoserver/chuanzang/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=chuanzang%3Arailway&maxFeatures=50&outputFormat=application%2Fjson";
    fetch(railwayUrl)
      .then(response => response.json())
      .then(data => {
        const railwayLayer = L.geoJSON(data, {
          // Apply a static style to the railway line
          style: {
            color: "#000000", // 黑色
            weight: 6, // 与白色底层相同的宽度
            ineCap: "square", // 方形线帽
            opacity: 1 // 不透明
          }
        });
        const whiteLayer = L.geoJSON(data, {
          style: {
            color: "#FFFFFF", // 白色
            weight: 5, // 与铁轨线相同的宽度
            dashArray: "10, 10", // 虚线模式
            lineCap: "square", // 方形线帽
            opacity: 1 // 不透明
          }
          // 其他设置（如点击事件）可以根据需要添加
        });
        // Add the railway layer to the map
        // 将两个图层组合为一个图层组
        const geoJsonLayer = L.layerGroup([railwayLayer, whiteLayer]);
        // 将图层组添加到图层控制器中
        railway.value = geoJsonLayer;
        geoJsonLayer.addTo(map.value);
        layerControl.value.addOverlay(geoJsonLayer, "川藏铁路线");
        layersWithAttributes.push({
          name: "川藏铁路线",
          attributes: data.features.map(f => f.properties)
        });
      })
      .catch(error => {
        console.error("Error fetching the WFS data: ", error);
      });
    // 川藏线5km缓冲区 GeoServer WFS 服务的 URL
    const cz_buffer5_url =
      "http://localhost:8080/geoserver/chuanzang/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=chuanzang%3Abuffer_5km&maxFeatures=50&outputFormat=application%2Fjson";
    fetch(cz_buffer5_url)
      .then(response => response.json())
      .then(data => {
        // 使用 GeoJSON 数据创建一个图层
        const geoJsonLayer = L.geoJSON(data, {
          // 这里可以根据需要定义样式
          style: feature => ({
            color: "#FF4500", // 设置边框为橙红色
            weight: 4, // 默认线宽
            fillColor: feature.properties.fillColor || "#000000",
            fillOpacity: 0, // 设置填充透明
            dashArray: "8, 8"
          })
        });
        // 将图层添加到图层控制器中
        cz_railway_buffer5.value = geoJsonLayer;
        geoJsonLayer.addTo(map.value);
        layerControl.value.addOverlay(geoJsonLayer, "川藏线5km缓冲区");
        layersWithAttributes.push({
          name: "川藏线5km缓冲区",
          attributes: data.features.map(f => f.properties)
        });
      })
      .catch(error => {
        console.error("Error fetching the WFS data: ", error);
      });
    // 川藏线20km缓冲区 GeoServer WFS 服务的 URL
    const cz_buffer_20_url =
      "http://localhost:8080/geoserver/chuanzang/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=chuanzang%3Abuffer_20km&maxFeatures=50&outputFormat=application%2Fjson";
    fetch(cz_buffer_20_url)
      .then(response => response.json())
      .then(data => {
        // 使用 GeoJSON 数据创建一个图层
        const geoJsonLayer = L.geoJSON(data, {
          // 这里可以根据需要定义样式
          style: feature => ({
            color: "#FFA500", // 设置边框为橙色
            weight: 4, // 默认线宽
            fillColor: feature.properties.fillColor || "#000000",
            fillOpacity: 0, // 设置填充透明
            dashArray: "8, 8"
          })
        });
        // 将图层添加到图层控制器中
        cz_railway_buffer_20.value = geoJsonLayer;
        geoJsonLayer.addTo(map.value);
        layerControl.value.addOverlay(geoJsonLayer, "川藏线20km缓冲区");
      })
      .catch(error => {
        console.error("Error fetching the WFS data: ", error);
      });
    // 中国断裂带分布 GeoServer WFS 服务的 URL
    const cz_fault_url =
      "http://localhost:8080/geoserver/chuanzang/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=chuanzang%3ACN-faults_1&outputFormat=application%2Fjson";
    fetch(cz_fault_url)
      .then(response => response.json())
      .then(data => {
        // 使用 GeoJSON 数据创建一个图层
        const geoJsonLayer = L.geoJSON(data, {
          // 这里可以根据需要定义样式
          style: feature => ({
            color: "#FF1493", // 设置边框为桃红色
            weight: 2, // 默认线宽
            fillColor: feature.properties.fillColor || "#000000",
            fillOpacity: 0, // 设置填充透明
            dashArray: "10, 5"
          }),
          onEachFeature: (feature, layer) => {
            layer.on("click", e => {
              createPopup(feature.properties, e.latlng);
            });
          }
        });
        // 将图层添加到图层控制器中
        cz_fault.value = geoJsonLayer;
        layerControl.value.addOverlay(geoJsonLayer, "中国断裂带分布");
        layersWithAttributes.push({
          name: "中国断裂带分布",
          attributes: data.features.map(f => f.properties)
        });
      })
      .catch(error => {
        console.error("Error fetching the WFS data: ", error);
      });
    // 中国水库分布 GeoServer WFS 服务的 URL
    const cz_reservoir_url =
      "http://localhost:8080/geoserver/chuanzang/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=chuanzang%3Aall_reservoirs_clip&outputFormat=application%2Fjson";
    fetch(cz_reservoir_url)
      .then(response => response.json())
      .then(data => {
        // 使用 GeoJSON 数据创建一个图层
        const geoJsonLayer = L.geoJSON(data, {
          // 这里可以根据需要定义样式
          style: feature => ({
            color: "#FFC0CB", // 设置边框为浅紫色
            weight: 2, // 默认线宽
            fillColor: feature.properties.fillColor || "#FFC0CB", // 修改为黑色
            fillOpacity: 0.5 // 设置填充透明度为0.5
          })
        });
        // 将图层添加到图层控制器中
        cz_reservoir.value = geoJsonLayer;
        layerControl.value.addOverlay(geoJsonLayer, "中国水库数据集");
        layersWithAttributes.push({
          name: "中国水库数据集",
          attributes: data.features.map(f => f.properties)
        });
      })
      .catch(error => {
        console.error("Error fetching the WFS data: ", error);
      });
    const china_river_level3_url =
      "http://localhost:8080/geoserver/chuanzang/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=chuanzang%3Ariver_level3&outputFormat=application%2Fjson";
    fetch(china_river_level3_url)
      .then(response => response.json())
      .then(data => {
        // 使用 GeoJSON 数据创建一个图层
        const geoJsonLayer = L.geoJSON(data, {
          // 这里可以根据需要定义样式
          style: feature => ({
            color: "#0000FF", // 设置边框为蓝色
            weight: 2, // 默认线宽
            fillColor: feature.properties.fillColor || "#0000FF",
            fillOpacity: 1 // 设置填充透明度为0.5
          }),
          onEachFeature: (feature, layer) => {
            layer.on("click", e => {
              createPopup(feature.properties, e.latlng);
            });
          }
        });
        // 将图层添加到图层控制器中
        china_river_level3.value = geoJsonLayer;
        geoJsonLayer.addTo(map.value);
        layerControl.value.addOverlay(geoJsonLayer, "中国三级以上河流");
        layersWithAttributes.push({
          name: "中国河流数据集",
          attributes: data.features.map(f => f.properties)
        });
      })
      .catch(error => {
        console.error("Error fetching the WFS data: ", error);
      });
  } else {
    // 将图层从图层控制器中删除
    // console.log('remove layer');
    layerControl.value.removeLayer(railway.value);
    layerControl.value.removeLayer(cz_railway_buffer5.value);
    layerControl.value.removeLayer(cz_railway_buffer_20.value);
    layerControl.value.removeLayer(cz_fault.value);
    layerControl.value.removeLayer(cz_reservoir.value);
    layerControl.value.removeLayer(china_river_level3.value);

    map.value.removeLayer(railway.value);
    map.value.removeLayer(cz_railway_buffer5.value);
    map.value.removeLayer(cz_railway_buffer_20.value);
    map.value.removeLayer(cz_fault.value);
    map.value.removeLayer(cz_reservoir.value);
    map.value.removeLayer(china_river_level3.value);

    railway.value = null;
    cz_railway_buffer5.value = null;
    cz_railway_buffer_20.value = null;
    cz_fault.value = null;
    cz_reservoir.value = null;
    china_river_level3.value = null;
  }
}

const cz_ALOS_Dem = ref(null);
function addDemWMSLayers() {
  if (isDemWMSAdded.value) {
    console.log("cz_dem_added");
    const cz_ALOS_DemLayer = L.tileLayer.wms(
      "http://localhost:8080/geoserver/wms",
      {
        layers: "cztif:cz_ALOS_DEM_12m",
        format: "image/png",
        transparent: true,
        version: "1.3.0"
      }
    );
    cz_ALOS_Dem.value = cz_ALOS_DemLayer;
    layerControl.value.addOverlay(cz_ALOS_DemLayer, "ALOS_DEM_12m");
    layersWithRaster.value.push({
      name: "ALOS_DEM_12m"
    });
  } else {
    layerControl.value.removeLayer(cz_ALOS_Dem.value);
    map.value.removeLayer(cz_ALOS_Dem.value);
    cz_ALOS_Dem.value = null;
  }
}

const cz_insar = ref(null);
const JinS_insar = ref(null);
function addInSARLayers() {
  if (isInsarWMSAdded.value) {
    // InSAR形变结果 GeoServer WMS 服务的 URL
    const insar_clip_26 = L.tileLayer.wms(
      "http://localhost:8080/geoserver/wms",
      {
        layers: "cztif:insar_clip_26",
        format: "image/png",
        transparent: true,
        version: "1.3.0"
      }
    );
    const insar_clip_128 = L.tileLayer.wms(
      "http://localhost:8080/geoserver/wms",
      {
        layers: "cztif:insar_clip_128",
        format: "image/png",
        transparent: true,
        version: "1.3.0"
      }
    );
    const insar_clip_172 = L.tileLayer.wms(
      "http://localhost:8080/geoserver/wms",
      {
        layers: "cztif:insar_clip_172",
        format: "image/png",
        transparent: true,
        version: "1.3.0"
      }
    );
    const insar_clip_99 = L.tileLayer.wms(
      "http://localhost:8080/geoserver/wms",
      {
        layers: "cztif:insar_clip_99",
        format: "image/png",
        transparent: true,
        version: "1.3.0"
      }
    );
    const insar_clip_70 = L.tileLayer.wms(
      "http://localhost:8080/geoserver/wms",
      {
        layers: "cztif:insar_clip_70",
        format: "image/png",
        transparent: true,
        version: "1.3.0"
      }
    );
    // 金沙江2023insar速率
    const insar_JinS_vel = L.tileLayer.wms(
      "http://localhost:8080/geoserver/wms",
      {
        layers: "	cztif:SBAS_99_JinS",
        format: "image/png",
        transparent: true,
        version: "1.3.0"
      }
    );

    // 将两个图层组合为一个图层组
    const combinedInSAR = L.layerGroup([
      insar_clip_26,
      insar_clip_128,
      insar_clip_172,
      insar_clip_99,
      insar_clip_70
    ]);
    cz_insar.value = combinedInSAR;
    JinS_insar.value = insar_JinS_vel;
    // 将图层组添加到图层控制器中
    layerControl.value.addOverlay(combinedInSAR, "insar:CZ形变速率_2023");
    layersWithRaster.value.push({
      name: "2023_CZ平均形变速率"
    });

    // 将金沙江形变添加到图层控制器中
    layerControl.value.addOverlay(insar_JinS_vel, "insar:金沙江形变速率_2023");
    layersWithRaster.value.push({
      name: "2023_金沙江平均形变速率"
    });
  } else {
    layerControl.value.removeLayer(cz_insar.value);
    map.value.removeLayer(cz_insar.value);
    cz_insar.value = null;

    layerControl.value.removeLayer(JinS_insar.value);
    map.value.removeLayer(JinS_insar.value);
    JinS_insar.value = null;
  }
}

async function addPredictResult(workspace = "predict_result") {
  try {
    console.log("加载完整工作区栅格");
    const response = await axios.get(`http://localhost:5000/list_layers`, {
      params: { workspace }
    });

    const data = response.data; // With axios, response.data directly contains the data
    console.log(data);
    // Assuming the backend returns data structure like {layers: ["layer1", "layer2", ...]}
    if (data.layers && data.layers.length > 0) {
      console.log("获取到图层名");
      data.layers.forEach(layerName => {
        // Directly use layerName from the array
        console.log(layerName);
        addDynamicWMSLayer(workspace, layerName); // Pass layerName directly
      });
    } else {
      console.error("No layers found in the workspace:", workspace);
    }
  } catch (error) {
    // Error handling with axios should be in the catch block
    console.error("Error fetching layers:", error);
  }
}

const standardVisible = ref(false);
const multiBandStandardized = () => {
  standardVisible.value = true;
};

const opticalDetectVisible = ref(false);
const opticalDetection = () => {
  opticalDetectVisible.value = true;
};

const insarDetectVisible = ref(false);
const insarDetection = () => {
  insarDetectVisible.value = true;
};

const susceptibleDetection = () => {
  console.log("滑坡易发性评估");
  addDynamicWMSLayer("predict_result", "JinS_susceptible_10m");
};

const multiDetectVisible = ref(false);
const multiDetection = () => {
  multiDetectVisible.value = true;
};

function addDynamicWMSLayer(workspace, layerName) {
  // console.log("栅格数据加载");
  const fullLayerName = `${workspace}:${layerName}`;
  const newLayer = L.tileLayer.wms("http://localhost:8080/geoserver/wms", {
    layers: fullLayerName, // 使用动态获取的工作空间和图层名称
    format: "image/png",
    transparent: true,
    version: "1.3.0"
  });
  layerControl.value.addOverlay(newLayer, layerName);
}

const isAttributeVisible = ref(false);
const toggleAttributeVisibility = () => {
  isAttributeVisible.value = !isAttributeVisible.value;
};

const quantifyVisible = ref(false);
const toggleQuantify = () => {
  quantifyVisible.value = !quantifyVisible.value;
};

const isLegendVisible = ref(false);
const toggleLegendVisibility = () => {
  isLegendVisible.value = !isLegendVisible.value;
};
const isLogVisible = ref(false);
const toggleLogVisibility = () => {
  isLogVisible.value = !isLogVisible.value;
};
</script>

<style scoped>
.map-wrapper {
  display: flex;
  /* position: relative; */
  height: 94.5vh;
}

.map-container {
  flex-grow: 1;
  /* height: calc(100%); */
  height: 100%;
}

.menu-horizontal {
  position: absolute;
  top: 2vh;
  right: 55vh;
  left: 60vh;
  z-index: 500;
  height: 50px;
}
.bar-menu {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 4vh;
  z-index: 500;
  width: 100%;
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
  height: 4vh; /* 或根据需要调整高度 */
  /* padding: 2px; */
  font-size: 18px;
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
:deep(.leaflet-control-scale) {
  bottom: 0;
  background-color: #fff;
  border: 1px solid #000;
  border-radius: 5px;
  padding: 5px;
  font-size: 15px;
  font-weight: bold;
  color: #000;
  margin: 5px;
  z-index: 500;
}
</style>
