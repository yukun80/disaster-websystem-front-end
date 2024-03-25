<template>
  <el-drawer
    :direction="direction"
    :size="'35%'"
    style="color: #000; background-color: #f0f2f5"
  >
    <template #header>
      <h3>地质灾害定量评估</h3>
    </template>
    <!-- ECharts 容器 -->
    <!-- ECharts 容器 -->
    <div
      ref="chartContainer1"
      style="height: 400px; width: 100%; margin-bottom: 20px"
    ></div>
    <!-- 第二个ECharts容器 -->
    <div ref="chartContainer2" style="height: 400px; width: 100%"></div>
    <template #footer>
      <div style="flex: auto">
        <el-button @click="cancelClick">取消</el-button>
        <el-button type="primary" @click="confirmClick">评估</el-button>
      </div>
    </template>
  </el-drawer>
</template>

<script setup>
import { ref, watchEffect } from "vue";
import { ElMessageBox } from "element-plus";
import * as echarts from "echarts";

const direction = ref("ltr");
const emit = defineEmits(["quantify-close"]);
const chartContainer1 = ref(null);
const chartContainer2 = ref(null);
// ECharts 图表配置
const option_amount = {
  title: {
    text: "地质灾害早期识别数量", // 图表的名称
    left: "center", // 标题水平居中
    top: 0, // 在组件的底部
    textStyle: {
      // 可以在这里定制文字样式，例如字体大小、颜色等
    }
  },
  tooltip: {},
  dataset: {
    source: [
      ["product", "amount"],
      ["综合模型早期识别", 183],
      ["InSAR模型形变异常识别", 379],
      ["光学模型早期识别", 299]
    ]
  },
  grid: {
    containLabel: true,
    right: "20%" // 增加右边距以适应X轴标签
  },
  xAxis: {
    type: "value",
    name: "amount"
  },
  yAxis: {
    type: "category"
    // 由数据的第一列（'product'）提供类目数据
  },
  series: [
    {
      type: "bar",
      label: {
        show: true, // 显示标签
        position: "right", // 标签位置为顶部
        formatter: function (params) {
          return params[1]; // 或者对于某些情况，可能需要 params.data 或 params.value[1] 等
        }
      },
      itemStyle: {
        color: function (params) {
          // params.dataIndex 获取当前数据项的索引
          // params.value 获取当前数据项的值
          // 这里我们使用 params.dataIndex 来获取产品名称
          const product = params.value[0]; // 获取产品名称
          if (product.includes("光学")) {
            return "#5470C6"; // 蓝色
          } else if (product.includes("InSAR")) {
            return "#91CC75"; // 绿色
          } else if (product.includes("综合")) {
            return "#FA8072"; // 红色
          }
          return "#ddd"; // 默认颜色
        }
      }
    }
  ]
};

const option_quanify = {
  title: {
    text: "地质灾害早期识别定量分析", // 图表的名称
    left: "center", // 标题水平居中
    top: 0, // 在组件的底部
    textStyle: {
      // 可以在这里定制文字样式，例如字体大小、颜色等
    }
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
    source: [
      {
        product: "Precision",
        光学模型早期识别: 79.17,
        InSAR模型形变异常识别: 42.27,
        综合模型早期识别: 82.17
      },
      {
        product: "Recall",
        光学模型早期识别: 65.64,
        InSAR模型形变异常识别: 70.19,
        综合模型早期识别: 82.18
      },
      {
        product: "F1-Score",
        光学模型早期识别: 71.77,
        InSAR模型形变异常识别: 52.77,
        综合模型早期识别: 72.99
      },
      {
        product: "FalseAlarm",
        光学模型早期识别: 43.33,
        InSAR模型形变异常识别: 52.67,
        综合模型早期识别: 37.33
      }
    ]
  },
  xAxis: { type: "category" },
  yAxis: {},
  series: [
    {
      type: "bar",
      label: {
        show: true, // 显示标签
        position: "top", // 标签位置为顶部
        formatter: function (params) {
          return params[1]; // 或者对于某些情况，可能需要 params.data 或 params.value[1] 等
        }
      }
    },
    {
      type: "bar",
      label: {
        show: true, // 显示标签
        position: "top", // 标签位置为顶部
        formatter: function (params) {
          return params[1]; // 或者对于某些情况，可能需要 params.data 或 params.value[1] 等
        }
      }
    },
    {
      type: "bar",
      label: {
        show: true, // 显示标签
        position: "top", // 标签位置为顶部
        formatter: function (params) {
          return params[1]; // 或者对于某些情况，可能需要 params.data 或 params.value[1] 等
        }
      },
      itemStyle: {
        color: "#FA8072" // 为“综合模型早期识别”设置红色
      }
    }
  ]
};

watchEffect(() => {
  if (chartContainer1.value) {
    const myChart1 = echarts.init(chartContainer1.value);
    myChart1.setOption(option_amount); // 为第一个容器设置第一个图表选项
  }
  if (chartContainer2.value) {
    const myChart2 = echarts.init(chartContainer2.value);
    myChart2.setOption(option_quanify); // 为第二个容器设置第二个图表选项
  }
});
const cancelClick = () => {
  // 当用户点击取消按钮时，隐藏抽屉
  emit("quantify-close");
};
function confirmClick() {
  ElMessageBox.confirm(`Are you confirm to chose this option?`)
    .then(() => {
      emit("quantify-close");
    })
    .catch(() => {
      // catch error
    });
}
</script>
