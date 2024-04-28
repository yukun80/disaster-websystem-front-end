<template>
  <el-drawer
    :model-value="multiDetectVisible"
    :direction="direction"
    :size="'25%'"
    style="color: #000; background-color: #f0f2f5"
  >
    <template #header>
      <h3>多源遥感综合检测</h3>
    </template>
    <template #default>
      <el-form
        :model="form"
        label-width="40%"
        label-position="left"
        size="large"
      >
        <el-form-item label="多维致灾因子综合遥感数据">
          <el-select
            v-model="form.inputPath1.path"
            placeholder="请选择数据集路径"
            style="width: 250px"
            @change="() => onInputPathChange(1)"
          >
            <el-option
              v-for="item in form.inputPath1.paths"
              :key="item.name"
              :label="item.name"
              :value="item.name"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="滑坡检测模型选择">
          <el-radio-group v-model="radio1">
            <el-radio :label="1" size="large">滑坡灾害综合加权评估</el-radio>
            <el-radio :label="2" size="large">多源集成机器学习</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="检测结果保存位置">
          <el-select
            v-model="form.outputPath2.path"
            placeholder="请选择保存位置"
            style="width: 240px"
            @change="() => onOutputPathChange()"
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

const multiDetectVisible = ref(false); // 初始状态可以是 true 或 false，根据需求设定
const emit = defineEmits(["load-result"]);

const direction = ref("rtl");
const radio1 = ref("1");

const form = reactive({
  inputPath1: { path: "", paths: [] },
  inputFullPath1: "/default",
  outputPath2: { path: "", paths: [] },
  outputFullPath2: "/default", // 初始化输出路径2的完整路径
  dataCheckStatus: null
});
const result_name = ref("");

const fetchInputPaths = async (inIndex, dir) => {
  // 根据Index决定更新哪个输出路径的数据
  let inputPath = "";
  if (inIndex === 1) {
    inputPath = "inputPath1";
  }
  try {
    const response = await axios.get(
      `http://localhost:5000/list_paths?dir=${dir}`
    );
    form[inputPath].paths = response.data;
    if (inIndex === 1) {
      form.inputFullPath1 = dir;
    }
  } catch (error) {
    console.error("There was an error!", error);
    alert("加载路径失败，请稍后再试");
  }
};

const fetchOutputPaths = async dir => {
  const outputPath = "outputPath2";
  try {
    const response = await axios.get(
      `http://localhost:5000/list_paths?dir=${dir}`
    );
    form[outputPath].paths = response.data;
    form.outputFullPath2 = dir;
  } catch (error) {
    console.error("There was an error!", error);
    alert("加载路径失败，请稍后再试");
  }
};

const onInputPathChange = async inIndex => {
  let selectedPath = "";
  let selected = "";
  if (inIndex === 1) {
    selectedPath = form.inputPath1.path;
    selected = form.inputPath1.paths.find(path => path.name === selectedPath);
  }
  if (selected && selected.isDir) {
    let newPath = "";
    if (inIndex === 1) {
      newPath = `${form.inputFullPath1}/${selectedPath}`;
    }
    await fetchInputPaths(inIndex, newPath);
  } else {
    if (inIndex === 1) {
      form.inputFullPath1 = `${form.inputFullPath1}/${selectedPath}`;
    }
  }
};

const onOutputPathChange = async () => {
  const selectedPath = form.outputPath2.path;
  const selected = form.outputPath2.paths.find(
    path => path.name === selectedPath
  );
  if (selected && selected.isDir) {
    const newPath = `${form.outputFullPath2}/${selectedPath}`; // 构建新的完整路径
    await fetchOutputPaths(newPath);
  }
};

fetchInputPaths(1, "/default");
// fetchInputPaths(2, "/default");
// fetchInputPaths(3, "/default");
fetchOutputPaths("/default");
// 全局日志信息传递
const eventBus = inject("eventBus");
const addLog = eventBus.addLog;
const confirmClick = async () => {
  const optical_file = form.inputFullPath1; // 光学遥感检测结果文件
  // const insar_file = form.inputFullPath2; // InSAR形变灾害检测结果文件
  // const landslide_file = form.inputFullPath3; // 滑坡易发性评估结果文件
  const res_folder = form.outputFullPath2; // 结果输出文件夹
  const res_name = result_name.value; // 结果文件名
  console.log(optical_file);
  console.log(res_folder);
  console.log(result_name.value);
  addLog("执行集成机器学习模型综合检测;");
  try {
    notification1();
    const response = await axios.post(
      `http://localhost:5000/predict_multiResult`,
      {
        optical_file,
        // insar_file,
        // landslide_file,
        res_folder,
        res_name
      }
    );
    console.log(response.data); // 检测成功后的回应
    // 可以在这里添加更多的UI反馈，比如成功消息提示
    notification2();
  } catch (error) {
    console.error("Detecting error:", error);
    notification3();
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
      console.log("结束" + workspace);
      emit("load-result", workspace, res_name_no_ext);
      console.log(`${"predict_result"}:${res_name_no_ext}`);
    })
    .catch(() => {
      console.log("cancel");
    });
};
const cancelClick = async () => {
  // 重置输入路径变量
  form.inputPath1 = { path: "", paths: [] };
  form.inputFullPath1 = "/default";
  // 重置输出路径变量
  form.outputPath2 = { path: "", paths: [] };
  form.outputFullPath2 = "/default";
  // 重置数据检查状态
  form.dataCheckStatus = null;
  // 清空结果文件名
  result_name.value = "";
  fetchInputPaths(1, "/default");
  // fetchInputPaths(2, "/default");
  // fetchInputPaths(3, "/default");
  fetchOutputPaths("/default");
  // 当用户点击取消按钮时，隐藏抽屉
  emit("multiDetect-close");
};
// 自定义通知，包含进度条
const notification1Instance = ref(null); // 用来存储第一个通知的引用
const notification1 = () => {
  notification1Instance.value = ElNotification({
    title: "集成机器学习模型",
    message: h("div", [
      "正在进行集成机器学习模型综合检测，请稍候",
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
    title: "集成机器学习模型",
    message: "运行成功！",
    uration: 0, // 设置为0则不会自动关闭
    type: "success"
  });
};
const notification3 = () => {
  if (notification1Instance.value) {
    notification1Instance.value.close(); // 如果第一个通知仍在显示，则关闭它
  }
  ElNotification({
    title: "集成机器学习模型",
    message: "运行失败！",
    uration: 0, // 设置为0则不会自动关闭
    type: "error"
  });
};
</script>
