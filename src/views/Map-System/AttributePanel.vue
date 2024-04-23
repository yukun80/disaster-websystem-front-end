// File: src/views/Map-System/AttributePanel.vue
<template>
  <div class="AttributePanel" style="position: relative; z-index: 1000">
    <el-card
      v-show="isAttributePanelVisible"
      class="log-panel"
      style="
        width: 32%;
        top: 55px;
        /* height: 96vh; */
        position: fixed;
        bottom: 4vh;
        left: 0;
        margin: 0;
        color: #000; /* 设置文字颜色 */
        background-color: #f0f2f5; /* 设置背景颜色 */
        overflow-y: auto; /* 添加滚动条以防内容溢出 */
      "
    >
      <template #header>
        <div
          class="card-header"
          style="
            display: flex;
            justify-content: space-between;
            align-items: center;
            height: 8px; /* 调整头部高度 */
          "
        >
          <h3>地理数据信息统计</h3>
          <el-button
            class="close-btn"
            size="small"
            icon="el-icon-close"
            style="
              padding: 0;
              height: 8px; /* 使按钮高度与头部相同 */
              font-size: 18px;
              line-height: 32px; /* 图标垂直居中 */
              background-color: transparent; /* 移除按钮背景色 */
              border: none; /* 移除边框 */
            "
            @click="closePanel"
          >
            <el-icon><Close /></el-icon>
          </el-button>
        </div>
      </template>
      <!-- 表格 -->
      <div class="attribute-table">
        <el-form-item class="select-item" label="查看数据">
          <el-select v-model="selectedLayer" @change="updateAttributes">
            <el-option
              v-for="layer in layers"
              :key="layer.name"
              :label="layer.name"
              :value="layer.name"
            />
          </el-select>
        </el-form-item>

        <div style="height: 77vh; overflow-y: auto">
          <el-auto-resizer>
            <template #default="{ height, width }">
              <el-table-v2
                :columns="tableColumns"
                :data="tableData"
                :width="width"
                :height="height"
                fixed
              />
            </template>
          </el-auto-resizer>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { ElAutoResizer } from "element-plus";

// 定义接收从父组件传入的属性
const props = defineProps({
  layers: Array
});

const emit = defineEmits(["attribution-close"]);
const isAttributePanelVisible = ref(true);
// 使用ref来定义响应式的selectedLayer和attributes，这些数据会根据用户的操作动态变化
const selectedLayer = ref("");

// 根据选中的图层生成表格列和数据
const generateTableColumns = attributes => {
  if (!attributes.length) return [];
  const columns = Object.keys(attributes[0]).map(key => ({
    title: key,
    dataKey: key,
    width: 150
  }));
  // 在列定义的开始添加FID列
  columns.unshift({
    title: "FID",
    dataKey: "FID",
    width: 100
  });
  return columns;
};

// 将原始attributes数据转换为el-table-v2所需的数据格式
const generateTableData = attributes => {
  return attributes.map((attr, index) => ({
    ...attr,
    FID: index + 1 // 自动生成FID
  }));
};

// 计算属性，动态生成表格列和数据
const tableColumns = computed(() =>
  generateTableColumns(
    props.layers.find(layer => layer.name === selectedLayer.value)
      ?.attributes || []
  )
);
const tableData = computed(() =>
  generateTableData(
    props.layers.find(layer => layer.name === selectedLayer.value)
      ?.attributes || []
  )
);

// 当selectedLayer变化时，更新attributes数据
// watch(selectedLayer, () => {});

const closePanel = () => {
  emit("attribution-close", false); // 通知父组件更改可见性
};
</script>
