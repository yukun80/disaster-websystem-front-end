<template>
  <el-dialog
    v-model="DataDeletePanelVisible"
    title="删除数据"
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
        <el-button type="danger" @click="confirmClick"> 删除 </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, watch } from "vue";
import { ElNotification } from "element-plus";
import axios from "axios";

const DataDeletePanelVisible = ref(false);
const emit = defineEmits(["DeleteDataPanel-close", "load-data"]);

const formLabelWidth = "150px";

const workspaces = ref([]);
const layers = ref([]);
const selectedWorkspace = ref(null);
const selectedLayer = ref(null);

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
  try {
    const response = await axios.post("http://localhost:5000/delete_data", {
      layer_name: layerName,
      workspace: finalWorkSpace,
      layer_class: layerClass
    });

    if (response.status === 200) {
      console.log("Success:", response.data);
      // 这里可以添加更多的UI逻辑来通知用户操作成功
      notification1();
    } else {
      console.error("Error:", response.data);
      // 这里可以添加UI逻辑来处理不同的错误情况
      notification2();
    }
  } catch (error) {
    console.error("Error:", error);
    // 处理网络错误或其他错误类型
    alert("An error occurred while deleting the layer and store.");
  }
};
const cancelClick = () => {
  // 充值表单变量
  selectedWorkspace.value = null;
  selectedLayer.value = null;
  // 关闭弹窗
  emit("DeleteDataPanel-close");
};
const notification1 = () => {
  ElNotification({
    title: "数据删除",
    message: "数据已完全删除",
    duration: 0, // 设置为0则不会自动关闭
    type: "success"
  });
};
const notification2 = () => {
  ElNotification({
    title: "数据删除",
    message: "删除失败，请检查是否有权限或正在使用",
    duration: 0, // 设置为0则不会自动关闭
    type: "error"
  });
};
</script>
