<template>
  <div class="legend">
    <h4>地灾识别结果图例</h4>
    <div>
      <span class="level1"></span>
      <span>无风险区域</span>
    </div>
    <div>
      <span class="level2"></span>
      <span>低风险区域</span>
    </div>
    <div>
      <span class="level3"></span>
      <span>中风险区域</span>
    </div>
    <div>
      <span class="level4"></span>
      <span>较高风险区域</span>
    </div>
    <div>
      <span class="level5"></span>
      <span>高风险区域</span>
    </div>
  </div>
</template>

<script setup></script>

<style lang="scss" scoped>
.legend {
  position: absolute;
  right: 10px;
  bottom: 26vh;
  z-index: 500;
  padding: 10px;
  background: white;
  border-radius: 5px;
  box-shadow: 0 0 10px rgb(0 0 0 / 50%);
  min-width: 170px;
}

.legend h4 {
  margin: 0 0 5px;
  font-size: 1em;
}

.legend div {
  display: flex;
  align-items: center;
  margin-bottom: 5px;
}

.level1 {
  width: 25px;
  height: 15px;
  margin-right: 10px;
  border: 2.5px solid #e0fed9;
  background-color: #e0fed9;
}

.level2 {
  width: 25px;
  height: 15px;
  margin-right: 10px;
  border: 2.5px solid #daf0ae;
  background-color: #daf0ae;
}

.level3 {
  width: 25px;
  height: 15px;
  margin-right: 10px;
  border: 2.5px solid #fedf99;
  background-color: #fedf99;
}

.level4 {
  width: 25px;
  height: 15px;
  margin-right: 10px;
  border: 2.5px solid #f59053;
  background-color: #f59053;
}

.level5 {
  width: 25px;
  height: 15px;
  margin-right: 10px;
  border: 2.5px solid #e23f26;
  background-color: #e23f26;
}
</style>
