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
      <el-form :model="form" label-width="30%" label-position="left">
        <el-form-item label="光学遥感检测">
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
        <el-form-item label="InSAR形变检测">
          <el-select
            v-model="form.inputPath2.path"
            placeholder="请选择数据集路径"
            style="width: 250px"
            @change="() => onInputPathChange(2)"
          >
            <el-option
              v-for="item in form.inputPath2.paths"
              :key="item.name"
              :label="item.name"
              :value="item.name"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="地质灾害易发性">
          <el-select
            v-model="form.inputPath3.path"
            placeholder="请选择数据集路径"
            style="width: 250px"
            @change="() => onInputPathChange(3)"
          >
            <el-option
              v-for="item in form.inputPath3.paths"
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
import { reactive, ref } from "vue";
import { ElMessageBox } from "element-plus";
import axios from "axios";

const emit = defineEmits(["load-result"]);

const direction = ref("rtl");
const radio1 = ref("1");

const form = reactive({
  inputPath1: { path: "", paths: [] },
  inputFullPath1: "/default",
  inputPath2: { path: "", paths: [] },
  inputFullPath2: "/default",
  inputPath3: { path: "", paths: [] },
  inputFullPath3: "/default",

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
  } else if (inIndex === 2) {
    inputPath = "inputPath2";
  } else {
    inputPath = "inputPath3";
  }
  try {
    const response = await axios.get(
      `http://localhost:5000/list_paths?dir=${dir}`
    );
    form[inputPath].paths = response.data;
    if (inIndex === 1) {
      form.inputFullPath1 = dir;
    } else if (inIndex === 2) {
      form.inputFullPath2 = dir;
    } else {
      form.inputFullPath3 = dir;
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
  } else if (inIndex === 2) {
    selectedPath = form.inputPath2.path;
    selected = form.inputPath2.paths.find(path => path.name === selectedPath);
  } else {
    selectedPath = form.inputPath3.path;
    selected = form.inputPath3.paths.find(path => path.name === selectedPath);
  }
  if (selected && selected.isDir) {
    let newPath = "";
    if (inIndex === 1) {
      newPath = `${form.inputFullPath1}/${selectedPath}`;
    } else if (inIndex === 2) {
      newPath = `${form.inputFullPath2}/${selectedPath}`;
    } else {
      newPath = `${form.inputFullPath3}/${selectedPath}`;
    }
    await fetchInputPaths(inIndex, newPath);
  } else {
    if (inIndex === 1) {
      form.inputFullPath1 = `${form.inputFullPath1}/${selectedPath}`;
    } else if (inIndex === 2) {
      form.inputFullPath2 = `${form.inputFullPath2}/${selectedPath}`;
    } else {
      form.inputFullPath3 = `${form.inputFullPath3}/${selectedPath}`;
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
fetchInputPaths(2, "/default");
fetchInputPaths(3, "/default");
fetchOutputPaths("/default");

const confirmClick = async () => {
  const optical_file = form.inputFullPath1; // 光学遥感检测结果文件
  const insar_file = form.inputFullPath2; // InSAR形变灾害检测结果文件
  const landslide_file = form.inputFullPath3; // 滑坡易发性评估结果文件
  const res_folder = form.outputFullPath2; // 结果输出文件夹
  const res_name = result_name.value; // 结果文件名
  console.log(landslide_file);
  console.log(res_folder);
  console.log(result_name.value);
  try {
    const response = await axios.post(
      `http://localhost:5000/predict_multiResult`,
      {
        optical_file,
        insar_file,
        landslide_file,
        res_folder,
        res_name
      }
    );
    console.log(response.data); // 检测成功后的回应
    // 可以在这里添加更多的UI反馈，比如成功消息提示
  } catch (error) {
    console.error("Detecting error:", error);
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
</script>
