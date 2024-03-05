<template>
  <div class="geo-system">
    <div id="map" class="map-container"></div>
    <div class="status-bar">
      纬度: {{ currentPosition.lat.toFixed(5) }}°, 经度:
      {{ currentPosition.lng.toFixed(5) }}°, Zoom: {{ currentZoom }}
      &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
    </div>
  </div>
  <!-- MainMenu作为子组件，可以通过v-on或@指令向上触发事件 -->
  <MainMenu
    @load-data="handleDataLoad"
    @load-sample="handleSampleLoad"
    @calculate-tool="calculate"
    @run-model="runDisasterModel"
    :layers="layersWithRaster"
    @load-result="addDynamicWMSLayer"
  />
  <attribute-table :layers="layersWithAttributes" />
  <analysis-view :result="landslide_result" />
</template>

<script>
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import MainMenu from "./MainMenu.vue"; // Make sure the path is correct
import AttributeTable from "./AttributeTable.vue"; // The new component for attribute display
import AnalysisView from "./AnalysisView.vue";

export default {
  name: "MapView",
  components: {
    MainMenu,
    AttributeTable,
    AnalysisView
  },
  data() {
    return {
      map: null,
      layerControl: null,
      currentZoom: 8, // 默认缩放级别，根据需要调整
      currentPosition: { lat: 0, lng: 0 },
      // New data property to hold layers and their attributes
      layersWithAttributes: [],
      layersWithRaster: [],
      landslide_result: [],
      baseLayers: {
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
      }
    };
  },

  mounted() {
    this.initMap();
    this.addBaseLayers();
    this.addLayerControl();
    this.registerMapEvents();
    // 添加缩放开始事件的监听器
    this.map.on("zoomstart", () => {
      this.map.closePopup();
    });
    // 初始化矢量图层
    this.isVectorLayerAdded = true;
    this.addVecWFSLayer();
  },
  methods: {
    initMap() {
      this.map = L.map("map", {
        center: [30.586377, 98.85313], // Adjust the center as needed
        zoom: 9,
        layers: [this.baseLayers.Satellite], // Default layer
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
        .addTo(this.map);
    },

    addBaseLayers() {
      // The layers are already initialized in the data object
    },
    addLayerControl() {
      this.layerControl = L.control
        .layers(this.baseLayers, null, {
          position: "topright"
        })
        .addTo(this.map);
    },
    registerMapEvents() {
      this.map.on("mousemove", e => {
        this.currentPosition = e.latlng;
      });
      this.map.on("zoomend", () => {
        this.currentZoom = this.map.getZoom();
      });
      // Add other events here as necessary
    },
    // 假设layerName是从Flask后端接收到的，表示新上传并需要加载的图层名称
    // 这个函数可以根据实际情况调整，以适应不同的触发条件
    addDynamicWMSLayer(workspace, layerName) {
      // 终端打印“debug1”
      console.log("debug1");
      if (!this.map) return; // 确保地图实例已经初始化

      const newLayer = L.tileLayer.wms("http://localhost:8080/geoserver/wms", {
        layers: `${workspace}:${layerName}`, // 使用动态获取的工作空间和图层名称
        format: "image/png",
        transparent: true,
        version: "1.3.0"
      });
      layerName = `${workspace}:${layerName}`;
      // 可以根据实际需要调整逻辑，这里假设是动态添加到图层控制器和地图中
      this.layerControl.addOverlay(newLayer, layerName); // 添加到图层控制器，layerName用作图层的显示名称
      newLayer.addTo(this.map); // 添加到地图上
      console.log("debug2");
      // 如果需要，还可以将图层信息保存到组件的状态中，便于后续操作
      // this.layersWithRaster.push({
      //   name: layerName,
      //   layer: newLayer
      // });
    },
    handleDataLoad(dataType) {
      if (dataType === "optical") {
        this.isOpticalLayerAdded ^= 1;
        this.addRasWMSLayer();
        // this.isOpticalLayerAdded = true;
      } else if (dataType === "sar") {
        this.isSarLayerAdded ^= 1;
        this.addSarWMSLayer();
      } else if (dataType === "vector") {
        this.isVectorLayerAdded ^= 1;
        this.addVecWFSLayer();
      } else if (dataType === "dem") {
        this.isDemLayerAdded ^= 1;
        this.addDemWMSLayer();
      } else if (dataType === "insar") {
        this.isInSARLayerAdded ^= 1;
        this.addInSARLayer();
      }
    },
    // 加载光学影像数据
    addRasWMSLayer() {
      // 川藏研究区 GeoServer WMS 服务的 URL
      if (this.isOpticalLayerAdded) {
        const cz_s2_band234 = L.tileLayer.wms(
          "http://localhost:8080/geoserver/wms",
          {
            layers: "cztif:cz_S2_band234_",
            format: "image/png",
            transparent: true,
            version: "1.3.0"
          }
        );
        this.cz_s2_band234 = cz_s2_band234;
        this.layerControl.addOverlay(cz_s2_band234, "S-2:Band 2,3,4");
        this.layersWithRaster.push({
          name: "S-2:Band 2,3,4"
        });
      } else {
        // 将图层从图层控制器中删除
        // console.log('remove layer');
        this.layerControl.removeLayer(this.cz_s2_band234);
        // 从地图中移除图层
        this.map.removeLayer(this.cz_s2_band234);
        // 清除引用
        this.cz_s2_band234 = null;
      }
    },
    // 加载SAR影像数据
    addSarWMSLayer() {
      if (this.isSarLayerAdded) {
        // 川藏研究区 GeoServer WMS 服务的 URL
        const cz_SarVH_Asc = L.tileLayer.wms(
          "http://localhost:8080/geoserver/wms",
          {
            layers: "cztif:VH_IW_Asc",
            format: "image/png",
            transparent: true,
            version: "1.3.0"
          }
        );
        this.cz_SarVH_Asc = cz_SarVH_Asc;
        this.layerControl.addOverlay(cz_SarVH_Asc, "S-1_VH_IW_Asc");
        this.layersWithRaster.push({
          name: "S-1_VH_IW_Asc"
        });
      } else {
        // 将图层从图层控制器中删除
        // console.log('remove layer');
        this.layerControl.removeLayer(this.cz_SarVH_Asc);
        // 从地图中移除图层
        this.map.removeLayer(this.cz_SarVH_Asc);
        // 清除引用
        this.cz_SarVH_Asc = null;
      }
    },
    // 矢量数据加载
    addVecWFSLayer() {
      if (this.isVectorLayerAdded) {
        // 川藏研究区 GeoServer WFS 服务的 URL
        const railway =
          "http://localhost:8080/geoserver/chuanzang/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=chuanzang%3Arailway&maxFeatures=50&outputFormat=application%2Fjson";
        fetch(railway)
          .then(response => response.json())
          .then(data => {
            const railwayLayer = L.geoJSON(data, {
              // Apply a static style to the railway line
              style: {
                color: "#000000", // 黑色
                weight: 4, // 与白色底层相同的宽度
                ineCap: "square", // 方形线帽
                opacity: 1 // 不透明
              }
            });
            const whiteLayer = L.geoJSON(data, {
              style: {
                color: "#FFFFFF", // 白色
                weight: 3, // 与铁轨线相同的宽度
                dashArray: "5, 5", // 虚线模式
                lineCap: "square", // 方形线帽
                opacity: 1 // 不透明
              }
              // 其他设置（如点击事件）可以根据需要添加
            });
            // Add the railway layer to the map
            // 将两个图层组合为一个图层组
            const geoJsonLayer = L.layerGroup([railwayLayer, whiteLayer]);
            // 将图层组添加到图层控制器中
            this.railway = geoJsonLayer;
            geoJsonLayer.addTo(this.map);
            this.layerControl.addOverlay(geoJsonLayer, "川藏铁路线");
            this.layersWithAttributes.push({
              name: "川藏铁路线",
              attributes: data.features.map(f => f.properties)
            });
          })
          .catch(error => {
            console.error("Error fetching the WFS data: ", error);
          });
        // 川藏线5km缓冲区 GeoServer WFS 服务的 URL
        const cz_railway_buffer =
          "http://localhost:8080/geoserver/chuanzang/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=chuanzang%3Abuffer_5km&maxFeatures=50&outputFormat=application%2Fjson";
        fetch(cz_railway_buffer)
          .then(response => response.json())
          .then(data => {
            // 使用 GeoJSON 数据创建一个图层
            const geoJsonLayer = L.geoJSON(data, {
              // 这里可以根据需要定义样式
              style: feature => ({
                color: "#FF0000", // 设置边框为红色
                weight: 2, // 默认线宽
                fillColor: feature.properties.fillColor || "#000000", // 修改为黑色
                fillOpacity: 0, // 设置填充透明
                dashArray: "5, 5" // This will create a dashed pattern with 5px dashes and 5px gaps
              }),
              onEachFeature: (feature, layer) => {
                layer.on("click", e => {
                  this.createPopup(feature.properties, e.latlng);
                });
              }
            });
            // 将图层添加到图层控制器中
            this.cz_railway_buffer5 = geoJsonLayer;
            geoJsonLayer.addTo(this.map);
            this.layerControl.addOverlay(geoJsonLayer, "川藏线5km缓冲区");
            this.layersWithAttributes.push({
              name: "川藏线5km缓冲区",
              attributes: data.features.map(f => f.properties)
            });
          })
          .catch(error => {
            console.error("Error fetching the WFS data: ", error);
          });
        // 川藏线20km缓冲区 GeoServer WFS 服务的 URL
        const cz_railway_buffer_20km =
          "http://localhost:8080/geoserver/chuanzang/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=chuanzang%3Abuffer_20km&maxFeatures=50&outputFormat=application%2Fjson";
        fetch(cz_railway_buffer_20km)
          .then(response => response.json())
          .then(data => {
            // 使用 GeoJSON 数据创建一个图层
            const geoJsonLayer = L.geoJSON(data, {
              // 这里可以根据需要定义样式
              style: feature => ({
                color: "#FFA500", // 设置边框为橙色
                weight: 2, // 默认线宽
                fillColor: feature.properties.fillColor || "#000000", // 修改为黑色
                fillOpacity: 0, // 设置填充透明
                dashArray: "5, 5" // This will create a dashed pattern with 5px dashes and 5px gaps
              })
            });
            // 将图层添加到图层控制器中
            this.cz_railway_buffer_20 = geoJsonLayer;
            geoJsonLayer.addTo(this.map);
            this.layerControl.addOverlay(geoJsonLayer, "川藏线20km缓冲区");
            this.layersWithAttributes.push({
              name: "川藏线20km缓冲区",
              attributes: data.features.map(f => f.properties)
            });
          })
          .catch(error => {
            console.error("Error fetching the WFS data: ", error);
          });
        // 中国断裂带分布 GeoServer WFS 服务的 URL
        const cz_fault =
          "http://localhost:8080/geoserver/chuanzang/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=chuanzang%3ACN-faults_1&outputFormat=application%2Fjson";
        fetch(cz_fault)
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
                dashArray: "10, 5" // This will create a dashed pattern with 10px dashes and 5px gaps
              }),
              onEachFeature: (feature, layer) => {
                layer.on("click", e => {
                  this.createPopup(feature.properties, e.latlng);
                });
              }
            });
            // 将图层添加到图层控制器中
            this.cz_fault = geoJsonLayer;
            this.layerControl.addOverlay(geoJsonLayer, "中国断裂带分布");
            this.layersWithAttributes.push({
              name: "中国断裂带分布",
              attributes: data.features.map(f => f.properties)
            });
          })
          .catch(error => {
            console.error("Error fetching the WFS data: ", error);
          });
        // 中国水库分布 GeoServer WFS 服务的 URL
        const cz_reservoir =
          "http://localhost:8080/geoserver/chuanzang/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=chuanzang%3Aall_reservoirs_clip&outputFormat=application%2Fjson";
        fetch(cz_reservoir)
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
            this.cz_reservoir = geoJsonLayer;
            geoJsonLayer.addTo(this.map);
            this.layerControl.addOverlay(geoJsonLayer, "中国水库数据集");
            this.layersWithAttributes.push({
              name: "中国水库数据集",
              attributes: data.features.map(f => f.properties)
            });
          })
          .catch(error => {
            console.error("Error fetching the WFS data: ", error);
          });
      } else {
        // 将图层从图层控制器中删除
        // console.log('remove layer');
        this.layerControl.removeLayer(this.cz_railway_area);
        this.layerControl.removeLayer(this.railway);
        this.layerControl.removeLayer(this.cz_railway_buffer5);
        this.layerControl.removeLayer(this.cz_railway_buffer_20);
        this.layerControl.removeLayer(this.cz_fault);
        this.layerControl.removeLayer(this.cz_reservoir);

        this.map.removeLayer(this.cz_railway_area);
        this.map.removeLayer(this.railway);
        this.map.removeLayer(this.cz_railway_buffer5);
        this.map.removeLayer(this.cz_railway_buffer_20);
        this.map.removeLayer(this.cz_fault);
        this.map.removeLayer(this.cz_reservoir);

        this.cz_railway_area = null;
        this.railway = null;
        this.cz_railway_buffer5 = null;
        this.cz_railway_buffer_20 = null;
        this.cz_fault = null;
        this.cz_reservoir = null;
      }
    },
    // 加载DEM数据
    addDemWMSLayer() {
      if (this.isDemLayerAdded) {
        // 川藏研究区 GeoServer WMS 服务的 URL
        const cz_dem = L.tileLayer.wms("http://localhost:8080/geoserver/wms", {
          layers: "cztif:cz_ALOS_DEM_12m",
          format: "image/png",
          transparent: true,
          version: "1.3.0"
        });
        this.cz_dem = cz_dem;
        this.layerControl.addOverlay(cz_dem, "raster:川藏线DEM");
        this.layersWithRaster.push({
          name: "raster:川藏线DEM"
        });
      } else {
        // 将图层从图层控制器中删除
        // console.log('remove layer');
        this.layerControl.removeLayer(this.cz_dem);
        // 从地图中移除图层
        this.map.removeLayer(this.cz_dem);
        // 清除引用
        this.cz_dem = null;
      }
    },
    // insar数据加载
    addInSARLayer() {
      if (this.isInSARLayerAdded) {
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
        // 将图层组添加到图层控制器中
        this.insar_vel = combinedInSAR;
        this.layerControl.addOverlay(combinedInSAR, "insar:CZ形变速率_2023");
        this.layersWithRaster.push({
          name: "2023_CZ平均形变速率"
        });

        // 将金沙江形变添加到图层控制器中
        this.insar_JinS_vel = insar_JinS_vel;
        this.layerControl.addOverlay(
          insar_JinS_vel,
          "insar:金沙江形变速率_2023"
        );
        this.layersWithRaster.push({
          name: "2023_金沙江平均形变速率"
        });
      } else {
        // 将图层从图层控制器中删除
        // console.log('remove layer');
        this.layerControl.removeLayer(this.insar_vel);
        this.map.removeLayer(this.insar_vel);
        this.insar_vel = null;

        this.layerControl.removeLayer(this.insar_JinS_vel);
        this.map.removeLayer(this.insar_JinS_vel);
        this.insar_JinS_vel = null;
      }
    },
    handleSampleLoad(dataType) {
      if (dataType === "optical") {
        this.isSampleLayerAdded ^= 1;
        this.addOpticalSampleLayer();
      } else if (dataType === "insar") {
        this.isInsarSampleLayerAdded ^= 1;
        this.addInsarSampleLayer();
      }
    },
    addOpticalSampleLayer() {
      if (this.isSampleLayerAdded) {
        // 研究区滑坡样本点 GeoServer WFS 服务的 URL
        const landslide_sample =
          "http://localhost:8080/geoserver/chuanzang/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=chuanzang%3Alandslide_sample&outputFormat=application%2Fjson"; // Removed maxFeatures=50
        fetch(landslide_sample)
          .then(response => response.json())
          .then(data => {
            // 使用 GeoJSON 数据创建一个图层
            const geoJsonLayer = L.geoJSON(data, {
              // 这里可以根据需要定义样式
              style: feature => ({
                color: "#FF0000", // 设置边框为红色
                weight: 2, // 默认线宽
                fillColor: feature.properties.fillColor || "#000000", // 修改为黑色
                fillOpacity: 0 // 设置填充透明
              }),
              onEachFeature: (feature, layer) => {
                layer.on("click", e => {
                  // Call a method to create a popup on the clicked feature
                  // Only continue if the map and layer are still valid
                  if (this.map && this.cz_landslide_sample) {
                    this.createPopup(feature.properties, e.latlng);
                  }
                });
              }
            });
            this.cz_landslide_sample = geoJsonLayer;
            // 将图层添加到图层控制器中
            this.layerControl.addOverlay(
              geoJsonLayer,
              "20km缓冲区滑坡光学样本"
            );
            this.layersWithAttributes.push({
              name: "20km缓冲区滑坡样本",
              attributes: data.features.map(f => f.properties)
            });
          })
          .catch(error => {
            console.error("Error fetching the WFS data: ", error);
          });
      } else {
        // 将图层从图层控制器中删除
        // console.log('remove layer');
        this.layerControl.removeLayer(this.cz_landslide_sample);
        // 从地图中移除图层
        this.map.removeLayer(this.cz_landslide_sample);
        // 清除引用
        this.cz_landslide_sample = null;
      }
    },
    addInsarSampleLayer() {
      if (this.isInsarSampleLayerAdded) {
        // 研究区滑坡样本点 GeoServer WFS 服务的 URL
        const insar_sample =
          "http://localhost:8080/geoserver/chuanzang/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=chuanzang%3AJinS_InSAR_Sample&outputFormat=application%2Fjson";
        fetch(insar_sample)
          .then(response => response.json())
          .then(data => {
            // 使用 GeoJSON 数据创建一个图层
            const geoJsonLayer = L.geoJSON(data, {
              // 这里可以根据需要定义样式
              style: feature => ({
                color: "#FF0000", // 设置边框为红色
                weight: 2, // 默认线宽
                fillColor: feature.properties.fillColor || "#000000", // 修改为黑色
                fillOpacity: 0 // 设置填充透明
              })
              // onEachFeature: (feature, layer) => {
              //   layer.on('click', (e) => {
              //     // Call a method to create a popup on the clicked feature
              //     this.createPopup(feature.properties, e.latlng);
              //   });
              // }
            });
            this.JinS_InSAR_sample = geoJsonLayer;
            // 将图层添加到图层控制器中
            this.layerControl.addOverlay(geoJsonLayer, "金沙江InSAR样本");
            this.layersWithAttributes.push({
              name: "金沙江InSAR样本",
              attributes: data.features.map(f => f.properties)
            });
          })
          .catch(error => {
            console.error("Error fetching the WFS data: ", error);
          });
      } else {
        // 将图层从图层控制器中删除
        console.log("remove layer");
        this.layerControl.removeLayer(this.JinS_InSAR_sample);
        // 从地图中移除图层
        this.map.removeLayer(this.JinS_InSAR_sample);
        // 清除引用
        this.JinS_InSAR_sample = null;
      }
    },
    calculate(method) {
      if (method == "slope" && !this.isSlopeLayerAdded) {
        this.addSlopeLayer();
        this.isSlopeLayerAdded = true;
      } else if (method == "aspect" && !this.isAspectLayerAdded) {
        this.addAspectLayer();
        this.isAspectLayerAdded = true;
      } else if (method == "v2r" && !this.isV2RLayerAdded) {
        this.addV2R();
        this.isV2RLayerAdded = true;
      } else if (method == "r2v" && !this.isR2VLayerAdded) {
        this.addR2V();
        this.isR2VLayerAdded = true;
      }
    },
    addSlopeLayer() {
      const slopeLayer = L.tileLayer.wms(
        "http://localhost:8080/geoserver/wms",
        {
          layers: "cztif:cz_slope",
          format: "image/png",
          transparent: true,
          version: "1.3.0"
        }
      );
      // Optional: Keep track of the WMS layer in the component's data
      // This allows for easier manipulation (e.g., toggling) later on
      this.slopeLayer = slopeLayer;
      this.layerControl.addOverlay(slopeLayer, "raster:CZ_Slope");
      this.layersWithRaster.push({
        name: "raster:CZ_Slope"
      });
    },
    addAspectLayer() {
      const slopeLayer = L.tileLayer.wms(
        "http://localhost:8080/geoserver/wms",
        {
          layers: "cztif:cz_aspect",
          format: "image/png",
          transparent: true,
          version: "1.3.0"
        }
      );
      // Optional: Keep track of the WMS layer in the component's data
      // This allows for easier manipulation (e.g., toggling) later on
      this.slopeLayer = slopeLayer;
      this.layerControl.addOverlay(slopeLayer, "raster:CZ_Aspect");
      this.layersWithRaster.push({
        name: "raster:CZ_Aspect"
      });
    },
    addV2R() {
      const v2rLayer = L.tileLayer.wms("http://localhost:8080/geoserver/wms", {
        layers: "cztif:CZ_tif_Sample",
        format: "image/png",
        transparent: true,
        version: "1.3.0"
      });
      // Optional: Keep track of the WMS layer in the component's data
      // This allows for easier manipulation (e.g., toggling) later on
      this.v2rLayer = v2rLayer;
      this.layerControl.addOverlay(v2rLayer, "vec2raster:opticalSample");
      this.layersWithRaster.push({
        name: "vec2raster:opticalSample"
      });
    },
    addR2V() {
      const r2vLayer = L.tileLayer.wms("http://localhost:8080/geoserver/wms", {
        layers: "chuanzang:cz_result",
        format: "image/png",
        transparent: true,
        version: "1.3.0"
      });
      // Optional: Keep track of the WMS layer in the component's data
      // This allows for easier manipulation (e.g., toggling) later on
      this.r2vLayer = r2vLayer;
      this.layerControl.addOverlay(r2vLayer, "raster2vec:opticalRes");
      this.layersWithRaster.push({
        name: "raster2vec:opticalRes"
      });
    },
    createPopup(properties, latlng) {
      // Create a Leaflet popup and set its content based on the feature properties
      const popupContent = this.generatePopupContent(properties);
      L.popup().setLatLng(latlng).setContent(popupContent).openOn(this.map);
    },
    generatePopupContent(properties) {
      let content = '<div class="popup-content">';
      for (const key in properties) {
        // 对每个属性创建一行，格式为 "Key: Value"
        content += `<div><strong>${key}</strong>: ${properties[key]}</div>`;
      }
      content += "</div>";
      return content;
    }
  }
};
</script>

<style scoped>
.geo-system {
  position: relative;
  height: 92.5vh;
}
.map-container {
  height: calc(100%);
  /* Adjust height for status bar */
}

.status-bar {
  display: flex;
  position: relative;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3vh;
  /* Adjust as necessary */
  background-color: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(5px);
  /* Semi-transparent black */
  color: white;
  padding: 2px 2px;
  justify-content: flex-end;
  align-items: center;
  font-size: 15px;
  z-index: 500;
  /* Adjust as necessary */
}

/* Scoped styles with deep selector to target layer control items */
::v-deep .leaflet-control-layers-selector {
  text-align: center;
  /* Aligns text to the left */
}
/* Fix for the layer labels if needed */
::v-deep .leaflet-control-layers label {
  display: flex;
  align-items: center;
  text-align: left;
}
/* 使用 ::v-deep 选择器来覆盖 Leaflet 控件的默认样式 */
::v-deep .leaflet-top.leaflet-right {
  top: 7vh !important;
  /* 根据需要调整这个值 */
}
</style>
