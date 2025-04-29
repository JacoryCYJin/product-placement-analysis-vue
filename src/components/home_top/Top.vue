<script setup>

</script>

<template>
  <div class="top">
    <div class="content">
      <div class="left">
        <img src="../../assets/images/logo2.png" alt="">
        <ul>
          <li class="active">植入式广告监测</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.top {
  position: fixed;
  z-index: 999;
  width: 100%;
  height: 50px;
  background-color: #0d2050;
  display: flex;
  justify-content: center;
  align-items: center;
  color: #a0a6b8;

  .content {
    width: 1200px;

    .left {
      display: flex;
      align-items: center;
      font-size: 15px;

      img {
        width: 45px;
        height: 45px;
        margin-right: 2.5rem;
      }

      ul {
        display: flex;

        li {
          margin-right: 30px;

          &.active {
            color: #fff;
          }
        }

        li:hover {
          color: #fff;
        }
      }
    }
  }
}
</style>