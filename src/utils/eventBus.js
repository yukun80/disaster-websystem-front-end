// eventBus.js
import { reactive, readonly } from "vue";

const state = reactive({
  logs: []
});
function getCurrentTime() {
  return new Date().toLocaleString("zh-CN", {
    hour12: false
  });
}
export function useEventBus() {
  const addLog = message => {
    const newLog = {
      id: state.logs.length + 1,
      message: `${getCurrentTime()} - ${message}`
    };
    state.logs.push(newLog);
  };

  return { logs: readonly(state.logs), addLog };
}
