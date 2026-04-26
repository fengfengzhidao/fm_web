<script setup lang="ts">
import {beian} from "@/conf/global";
import {userStorei} from "@/stores/user_store";

const store = userStorei()
</script>

<template>
  <div class="f_footer">
    <div class="footer_inner">
      <div class="brand">枫枫商城</div>
      <div class="links">
        <router-link to="/">商城首页</router-link>
        <router-link :to="{name: 'admin'}">后台管理</router-link>
        <button type="button" class="login_button" @click="store.openLoginModal()">用户登录</button>
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
  background: var(--web-footer-grad);
  padding: 30px 16px 26px;
  border-top: 1px solid var(--web-border);

  .footer_inner {
    width: min(1240px, 100%);
    max-width: 100%;
    margin: 0 auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px 22px;
    border-radius: 20px;
    border: 1px solid var(--web-border);
    background: color-mix(in srgb, var(--web-surface) 88%, transparent);
    box-shadow: 0 14px 34px rgba(255, 107, 127, .05);

    .brand {
      font-size: 26px;
      line-height: 1.05;
      font-weight: 800;
      color: #ff667d;
    }

    .links {
      display: flex;
      gap: 24px;

      a,
      .login_button {
        color: var(--web-text-soft);
        text-decoration: none;
        border: 0;
        background: transparent;
        padding: 0;
        cursor: pointer;
        transition: color .18s ease;
      }

      a:hover,
      .login_button:hover {
        color: #ff647c;
      }
    }
  }

  .f_beian {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 18px 0 0;

    a {
      margin-left: 10px;
      color: var(--web-text-muted);
      text-decoration: none;

      &:hover {
        color: #ff647c;
      }
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
