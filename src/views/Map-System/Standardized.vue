<template>
  <el-drawer
    :model-value="standardVisible"
    :direction="direction"
    :size="'25%'"
    style="color: #000; background-color: #f0f2f5"
  >
    <template #header>
      <h3>多源遥感数据标准化预处理</h3>
    </template>
    <template #default>
      <el-form :model="form" label-width="30%" label-position="left">
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
        <el-form-item label="标准化影像输出保存位置">
          <el-select
            v-model="form.outputPath1.path"
            placeholder="请选择输出数据路径"
            style="width: 250px"
            @change="() => onOutputPathChange()"
          >
            <el-option
              v-for="item in form.outputPath1.paths"
              :key="item.name"
              :label="item.name"
              :value="item.name"
            />
          </el-select>
        </el-form-item>
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
import axios from "axios";
import { ElNotification, ElProgress } from "element-plus";

const standardVisible = ref("false");
const direction = ref("rtl");
const form = reactive({
  inputPaths: [{ path: "", paths: [] }],
  inputFullPath: [],
  outputPath1: { path: "", paths: [] },
  outputFullPath1: "/default",
  dataCheckStatus: null
});

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

const fetchOutputPaths = async dir => {
  const outputPath = "outputPath1";
  try {
    const response = await axios.get(
      `http://localhost:5000/list_paths?dir=${dir}`
    );
    form[outputPath].paths = response.data;
    form.outputFullPath1 = dir; // 更新当前完整路径
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
    form.inputFullPath[index] = `${form.inputFullPath[index]}/${selectedPath}`;
  }
};
const onOutputPathChange = () => {
  const selectedPath = form.outputPath1.path;
  const selected = form.outputPath1.paths.find(
    path => path.name === selectedPath
  );
  if (selected && selected.isDir) {
    const newPath = `${form.outputFullPath1}/${selectedPath}`; // 构建新的完整路径
    fetchOutputPaths(newPath);
  }
};
fetchPaths(0, "/default"); // 初始化输入路径
fetchOutputPaths("/default"); // 初始化输出路径
// 全局日志信息传递
const eventBus = inject("eventBus");
const addLog = eventBus.addLog;
const confirmClick = async () => {
  const file_paths = form.inputFullPath.join(",");
  const output_folder = form.outputFullPath1;
  console.log(file_paths);
  console.log(output_folder);
  addLog("执行标准化数据处理;");
  try {
    notification1();
    const response = await axios.get(`http://localhost:5000/process_images`, {
      params: { file_paths, output_folder }
    });
    console.log(response.data); // 处理成功后的回应
    notification2();
  } catch (error) {
    console.error("Processing error:", error);
    notification3();
  }
};
const cancelClick = async () => {
  // 重置输入路径数组
  form.inputPaths = [{ path: "", paths: [] }];
  // 重置输入路径的完整路径数组
  form.inputFullPath = [];
  // 重置输出路径对象
  form.outputPath1 = { path: "", paths: [] };
  // 重置输出路径的完整路径
  form.outputFullPath1 = "/default";
  // 重置数据检查状态
  form.dataCheckStatus = null;
  fetchPaths(0, "/default"); // 初始化输入路径
  fetchOutputPaths("/default"); // 初始化输出路径
  emit("standardized-close");
};
const notification1 = () => {
  notification1Instance.value = ElNotification({
    title: "数据标准化工具",
    message: h("div", [
      "正在进行数据标准化处理，请稍候",
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
    title: "数据标准化工具",
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
    title: "数据标准化工具",
    message: "运行失败！",
    duration: 0, // 设置为0则不会自动关闭
    type: "error"
  });
};
</script>
