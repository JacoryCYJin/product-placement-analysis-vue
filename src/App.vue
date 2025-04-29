<script setup>
</script>

<template>
  <div class="container">
    <!-- 顶部全局组件 -->
    <HomeTop/>
    <div class="content">
      <router-view></router-view>
    </div>
    <!-- 底部全局组件 -->
    <HomeBottom/>
  </div>
</template>

<style scoped lang="scss">
.container {
  display: flex;
  flex-direction: column;
  .content {
    margin: 100px auto 0 auto;
    width: 1200px;
    min-height: 700px;
  }
}
</style>
