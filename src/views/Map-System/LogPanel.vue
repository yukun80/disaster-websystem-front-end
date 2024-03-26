<template>
  <div class="logPanel" style="position: relative; z-index: 1000">
    <el-card
      v-show="isPanelVisible"
      class="log-panel"
      style="
        width: 100%;
        height: 25%;
        position: fixed;
        bottom: 4vh;
        right: 0;
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
          <h3>系统日志</h3>
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
      <p v-for="log in logs" :key="log.id" class="text item">
        {{ log.message }}
      </p>
      <template #footer>日志数量: {{ logs.length }}</template>
    </el-card>
  </div>
</template>

<script setup>
import { ref } from "vue";

const emit = defineEmits(["close-Log"]);

const closePanel = () => {
  emit("close-Log", false); // 通知父组件更改可见性
};

const logs = ref([
  { id: 1, message: "日志消息 1" },
  { id: 2, message: "日志消息 2" },
  { id: 3, message: "日志消息 3" }
  // 更多日志...
]);
const isPanelVisible = ref(true);
</script>
