<template>
  <el-drawer
    :direction="direction"
    :size="'30%'"
    style="color: #000; background-color: #f0f2f5"
  >
    <template #header>
      <h3>地质灾害定量评估</h3>
    </template>
    <template #default>
      <el-form
        :model="form"
        label-width="40%"
        label-position="left"
        size="large"
      >
        <el-form-item label="滑坡检测模型选择">
          <el-radio-group v-model="radio1">
            <el-radio :label="1" size="large">光学遥感滑坡早期检测</el-radio>
            <el-radio :label="2" size="large">InSAR滑坡形变异常检测</el-radio>
            <el-radio :label="3" size="large">多源集成机器学习</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="标准化遥感数据选择">
          <el-select
            v-model="form.inputPath1.path"
            placeholder="请选择数据集路径："
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
        <el-form-item label="请选择样本路径：">
          <el-select
            v-model="form.inputPath2.path"
            placeholder="请选择数据集路径"
            style="width: 250px"
            @change="() => onOutputPathChange()"
          >
            <el-option
              v-for="item in form.inputPath2.paths"
              :key="item.name"
              :label="item.name"
              :value="item.name"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <!-- ECharts容器 -->
      <div ref="chartContainer2" style="height: 400px; width: 100%"></div>
    </template>
    <template #footer>
      <div style="flex: auto">
        <el-button @click="cancelClick">取消</el-button>
        <el-button type="primary" @click="confirmClick">评估</el-button>
      </div>
    </template>
  </el-drawer>
</template>

<script setup>
import { reactive, ref, inject, h, watchEffect } from "vue";
import { ElNotification, ElProgress } from "element-plus";
import axios from "axios";
import * as echarts from "echarts";

const direction = ref("ltr");
const emit = defineEmits(["quantify-close"]);
const radio1 = ref(1);
const form = reactive({
  inputPath1: { path: "", paths: [] },
  inputFullPath1: "/default",
  inputPath2: { path: "", paths: [] },
  outputFullPath2: "/default" // 初始化输出路径2的完整路径
});
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
  const outputPath = "inputPath2";
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
  const selectedPath = form.inputPath2.path;
  const selected = form.inputPath2.paths.find(
    path => path.name === selectedPath
  );
  if (selected && selected.isDir) {
    const newPath = `${form.outputFullPath2}/${selectedPath}`; // 构建新的完整路径
    await fetchOutputPaths(newPath);
  }
};
fetchInputPaths(1, "/default");
fetchOutputPaths("/default");
// 全局日志信息传递
const eventBus = inject("eventBus");
const addLog = eventBus.addLog;
const chartContainer2 = ref(null);
let myChart2 = null; // 在适当的作用域内定义一个变量来持续存储图表实例

const option_quanify = {
  title: {
    text: "地质灾害早期识别定量分析",
    left: "center",
    top: 0
  },
  legend: { bottom: 0 },
  tooltip: {},
  dataset: {
    dimensions: [
      "product",
      "光学模型早期识别",
      "InSAR模型形变异常识别",
      "综合模型早期识别"
    ],
    source: []
  },
  xAxis: { type: "category" },
  yAxis: {},
  series: [
    { type: "bar", label: { show: true, position: "top" } },
    { type: "bar", label: { show: true, position: "top" } },
    {
      type: "bar",
      label: { show: true, position: "top" },
      itemStyle: { color: "#FA8072" }
    }
  ]
};

watchEffect(() => {
  if (chartContainer2.value && !myChart2) {
    myChart2 = echarts.init(chartContainer2.value);
    myChart2.setOption(option_quanify);
  }
});

const updateChartData = metrics => {
  // 根据当前选择的radio1值，确定数据源的维度标签
  let dimensionLabel = "";
  if (radio1.value === 1) {
    dimensionLabel = "光学模型早期识别";
  } else if (radio1.value === 2) {
    dimensionLabel = "InSAR模型形变异常识别";
  } else if (radio1.value === 3) {
    dimensionLabel = "综合模型早期识别";
  }

  // 检查图表中是否已有数据，如果没有，则初始化所有可能的维度
  if (!option_quanify.dataset.source.length) {
    option_quanify.dataset.source = metrics.map(metric => ({
      product: metric.product,
      光学模型早期识别: 0,
      InSAR模型形变异常识别: 0,
      综合模型早期识别: 0
    }));
  }

  // 更新当前选定模型的数据，其他模型的数据保持不变
  option_quanify.dataset.source.forEach((entry, index) => {
    if (metrics[index]) {
      // 确保metrics数组与图表数据源数组长度一致
      entry[dimensionLabel] = metrics[index][dimensionLabel];
    }
  });

  if (myChart2) {
    myChart2.setOption(option_quanify, { notMerge: true });
  }
};
const confirmClick = async () => {
  const dir_buffer_tiles = form.inputFullPath1; // 切片
  const dir_buffer_sample = form.outputFullPath2; // 样本
  addLog("执行定量评估分析;");
  try {
    notification1();
    const response = await axios.post(`http://localhost:5000/get_metrics`, {
      radio1: radio1.value,
      dir_buffer_tiles,
      dir_buffer_sample
    });
    console.log(response.data); // 检测成功后的回应
    // 可以在这里添加更多的UI反馈，比如成功消息提示
    notification2();
    // 更新ECharts图表数据
    if (response.data && response.data.metrics) {
      updateChartData(response.data.metrics);
    }
    // 重置输入路径变量
    form.inputPath1 = { path: "", paths: [] };
    form.inputFullPath1 = "/default";
    // 重置样本路径
    form.inputPath2 = { path: "", paths: [] };
    form.outputFullPath2 = "/default";
    fetchInputPaths(1, "/default");
    fetchOutputPaths("/default");
  } catch (error) {
    console.error("Detecting error:", error);
    notification3();
  }
};
const cancelClick = () => {
  // 当用户点击取消按钮时，隐藏抽屉
  emit("quantify-close");
};
// 自定义通知，包含进度条
const notification1Instance = ref(null); // 用来存储第一个通知的引用
const notification1 = () => {
  notification1Instance.value = ElNotification({
    title: "定量评估",
    message: h("div", [
      "正在进行定量评估分析，请稍候",
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
    title: "定量评估",
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
    title: "定量评估",
    message: "运行失败！",
    uration: 0, // 设置为0则不会自动关闭
    type: "error"
  });
};
</script>
