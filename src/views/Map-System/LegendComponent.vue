<template>
  <div class="legend">
    <h4>矢量数据图例</h4>
    <div>
      <span class="buffer5"></span>
      <span>5km缓冲区</span>
    </div>
    <div>
      <span class="buffer20"></span>
      <span>20km缓冲区</span>
    </div>
    <div>
      <span class="railway"></span>
      <span>川藏铁路线</span>
    </div>
    <div>
      <span class="river_level3"></span>
      <span>三级以上河流</span>
    </div>
    <div>
      <span class="faults"></span>
      <span>断裂带</span>
    </div>
  </div>
</template>

<script setup></script>

<style lang="scss" scoped>
.legend {
  position: absolute;
  right: 10px;
  bottom: 6vh;
  z-index: 500;
  padding: 10px;
  background: white;
  border-radius: 5px;
  box-shadow: 0 0 10px rgb(0 0 0 / 50%);
  min-width: 180px;
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

.buffer5 {
  width: 35px;
  height: 15px;
  margin-right: 10px;
  background-image: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%"><rect width="100%" height="100%" fill="none" stroke="rgb(255, 69, 0)" stroke-width="6" stroke-dasharray="7,4"/></svg>');
  background-size: 100% 100%;
  // border: 4px dashed rgb(255, 69, 0);
}

.buffer20 {
  width: 35px;
  height: 15px;
  margin-right: 10px;
  background-image: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%"><rect width="100%" height="100%" fill="none" stroke="rgb(255,165,0)" stroke-width="6" stroke-dasharray="7,4"/></svg>');
  background-size: 100% 100%;
}

.railway {
  width: 35px;
  height: 5px;
  margin-right: 10px;
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
}

.river_level3 {
  width: 35px;
  height: 3px;
  margin-right: 10px;
  background-color: #0000ff;
  border: 1px solid #0000ff;
}

.faults {
  width: 35px;
  height: 3px;
  margin-right: 10px;
  background-image: repeating-linear-gradient(
    90deg,
    #ff1493,
    #ff1493 10px,
    transparent,
    5px,
    transparent 15px,
    #ff1493 15px,
    #ff1493 25px,
    transparent 25px,
    transparent 30px,
    #ff1493 30px,
    #ff1493 40px
  );
  // border: 1px solid #ff1493;
}
</style>
