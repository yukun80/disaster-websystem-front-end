<template>
  <el-drawer
    :direction="direction"
    :size="'35%'"
    style="color: #000; background-color: #f0f2f5"
  >
    <template #header>
      <h3>地质灾害信息统计</h3>
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
import { ref } from "vue";
import { ElMessageBox } from "element-plus";

const direction = ref("ltr");
const emit = defineEmits(["quantify-close"]);

const cancelClick = () => {
  // 当用户点击取消按钮时，隐藏抽屉
  emit("attribution-close");
};
function confirmClick() {
  ElMessageBox.confirm(`Are you confirm to chose this option?`)
    .then(() => {
      emit("attribution-close");
    })
    .catch(() => {
      // catch error
    });
}
</script>
