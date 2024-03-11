// File: src/components/LegendComponent.vue
<template>
  <div class="legend">
    <h4>图例</h4>
    <div>
      <span class="shapefile"></span>
      <span>川藏线研究区</span>
    </div>
    <div>
      <span class="buffer5"></span>
      <span>5km缓冲区</span>
    </div>
    <div>
      <span class="buffer20"></span>
      <span>20km缓冲区</span>
    </div>
    <div>
      <span class="sample"></span>
      <span>川藏线滑坡样本</span>
    </div>
    <div>
      <span class="railway"></span>
      <span>川藏铁路线</span>
    </div>
  </div>
</template>

<script>
export default {};
</script>

<style scoped>
.legend {
  position: absolute;
  right: 10px;
  bottom: 12%;
  z-index: 500;
  padding: 10px;
  background: white;
  border-radius: 5px;
  box-shadow: 0 0 10px rgb(0 0 0 / 50%);
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

.shapefile {
  width: 20px;
  height: 10px;
  margin-right: 10px;
  border: 2.5px solid black;
}

.buffer5 {
  width: 20px;
  height: 10px;
  margin-right: 10px;
  border: 2.5px dashed rgb(255 0 0);
}

.buffer20 {
  width: 20px;
  height: 10px;
  margin-right: 10px;
  border: 2.5px dashed rgb(251 110 29);
}

.sample {
  width: 20px;
  height: 10px;
  margin-right: 10px;
  border: 2px solid rgb(255 0 0);
}

.railway {
  /* 创建类似铁轨的虚线效果 */
  width: 22px;

  /* 宽度可以根据需要调整 */
  height: 3px;

  /* 高度可以根据需要调整 */
  margin-right: 10px;

  /* 黑色，与矢量图层一致 */
  background-image: repeating-linear-gradient(
    90deg,
    #000,
    #000 10px,
    transparent,
    10px,
    transparent 15px,
    #000 15px,
    #000 25px,
    transparent 25px,
    transparent 30px,
    #000 30px,
    #000 40px
  );
  border: 1px solid #000;

  /* 距右侧距离 */
}
</style>
