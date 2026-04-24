<script setup lang="ts">
</script>

<template>
  <div class="f_main_com">
    <div class="f_container">
      <slot></slot>
    </div>
  </div>
</template>

<style lang="less">
.f_main_com {
  position: relative;
  width: 100%;
  display: flex;
  justify-content: center;
  margin-top: 72px;
  background: #f4f5f7;

  > .f_container {
    width: min(1240px, 100%);
    min-height: calc(100vh - 144px);
    position: relative;
    z-index: 1;
  }
}
</style>
