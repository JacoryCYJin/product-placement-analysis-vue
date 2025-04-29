<script setup>

</script>

<template>
  <div class="bottom">
    <div class="content">
      <img src="../../assets/images/logo2.png" alt="">
      <div class="nav">
        <h6>服务</h6>
        <ul>
          <li>广告检测</li>
          <!-- <li>功能2</li>
          <li>功能3</li>
          <li>功能4</li> -->
        </ul>
      </div>
      <div class="nav">
        <h6>团队</h6>
        <ul>
          <li>cjp</li>
          <li>jcy</li>
          <li>zsm</li>
          <li>gcy</li>
          <li>gyh</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.bottom {
  display: flex;
  width: 100%;
  height: 236px;
  background-color: #0d2050;
  justify-content: center;

  .content {
    display: flex;
    margin-top: 32px;

    img {
      width: 150px;
      height: 150px;
      //margin-right: 150px;
    }

    .nav {
      margin-left: 300px;

      h6 {
        color: #fff;
        font-size: 20px;
        font-weight: 700;
        margin-bottom: 16px;
      }

      li {
        color: rgba(255, 255, 255, .6);
        margin-top: 4px;
        margin-bottom: 4px;
      }
    }
  }
}
</style>