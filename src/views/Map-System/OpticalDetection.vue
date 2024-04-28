<template>
  <el-drawer
    :model-value="opticalDetectVisible"
    :direction="direction"
    :size="'25%'"
    style="color: #000; background-color: #f0f2f5"
  >
    <template #header>
      <h3>光学遥感检测</h3>
    </template>
    <template #default>
      <el-form :model="form" label-width="30%" label-position="left">
        <el-form-item label="标准化遥感数据集">
          <el-select
            v-model="form.outputPath1.path"
            placeholder="请选择数据集路径"
            style="width: 250px"
            @change="() => onOutputPathChange(1)"
          >
            <el-option
              v-for="item in form.outputPath1.paths"
              :key="item.name"
              :label="item.name"
              :value="item.name"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="滑坡检测模型选择">
          <el-radio v-model="radio1" size="large">多波段特征融合检测</el-radio>
        </el-form-item>
        <el-form-item label="检测结果保存位置">
          <el-select
            v-model="form.outputPath2.path"
            placeholder="请选择保存位置"
            style="width: 240px"
            @change="() => onOutputPathChange(2)"
          >
            <el-option
              v-for="item in form.outputPath2.paths"
              :key="item.name"
              :label="item.name"
              :value="item.name"
            />
            <template #empty></template>
          </el-select>
        </el-form-item>
        <el-form-item label="滑坡检测结果文件名">
          <el-input
            v-model="result_name"
            placeholder="输入检测结果文件名"
            style="width: 250px"
          />
        </el-form-item>
        <!-- 模型检测按钮 -->
      </el-form>
    </template>
    <template #footer>
      <div style="flex: auto">
        <el-button @click="cancelClick">cancel</el-button>
        <el-button type="primary" @click="confirmClick">运行</el-button>
      </div>
    </template>
  </el-drawer>
</template>

<script setup>
import { reactive, ref, inject, h } from "vue";
import { ElMessageBox, ElNotification, ElProgress } from "element-plus";
import axios from "axios";

const opticalDetectVisible = ref(false);
const emit = defineEmits(["load-result", "optical-close"]);

const direction = ref("rtl");
const radio1 = ref("1");

const form = reactive({
  outputPath1: { path: "", paths: [] }, // 绑定到输出选择的select组件
  outputFullPath1: "/default", // 初始化输出路径1的完整路径
  outputPath2: { path: "", paths: [] },
  outputFullPath2: "/default", // 初始化输出路径2的完整路径
  dataCheckStatus: null
});
const result_name = ref("");

const fetchOutputPaths = async (outIndex, dir) => {
  // 根据outIndex决定更新哪个输出路径的数据
  const outputPath = outIndex === 1 ? "outputPath1" : "outputPath2";
  try {
    const response = await axios.get(
      `http://localhost:5000/list_paths?dir=${dir}`
    );
    form[outputPath].paths = response.data;
    form[outIndex === 1 ? "outputFullPath1" : "outputFullPath2"] = dir;
  } catch (error) {
    console.error("There was an error!", error);
    alert("加载路径失败，请稍后再试");
  }
};
const onOutputPathChange = async outIndex => {
  const selectedPath =
    form[outIndex === 1 ? "outputPath1" : "outputPath2"].path;
  const selected = form[
    outIndex === 1 ? "outputPath1" : "outputPath2"
  ].paths.find(path => path.name === selectedPath);
  if (selected && selected.isDir) {
    const newPath = `${
      form[outIndex === 1 ? "outputFullPath1" : "outputFullPath2"]
    }/${selectedPath}`; // 构建新的完整路径
    await fetchOutputPaths(outIndex, newPath);
  }
};

fetchOutputPaths(1, "/default"); // 初始化输出路径
fetchOutputPaths(2, "/default"); // 初始化输出路径
// 全局日志信息传递
const eventBus = inject("eventBus");
const addLog = eventBus.addLog;
const confirmClick = async () => {
  const tiles_folder = form.outputFullPath1; // 预处理后的影像文件夹
  const res_folder = form.outputFullPath2; // 结果输出文件夹
  const res_name = result_name.value; // 结果文件名
  console.log(tiles_folder);
  console.log(res_folder);
  console.log(result_name.value);
  addLog("执行光学遥感地质灾害检测模型;");
  try {
    notification1();
    const response = await axios.post(`http://localhost:5000/predict_images`, {
      tiles_folder,
      res_folder,
      res_name
    });
    console.log(response.data); // 检测成功后的回应
    notification2(); // 通知用户检测成功
    // 可以在这里添加更多的UI反馈，比如成功消息提示
  } catch (error) {
    console.error("Detecting error:", error);
    notification3(); // 通知用户检测失败
  }
  ElMessageBox.confirm(`是否将检测结果加载到当前地图`, {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "info"
  })
    .then(() => {
      const res_name = result_name.value; // 结果文件名
      const res_name_no_ext = res_name.split(".")[0];
      const workspace = "predict_result";
      console.log(workspace);
      emit("load-result", workspace, res_name_no_ext);
      console.log(`${"predict_result"}:${res_name_no_ext}`);
    })
    .catch(() => {
      console.log("cancel");
    });
};
const cancelClick = () => {
  // 重置输出路径相关变量
  form.outputPath1 = { path: "", paths: [] };
  form.outputFullPath1 = "/default";
  form.outputPath2 = { path: "", paths: [] };
  form.outputFullPath2 = "/default";

  // 重置数据检查状态变量
  form.dataCheckStatus = null;

  // 清空结果文件名
  result_name.value = "";
  fetchOutputPaths(1, "/default"); // 初始化输出路径
  fetchOutputPaths(2, "/default"); // 初始化输出路径
  // 发出 'optical-close' 事件来关闭视图/对话框
  emit("optical-close");
};
// 自定义通知，包含进度条
const notification1Instance = ref(null); // 用来存储第一个通知的引用
const notification1 = () => {
  notification1Instance.value = ElNotification({
    title: "光学遥感检测工具",
    message: h("div", [
      "正在进行光学遥感检测，请稍候",
      h(ElProgress, {
        percentage: 100,
        status: "info",
        indeterminate: true
      })
    ]),
    duration: 0, // 设置为0则不会自动关闭
    type: "info",
    onClose: () => {
      notification1Instance.value = null; // 清除引用当通知关闭时
    }
  });
};
const notification2 = () => {
  if (notification1Instance.value) {
    notification1Instance.value.close(); // 如果第一个通知仍在显示，则关闭它
  }
  ElNotification({
    title: "光学遥感检测工具",
    message: "运行成功！",
    duration: 0, // 设置为0则不会自动关闭
    type: "success"
  });
};
const notification3 = () => {
  if (notification1Instance.value) {
    notification1Instance.value.close(); // 如果第一个通知仍在显示，则关闭它
  }
  ElNotification({
    title: "光学遥感检测工具",
    message: "运行失败！",
    duration: 0, // 设置为0则不会自动关闭
    type: "error"
  });
};
</script>
