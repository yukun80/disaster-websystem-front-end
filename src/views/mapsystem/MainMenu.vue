<template>
  <div class="menu-component">
    <div
      class="menu-item"
      @mouseover="hoverMenu = 'data'"
      @mouseleave="hoverMenu = null"
    >
      <!-- <i class="icon-data-loading"></i> -->
      <span>数据加载</span>
      <ul class="submenu" v-show="hoverMenu === 'data'">
        <!-- Submenu items for data loading go here -->
        <div class="submenu-item" @click="addLayerToMap('optical')">
          光学遥感数据
        </div>
        <div class="submenu-item" @click="addLayerToMap('sar')">
          SAR遥感数据
        </div>
        <div class="submenu-item" @click="addLayerToMap('vector')">
          研究区矢量数据
        </div>
        <div class="submenu-item" @click="addLayerToMap('dem')">DEM数据</div>
        <div class="submenu-item" @click="addLayerToMap('insar')">
          InSAR形变结果数据
        </div>
      </ul>
    </div>
    <!-- Sample Loading Menu -->
    <div
      class="menu-item"
      @mouseover="hoverMenu = 'sample'"
      @mouseleave="hoverMenu = null"
    >
      <!-- <i class="icon-data-loading"></i> -->
      <span>样本数据集</span>
      <ul class="submenu" v-show="hoverMenu === 'sample'">
        <!-- Submenu items for data loading go here -->
        <div class="submenu-item" @click="addSampleToMap('optical')">
          光学样本数据集
        </div>
        <div class="submenu-item" @click="addSampleToMap('insar')">
          InSAR样本数据集
        </div>
      </ul>
    </div>
    <!-- Calculation Tools Menu -->
    <div
      class="menu-item"
      @mouseover="hoverMenu = 'calculation'"
      @mouseleave="hoverMenu = null"
    >
      <!-- <i class="icon-calc-tools"></i> -->
      <span>计算工具</span>
      <div class="submenu" v-show="hoverMenu === 'calculation'">
        <!-- Submenu items for calculation tools go here -->
        <div class="submenu-item" @click="openCalculatePanel('slope')">
          坡度计算
        </div>
        <div class="submenu-item" @click="openCalculatePanel('aspect')">
          坡向计算
        </div>
        <div class="submenu-item" @click="openCalculatePanel('v2r')">
          矢量转栅格
        </div>
        <div class="submenu-item" @click="openCalculatePanel('r2v')">
          栅格转矢量
        </div>
      </div>
    </div>
    <div
      class="menu-item"
      @mouseover="hoverMenu = 'analysis'"
      @mouseleave="hoverMenu = null"
    >
      <!-- <i class="icon-property-sheet"></i> -->
      <span>定量分析</span>
      <!-- <div class="submenu" v-show="hoverMenu === 'analysis'">
                <div class="submenu-item" @click="togglePropertySheet">显示属性表</div>
            </div> -->
    </div>

    <el-dropdown class="menu-item">
      <el-button type="primary">
        灾害检测<el-icon><arrow-down /></el-icon>
        <template #dot></template>
      </el-button>
      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item @click="optical = true">
            光学遥感检测
          </el-dropdown-item>
        </el-dropdown-menu>
        <el-dropdown-item @click="insar = true"> InSAR检测 </el-dropdown-item>
        <el-dropdown-item @click="sync = true">
          多源遥感综合检测
        </el-dropdown-item>
      </template>
    </el-dropdown>
  </div>
  <!-- ================================================================================================================ -->
  <!-- 栅格分析面板 -->
  <div
    class="calculate-panel"
    v-bind:class="{ visible: calculatePanel.visible }"
  >
    <!-- 根据 selectedTool 显示不同内容 -->
    <div v-if="calculatePanel.selectedTool === 'slope'">
      <h2>坡度计算</h2>
    </div>
    <div v-if="calculatePanel.selectedTool === 'aspect'">
      <h2>坡向计算</h2>
    </div>
    <div v-if="calculatePanel.selectedTool === 'v2r'">
      <h2>矢量转栅格</h2>
    </div>
    <div v-if="calculatePanel.selectedTool === 'r2v'">
      <h2>栅格转矢量</h2>
    </div>
    <!-- 公共面板内容 -->
    <div class="input-data">
      <label for="inputData">输入数据:</label>
      <select v-model="selectedLayer">
        <option v-for="layer in layers" :key="layer.name" :value="layer.name">
          {{ layer.name }}
        </option>
      </select>
    </div>
    <div class="save-location">
      <label for="saveLocation">保存位置:</label>
      <select>
        <!-- 数据库选项列表 -->
        <option value="CZ_Vector">CZ_Vector</option>
        <option value="CZ_Raster">CZ_Raster</option>
      </select>
    </div>
    <!-- 添加输入保存栅格数据集名称的文本框 -->
    <div class="input-data">
      <label for="inputData">保存名称:</label>
      <input type="text" name="inputData" id="inputData" />
    </div>
    <div class="checkbox-option">
      <input type="checkbox" checked />
      <label for="addToProject">是否加载到当前项目中</label>
    </div>
    <div class="button-group">
      <button
        class="btn btn-primary"
        @click="calculate(calculatePanel.selectedTool)"
      >
        运行
      </button>
      <button class="btn btn-secondary" @click="closeCalculatePanel">
        取消
      </button>
    </div>
  </div>
  <!-- 光学灾害检测面板 -->
  <el-drawer v-model="optical" :direction="direction">
    <template #header>
      <h3>光学遥感检测</h3>
    </template>
    <template #default>
      <el-form :model="form" label-width="30%" label-position="left">
        <!-- 动态渲染输入数据路径 -->
        <el-form-item class="input-data-label" label="输入数据">
          <div
            v-for="(inputPath, index) in form.inputPaths"
            :key="index"
            class="input-group"
          >
            <el-select
              v-model="inputPath.path"
              placeholder="请选择遥感数据"
              style="width: 250px"
              @change="() => onPathChange(index)"
            >
              <!-- inputPath 代表 inputPaths 数组中的当前迭代元素，即当前处理的输入路径对象： -->
              <el-option
                v-for="item in inputPath.paths"
                :key="item.name"
                :label="item.name"
                :value="item.name"
              />
            </el-select>
            <el-button
              v-if="index === form.inputPaths.length - 1"
              type="success"
              @click="addInputPath(index)"
            >
              添加数据
            </el-button>
          </div>
        </el-form-item>
        <!-- 输出数据路径选择 -->
        <el-form-item label="标准化影像输出保存位置">
          <el-select
            v-model="form.outputPath1.path"
            placeholder="请选择输出数据路径"
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
        <!-- 数据检查和预处理按钮 -->
        <el-form-item label="Step1：输入数据检查与预处理">
          <el-button type="success" @click="checkAndPreprocessData"
            >运行</el-button
          >
          <!-- 检测成功失败状态显示 -->
          <el-tag v-if="dataCheckStatus === 'success'" type="success"
            >检测成功</el-tag
          >
          <el-tag v-if="dataCheckStatus === 'failure'" type="danger"
            >检测失败</el-tag
          >
        </el-form-item>

        <el-form-item label="滑坡检测结果保存位置">
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
        <el-form-item label="Step2：滑坡检测">
          <el-button type="warning" @click="modelDetection">模型检测</el-button>
        </el-form-item>
      </el-form>
    </template>
    <template #footer>
      <div style="flex: auto">
        <el-button @click="cancelClick">cancel</el-button>
        <el-button type="primary" @click="confirmClick">confirm</el-button>
      </div>
    </template>
  </el-drawer>
