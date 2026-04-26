<script setup lang="ts">
import {theme, setTheme} from "@/components/common/f_theme";

function toggleTheme() {
  setTheme(theme.value === "" ? "dark" : "")
}
</script>

<template>
  <span :title="theme === '' ? '白天模式' : '黑夜模式'" @click="toggleTheme">
    <icon-sun-fill v-if="theme === ''"/>
    <icon-moon-fill v-else/>
  </span>
</template>

<style scoped>

</style>
