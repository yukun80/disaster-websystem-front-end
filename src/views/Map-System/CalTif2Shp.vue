<template>
  <el-dialog
    v-model="Tif2ShpCalculateVisible"
    title="栅格转矢量"
    width="500"
    style="color: #000; background-color: #f0f2f5"
  >
    <el-form-item label="选择目标栅格" :label-width="formLabelWidth">
      <el-select
        v-model="form.inputPaths.path"
        placeholder="请选择..."
        :style="{ width: selectWidth }"
        @change="() => onPathChange()"
      >
        <el-option
          v-for="item in form.inputPaths.paths"
          :key="item.name"
          :label="item.name"
          :value="item.name"
        />
      </el-select>
    </el-form-item>
    <el-form-item label="栅格类型" :label-width="formLabelWidth">
      <el-select
        v-model="form.type"
        placeholder="请选择"
        :style="{ width: selectWidth }"
      >
        <el-option label="光学遥感早期识别结果" value="optical" />
        <el-option label="InSAR地表早期异常形变识别结果" value="insar" />
        <el-option label="多源集成学习早期识别结果" value="ensemble" />
      </el-select>
    </el-form-item>
    <el-form-item label="矢量结果保存路径" :label-width="formLabelWidth">
      <el-select
        v-model="form.outputPath2.path"
        placeholder="请选择保存位置"
        :style="{ width: selectWidth }"
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
    <el-form-item label="矢量结果文件名" :label-width="formLabelWidth">
      <el-input
        v-model="form.name"
        autocomplete="off"
        placeholder="result.shp"
        :style="{ width: selectWidth }"
      />
    </el-form-item>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="cancelClick">取消</el-button>
        <el-button type="primary" @click="confirmClick"> 运行 </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { reactive, ref, inject, h } from "vue";
import { ElMessageBox, ElNotification, ElProgress } from "element-plus";
import axios from "axios";

const Tif2ShpCalculateVisible = ref(false);
const emit = defineEmits(["load-result", "tif2shp-close"]);

const formLabelWidth = "150px";
const selectWidth = "250px";

const form = reactive({
  inputPaths: { path: "", paths: [] }, // 绑定到输出选择的select组件
  inputFullPath: "/default", // 初始化输出路径1的完整路径
  outputPath2: { path: "", paths: [] },
  outputFullPath2: "/default", // 初始化输出路径2的完整路径
  type: null, // 选择的栅格类型
  name: "" // 结果文件名
});

const fetchPaths = async (dir = "/default") => {
  form.inputFullPath = dir;
  try {
    const response = await axios.get(
      `http://localhost:5000/list_paths?dir=${dir}`
    );
    form.inputPaths.paths = response.data;
  } catch (error) {
    console.error("There was an error!", error);
    alert("加载路径失败，请稍后再试");
  }
};

// 动态修改
const onPathChange = () => {
  const selectedPath = form.inputPaths.path; // 用户选择的文件
  const selected = form.inputPaths.paths.find(
    //.find 方法遍历 paths 数组，对于每个元素（path），执行一个测试函数（path => path.name === selectedPath）。
    // 一旦找到一个对象的 name 属性与 selectedPath 相等，.find 方法就会返回这个对象（即 selected），如果找不到匹配项，则返回 undefined。
    path => path.name === selectedPath
  );
  if (selected && selected.isDir) {
    const newPath = `${form.inputFullPath}/${selectedPath}`; // 动态构建新路径
    fetchPaths(newPath);
  } else {
    form.inputFullPath = `${form.inputFullPath}/${selectedPath}`;
  }
};

const fetchOutputPaths = async (dir = "/default") => {
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
const onOutputPathChange = () => {
  const selectedPath = form.outputPath2.path;
  const selected = form.outputPath2.paths.find(
    path => path.name === selectedPath
  );
  if (selected && selected.isDir) {
    const newPath = `${form.outputFullPath2}/${selectedPath}`; // 构建新的完整路径
    fetchOutputPaths(newPath);
  }
};

fetchPaths("/default"); // 初始化输出路径
fetchOutputPaths("/default"); // 初始化输出路径

// 全局日志信息传递
const eventBus = inject("eventBus");
const addLog = eventBus.addLog;
const geojson_url = ref("");
const confirmClick = async () => {
  const tifImage = form.inputFullPath; // 预处理后的影像文件路径
  const tifType = form.type; // 选择的栅格类型
  const res_folder = form.outputFullPath2; // 结果输出文件夹
  const res_name = form.name; // 结果文件名
  // console.log(tiles_folder);
  // console.log(res_folder);
  addLog("执行栅格转矢量任务");
  try {
    notification1();
    const response = await axios.post(
      `http://localhost:5000/tif2shp_calculate`,
      {
        tifImage,
        tifType,
        res_folder,
        res_name
      }
    );
    geojson_url.value = response.data.geojson_url; // 获取 GeoJSON URL
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
      const res_name_no_ext = res_name.split(".")[0];
      // const workspace = "shapefile_result";
      // console.log(workspace);
      emit("load-result", res_name_no_ext, geojson_url.value);
      // console.log(`${"shapefile_result"}:${res_name_no_ext}`);
    })
    .catch(() => {
      console.log("cancel");
    });
};
const cancelClick = () => {
  emit("tif2shp-close");
};

// 自定义通知，包含进度条
const notification1Instance = ref(null); // 用来存储第一个通知的引用
const notification1 = () => {
  notification1Instance.value = ElNotification({
    title: "栅格转矢量工具",
    message: h("div", [
      "正在计算矢量结果，请稍候",
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
    title: "栅格转矢量工具",
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
    title: "栅格转矢量工具",
    message: "运行失败！",
    duration: 0, // 设置为0则不会自动关闭
    type: "error"
  });
};
</script>
