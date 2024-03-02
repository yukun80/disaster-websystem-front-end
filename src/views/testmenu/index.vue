<template>
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
  <el-form-item label="Step1：输入数据检查与预处理">
    <el-button type="success" @click="checkAndPreprocessData">运行</el-button>
    <!-- 检测成功失败状态显示 -->
    <el-tag v-if="dataCheckStatus === 'success'" type="success"
      >检测成功</el-tag
    >
    <el-tag v-if="dataCheckStatus === 'failure'" type="danger">检测失败</el-tag>
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

  <el-form-item label="Step2：滑坡检测">
    <el-button type="warning" @click="modelDetection">模型检测</el-button>
  </el-form-item>
</template>

<script>
import { reactive, ref } from "vue";
import axios from "axios";

export default {
  setup() {
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
    return {
      addInputPath,
      form,
      fetchPaths,
      onPathChange,
      fetchOutputPaths,
      onOutputPathChange,
      checkAndPreprocessData,
      result_name,
      modelDetection
    };
  }
};
</script>
