<template>
  <el-dialog
    v-model="DataAddPanelVisible"
    title="添加数据"
    width="500"
    style="color: #000; background-color: #f0f2f5"
  >
    <el-form-item label="选择工作区" :label-width="formLabelWidth">
      <el-select v-model="selectedWorkspace" @change="workspaceChanged">
        <el-option
          v-for="workspace in workspaces"
          :key="workspace"
          :label="workspace"
          :value="workspace"
        />
      </el-select>
    </el-form-item>
    <el-form-item label="选择数据" :label-width="formLabelWidth">
      <el-select v-model="selectedLayer">
        <el-option
          v-for="layer in layers"
          :key="layer[0]"
          :label="layer[0]"
          :value="layer"
        />
      </el-select>
    </el-form-item>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="cancelClick">取消</el-button>
        <el-button type="primary" @click="confirmClick"> 确定 </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, watch } from "vue";
import axios from "axios";
import { ElNotification } from "element-plus";

const DataAddPanelVisible = ref(false);
const emit = defineEmits(["AddDataPanel-close", "load-data"]);

const formLabelWidth = "150px";

const workspaces = ref([]);
const layers = ref([]);
const selectedWorkspace = ref(null);
const selectedLayer = ref(null);
const shapefile_url = ref(null);

// 获取工作区列表
const fetchWorkspaces = async () => {
  try {
    const response = await axios.get(`http://localhost:5000/get_workspaces`);
    if (response.data.workspaces) {
      // console.log("Loaded workspaces:", response.data.workspaces);
      workspaces.value = response.data.workspaces;
      // console.log("workspaces:", workspaces.value);
    } else {
      console.error("Failed to fetch workspaces:", response.data.error);
    }
  } catch (error) {
    console.error("Fetch workspaces error:", error);
  }
};

fetchWorkspaces();
// 根据选定的工作区获取图层列表
watch(selectedWorkspace, newWorkspace => {
  if (newWorkspace) {
    fetchLayers(newWorkspace);
  } else {
    layers.value = [];
  }
});
const fetchLayers = async workspace => {
  try {
    const response = await axios.get(
      `http://localhost:5000/get_layers?workspace=${workspace}`
    );
    if (response.data.layers) {
      layers.value = response.data.layers;
    } else {
      console.error("Failed to fetch layers:", response.data.error);
    }
  } catch (error) {
    console.error("Error fetching layers:", error);
  }
};
// 包装方法，当工作区改变时调用
const workspaceChanged = newWorkspace => {
  selectedWorkspace.value = newWorkspace;
  fetchLayers(newWorkspace);
};
const confirmClick = async () => {
  const finalWorkSpace = selectedWorkspace.value;
  const [layerName, layerClass] = selectedLayer.value;
  if (layerClass === "featureType") {
    try {
      const response = await axios.get(
        `http://localhost:5000/get_geojson?layer_name=${layerName}&workspace=${finalWorkSpace}`
      );
      shapefile_url.value = response.data.geojson_url;
      console.log("geojson_url:", shapefile_url.value);
      emit(
        "load-data",
        layerClass,
        finalWorkSpace,
        layerName,
        shapefile_url.value
      );
    } catch (error) {
      console.error("Error fetching geojson:", error);
    }
  } else if (layerClass === "coverage") {
    emit("load-data", layerClass, finalWorkSpace, layerName, null);
  }
  notification1();
};
const cancelClick = () => {
  // 重置表单变量
  selectedWorkspace.value = null;
  selectedLayer.value = null;
  shapefile_url.value = null;
  // 关闭对话框
  emit("AddDataPanel-close");
};
const notification1 = () => {
  ElNotification({
    title: "添加数据",
    message: "数据加载成功",
    duration: 0, // 设置为0则不会自动关闭
    type: "success"
  });
};
</script>