</template>
<!-- ========================================================================================================== -->
<script>
import { ArrowDown } from "@element-plus/icons-vue";
import { reactive, ref } from "vue";
import { ElMessageBox } from "element-plus";
import axios from "axios";

export default {
  name: "MainMenu",
  components: {
    ArrowDown // 确保在此注册 ArrowDown 组件
  },
  emits: [
    "load-data",
    "load-sample",
    "calculate-tool",
    "run-model",
    "show-property-sheet"
  ],
  setup() {
    const optical = ref(false);
    const direction = ref("rtl");
    const radio1 = ref("多波段特征融合检测");
    const openOpticalDrawer = () => {
      optical.value = true;
    };
    const cancelClick = () => {
      optical.value = false;
    };
    const form = reactive({
      inputPaths: [{ path: "", paths: [] }], // 为每个输入路径添加独立的paths列表，每个输入路径包含一个当前选择的路径 (path) 和一个可选路径列表 (paths)。
      inputFullPath: [], // 新增变量以数组形式保存完整的路径
      outputPath1: { path: "", paths: [] }, // 绑定到输出选择的select组件
      outputFullPath1: "/default", // 初始化输出路径1的完整路径
      outputPath2: { path: "", paths: [] },
      outputFullPath2: "/default", // 初始化输出路径2的完整路径
      dataCheckStatus: null
    });
    const result_name = ref("");
    const addInputPath = index => {
      form.inputPaths.push({ path: "", paths: [] }); // 为新路径添加空选项列表
      fetchPaths(index + 1); // 为新添加的路径获取选项列表
    };
    const fetchPaths = async (index, dir = "/default") => {
      form.inputFullPath[index] = dir; // 保存当前路径
      try {
        const response = await axios.get(
          `http://localhost:5000/list_paths?dir=${dir}`
        );
        form.inputPaths[index].paths = response.data;
      } catch (error) {
        console.error("There was an error!", error);
        alert("加载路径失败，请稍后再试"); // 简单的用户反馈
      }
    };

    const fetchOutputPaths = async (outIndex, dir) => {
      // 根据outIndex决定更新哪个输出路径的数据
      const outputPath = outIndex === 1 ? "outputPath1" : "outputPath2";
      try {
        const response = await axios.get(
          `http://localhost:5000/list_paths?dir=${dir}`
        );
        form[outputPath].paths = response.data;
        form[outIndex === 1 ? "outputFullPath1" : "outputFullPath2"] = dir; // 更新当前完整路径
      } catch (error) {
        console.error("There was an error!", error);
        alert("加载路径失败，请稍后再试");
      }
    };
    // 动态修改
    const onPathChange = async index => {
      const selectedPath = form.inputPaths[index].path; // 用户选择的文件
      const selected = form.inputPaths[index].paths.find(
        //.find 方法遍历 paths 数组，对于每个元素（path），执行一个测试函数（path => path.name === selectedPath）。
        // 一旦找到一个对象的 name 属性与 selectedPath 相等，.find 方法就会返回这个对象（即 selected），如果找不到匹配项，则返回 undefined。
        path => path.name === selectedPath
      );
      if (selected && selected.isDir) {
        const newPath = `${form.inputFullPath[index]}/${selectedPath}`; // 动态构建新路径
        await fetchPaths(index, newPath);
      } else {
        form.inputFullPath[
          index
        ] = `${form.inputFullPath[index]}/${selectedPath}`;
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
    const checkAndPreprocessData = async () => {
      // 假设file_paths是选中的输入路径数组，output_folder是输出路径
      const file_paths = form.inputFullPath.join(","); // 如果有多个输入路径
      const output_folder = form.outputFullPath1; // 假设使用第一个输出路径作为示例
      console.log(file_paths); // 打印file_paths字符串‘
      console.log(output_folder); // 打印file_paths字符串
      try {
        const response = await axios.get(
          `http://localhost:5000/process_images`,
          {
            params: { file_paths, output_folder }
          }
        );
        console.log(response.data); // 处理成功后的回应
        // 可以在这里添加更多的UI反馈，比如成功消息提示
      } catch (error) {
        console.error("Processing error:", error);
        // 错误处理，比如显示错误消息
      }
    };
    const modelDetection = async () => {
      const tiles_folder = form.outputFullPath1; // 预处理后的影像文件夹
      const res_folder = form.outputFullPath2; // 结果输出文件夹
      const res_name = result_name.value; // 结果文件名
      console.log(tiles_folder);
      console.log(res_folder);
      console.log(result_name.value);
      try {
        const response = await axios.post(
          `http://localhost:5000/predict_images`,
          {
            // params: { tiles_folder, res_folder, res_name }
            tiles_folder,
            res_folder,
            res_name
          }
        );
        console.log(response.data); // 检测成功后的回应
        // 可以在这里添加更多的UI反馈，比如成功消息提示
      } catch (error) {
        console.error("Detecting error:", error);
      }
    };
    fetchPaths(0, "/default"); // 初始化输入路径
    fetchOutputPaths(1, "/default"); // 初始化输出路径
    fetchOutputPaths(2, "/default"); // 初始化输出路径

    const confirmClick = () => {
      ElMessageBox.confirm(`是否将检测结果加载到当前地图`)
        .then(() => {
          optical.value = false;
          const res_name = result_name.value; // 结果文件名
          const res_name_no_ext = res_name.split(".")[0];
          emit("load-result", "predict_result", res_name_no_ext);
          console.log(`${"predict_result"}:${res_name_no_ext}`);
        })
        .catch(() => {
          // catch error
        });
    };
    const onSubmit = () => {
      console.log("submit!");
    };
    return {
      optical,
      direction,
      radio1,
      openOpticalDrawer,
      cancelClick,
      confirmClick,
      addInputPath,
      form,
      fetchPaths,
      onPathChange,
      fetchOutputPaths,
      onOutputPathChange,
      checkAndPreprocessData,
      result_name,
      modelDetection,
      onSubmit
    };
  },
  props: {
    layers: Array // An array of layers to choose from
  },
  // 此处可以添加方法和数据
  data() {
    return {
      hoverMenu: null, // Tracks which menu item is being hovered over
      selectedLayer: "", // The currently selected layer
      additionalSelects: [],
      calculatePanel: {
        visible: false,
        selectedTool: null
      },
      disasterPanel: {
        visible: false,
        selectedTool: null
      },
      paths: [],
      currentDir: "/default" // 添加状态存储当前目录
    };
  },
  // Add methods or additional data properties as needed
  methods: {
    addLayerToMap(dataType) {
      // Communicates with the MapView component to add a layer
      this.$emit("load-data", dataType);
    },
    addSampleToMap(dataType) {
      // Communicates with the MapView component to add a layer
      this.$emit("load-sample", dataType);
    },
    // 计算面板
    calculate(method) {
      // Placeholder for slope calculation functionality
      this.$emit("calculate-tool", method);
    },
    openCalculatePanel(method) {
      this.calculatePanel.selectedTool = method;
      this.calculatePanel.visible = true;
      // console.log(this.calculatePanel.visible);
      // this.$emit('calculate-tool', method);
    },
    closeCalculatePanel() {
      this.calculatePanel.visible = false;
      this.calculatePanel.selectedTool = null;
    },
    togglePropertySheet() {
      // Emit an event to the parent component to show the property sheet
      this.$emit("toggle-property-sheet");
    }
  }
};
</script>
<!-- ============================================================================================================= -->
<style scoped>
/* 菜单栏 */
.menu-component {
  display: flex;
  justify-content: center; /* Align horizontal center */
  align-items: center;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  background-color: rgba(44, 62, 80, 0.7);
  backdrop-filter: blur(5px);
  color: white;
  padding: 0.5rem;
  z-index: 1000;
  /* Make sure it's above the map layers */
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  /* Add some shadow for depth */
}

/* 菜单按钮选项 */
.menu-item {
  display: flex;
  align-items: center;
  margin-left: 2rem;
  position: relative;
  cursor: pointer;
  font-size: 1rem;
  /* Use rem for scalability */
  font-family: "Microsoft YaHei", sans-serif;
  /* Fallback to sans-serif */
  transition: background-color 0.3s ease, transform 0.2s ease;
  font-size: 20px;
}

/* 子菜单设计 */
.submenu {
  display: none;
  /* Initial state, will be overridden by v-show */
  position: absolute;
  left: 0;
  top: 100%;
  min-width: 120px;
  /* Set a minimum width for the submenu */
  background-color: rgba(44, 62, 80, 0.8);
  transition: background-color 0.3s ease, transform 0.2s ease;
  /* Add transform to the transition */
  backdrop-filter: blur(5px);
  padding: 0.75rem 1rem;
  border-radius: 0.2rem;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  transform: translateY(5px);
  cursor: pointer;
  font-size: 18px;
  white-space: nowrap;
  /* Prevent text wrapping */
  /* Change cursor to pointer to indicate clickable items */
}

.submenu-item {
  /* ... existing styles ... */
  text-align: left;
  /* Ensure text aligns to the left */
  padding: 0.75rem 1rem;
  /* Increased padding for larger click area */
  display: block;
  /* Display as block to fill the width of the submenu */
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  /* ... */
}

.menu-item:hover .submenu {
  display: block;
  /* Show the submenu on hover */
  opacity: 1;
  visibility: visible;
  transform: translateY(0px);
  transition-delay: 1s;
  /* Remove delay for immediate appearance on hover */
}

.menu-item:hover,
.submenu-item:focus {
  background-color: #3e5770;
  outline: none;
  /* Remove focus outline, add custom focus styles if needed */
}

.submenu-item:active {
  transform: scale(0.95);
  /* Slightly scale down the item when clicked */
  background-color: #506680;
  /* Change background color to give feedback */
}

/* 操作面板 */
.calculate-panel {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  justify-content: space-between;
  align-items: center;
  position: fixed;
  overflow-y: auto;
  padding-top: 50px;
  padding-bottom: 50px;

  /* 位置设置 */
  left: 0;
  right: 80%;
  top: 61px;
  bottom: 3.3dvh;
  z-index: 500;

  /* 颜色风格 */
  background-color: rgba(44, 62, 80, 0.7);
  backdrop-filter: blur(5px);
  /* 背景模糊效果 */
  box-shadow: 2px 0 5px rgba(0, 0, 0, 0.3);

  /* higher than menu-component */
  transform: translateX(-100%);
  transition: transform 0.3s ease-in-out;
  /* padding: 1rem; */
  /* 内边距 */
  /* 文字样式 */
  color: white;
}

/* Ensure the visibility class applies to the correct container */
.calculate-panel.visible {
  transform: translateX(0);
}

/* 让select元素填充父容器 */
.calculate-panel select {
  width: 50%;
}

.calculate-panel button {
  width: 40%;
}

.calculate-panel input[type="text"] {
  width: 50%;
}

.disaster-panel {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  justify-content: space-between;
  align-items: center;
  position: fixed;
  overflow-y: auto;
  padding-top: 20px;
  padding-bottom: 30px;

  /* 位置设置 */
  left: 0;
  right: 80%;
  top: 61px;
  bottom: 3.3dvh;
  z-index: 500;

  /* 颜色风格 */
  background-color: rgba(44, 62, 80, 0.7);
  backdrop-filter: blur(5px);
  /* 背景模糊效果 */
  box-shadow: 2px 0 5px rgba(0, 0, 0, 0.3);

  /* higher than menu-component */
  transform: translateX(-100%);
  transition: transform 0.3s ease-in-out;
  /* padding: 1rem; */
  /* 内边距 */
  /* 文字样式 */
  color: white;
}

.disaster-panel.visible {
  transform: translateX(0);
}

.disaster-panel select {
  width: 50%;
}

.disaster-panel button {
  width: 40%;
}

.disaster-panel input[type="text"] {
  width: 50%;
}

/* 设置计算工具面板样式 */
.input-data {
  display: flex;
  /* 启用 flex 布局 */
  justify-content: space-between;
  /* 在两端对齐元素 */
  align-items: center;
  /* 垂直居中对齐 */
  /* 设置宽度 */
  width: 70%;
  /* 设置元素的宽度 */
}

.save-location {
  display: flex;
  /* 启用 flex 布局 */
  justify-content: space-between;
  /* 在两端对齐元素 */
  align-items: center;
  /* 垂直居中对齐 */
  /* 设置宽度 */
  width: 70%;
}

.button-group {
  display: flex;
  /* 启用 flex 布局 */
  justify-content: space-between;
  /* 在两端对齐元素 */
  align-items: center;
  /* 垂直居中对齐 */
  /* 设置宽度 */
  width: 70%;
}
</style>
