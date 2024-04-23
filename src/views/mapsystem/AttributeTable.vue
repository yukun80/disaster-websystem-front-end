// File: src/components/AttributeTable.vue

<template>
  <div class="attribute-table">
    <div class="header">
      <!-- Conditionally display the attributes count -->
      <span v-if="attributes && attributes.length === 1471">
        滑坡数量统计：{{ attributes.length }}
      </span>
      <h4 v-else>属性表</h4>
      <div class="layer-selector">
        <select v-model="selectedLayer" @change="updateAttributes">
          <option v-for="layer in layers" :key="layer.name" :value="layer.name">
            {{ layer.name }}
          </option>
        </select>
      </div>
    </div>
    <table v-if="attributes && attributes.length">
      <tr>
        <th>FID</th>
        <!-- Add a new table header cell for the object number -->
        <th v-for="(value, key) in attributes[0]" :key="key">
          {{ key }}
          <!-- Check if the key is 'area' and append the text -->
          <span v-if="key === 'area'">(m²)</span>
          <!-- Check if the key is 'x_col' and append the '+' symbol -->
          <span v-if="key === 'x_col'">°</span>
          <span v-if="key === 'y_row'">°</span>
        </th>
      </tr>
      <tr v-for="(item, index) in attributes" :key="index">
        <td>{{ index + 1 }}</td>
        <!-- Display the object number -->
        <td v-for="(value, key) in item" :key="key">
          {{ value }}
        </td>
      </tr>
    </table>
    <div v-else>No data available.</div>
  </div>
</template>

<script>
export default {
  name: "AttributeTable",
  props: {
    layers: Array // An array of layers to choose from
  },
  data() {
    return {
      selectedLayer: "", // The currently selected layer
      attributes: [] // The attributes to display for the selected layer
    };
  },
  methods: {
    updateAttributes() {
      const layer = this.layers.find(l => l.name === this.selectedLayer);
      this.attributes = layer ? layer.attributes : [];
    }
  },
  watch: {
    selectedLayer: {
      immediate: true,
      handler() {
        this.updateAttributes();
      }
    }
  }
};
</script>

<style scoped>
/* 表头元素样式 */
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 2px solid #ddd;
}

.header span {
  margin: 5px;
  font-size: 16px;
  color: #fcfbf1d7;
}

.layer-selector select {
  display: flex;
  justify-content: flex-end;
  width: 120px;
}

.attribute-table {
  position: absolute;
  right: 30%;
  bottom: 3.3dvh;
  left: 30%;
  z-index: 500;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  max-height: 30vh;
  padding: 5px;
  overflow-y: auto;
  background-color: rgb(44 62 80 / 70%);
  border-radius: 3px;
}

.attribute-table table {
  width: 100%;
  border-collapse: collapse;
}

.attribute-table th,
.attribute-table td {
  padding: 8px;
  font-size: 12px;
  color: #fcfbf1d7;
  text-align: min-width;
  border-bottom: 1px solid #ddd;
}
.attribute-table div {
  padding: 4px;
  margin: 1px;
  color: #fcfbf1d7;
}
</style>
