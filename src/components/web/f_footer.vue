<script setup lang="ts">
import {beian} from "@/conf/global";
</script>

<template>
  <div class="f_footer">
    <div class="footer_inner">
      <div class="brand">枫枫商城</div>
      <div class="links">
        <router-link to="/">商城首页</router-link>
        <router-link :to="{name: 'admin'}">后台管理</router-link>
        <router-link :to="{name: 'login'}">用户登录</router-link>
      </div>
    </div>
    <div class="f_beian" v-if="beian">
      <img src="@/assets/img/gongan.png" alt="">
      <a href="https://beian.miit.gov.cn/" target="_blank">备案号：{{ beian }}</a>
    </div>
  </div>
</template>

<style lang="less">
.f_footer {
  background-color: var(--color-bg-1);
  padding: 28px 16px;

  .footer_inner {
    width: 1200px;
    max-width: 100%;
    margin: 0 auto;
    display: flex;
    align-items: center;
    justify-content: space-between;

    .brand {
      font-size: 18px;
      font-weight: 600;
      color: var(--color-text-1);
    }

    .links {
      display: flex;
      gap: 24px;

      a {
        color: var(--color-text-2);
        text-decoration: none;
      }
    }
  }

  .f_beian {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px 0;
    a{
      margin-left: 10px;
      color: var(--color-text-2);
      text-decoration: none;
    }
  }
}

@media (max-width: 768px) {
  .f_footer {
    .footer_inner {
      align-items: flex-start;
      flex-direction: column;
      gap: 16px;

      .links {
        flex-wrap: wrap;
        gap: 12px 18px;
      }
    }
  }
}
</style>
