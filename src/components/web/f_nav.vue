<script setup lang="ts">
import {onMounted, onUnmounted, ref} from "vue";
import {slogan, enSlogan} from "@/conf/global";
import F_theme from "@/components/common/f_theme.vue";
import F_user_dropdown from "@/components/common/f_user_dropdown.vue";
import {userStorei} from "@/stores/user_store";

const store = userStorei()

interface Props {
  noScroll?: boolean
  scrollTop?: number
}

const props = defineProps<Props>()
const {noScroll = false, scrollTop = 200} = props

const isShow = ref(noScroll)

function updateNavState() {
  if (noScroll) {
    isShow.value = true
    return
  }
  const top = document.documentElement.scrollTop
  isShow.value = top >= scrollTop
}

onMounted(() => {
  updateNavState()
  if (!noScroll) {
    window.addEventListener("scroll", updateNavState, {passive: true})
  }
})

onUnmounted(() => {
  if (!noScroll) {
    window.removeEventListener("scroll", updateNavState)
  }
})
</script>

<template>
  <div class="f_nav" :class="{isShow}">
    <div class="container">
      <router-link class="brand" to="/">
        <div class="brand_mark">枫</div>
        <div class="brand_text">
          <strong>{{ slogan }}</strong>
          <span>{{ enSlogan }}</span>
        </div>
      </router-link>

      <nav class="nav_links">
        <router-link to="/">商城首页</router-link>
        <router-link :to="{name: 'web_sec_kill'}">秒杀专区</router-link>
        <a href="#categories">商品分类</a>
        <a href="#featured">精选商品</a>
        <router-link :to="{name: 'web_cart'}">购物车</router-link>
        <router-link v-if="store.isLogin" :to="{name: 'web_user_center_info'}">个人中心</router-link>
      </nav>

      <div class="right">
        <f_user_dropdown v-if="store.isLogin"/>
        <button v-else class="plain_link" type="button" @click="store.openLoginModal()">登录</button>
        <router-link class="plain_link" :to="{name: 'admin'}">后台</router-link>
        <f_theme class="theme"/>
      </div>
    </div>
  </div>
</template>

<style lang="less">
.f_nav {
  width: 100vw;
  height: 72px;
  position: fixed;
  top: 0;
  z-index: 1000;
  display: flex;
  justify-content: center;
  color: var(--color-text-1);
  background: rgba(255, 255, 255, .96);
  border-bottom: 1px solid rgba(226, 232, 240, .8);
  box-shadow: 0 4px 16px rgba(15, 23, 42, .03);

  .container {
    width: min(1240px, 100%);
    padding: 0 20px;
    display: flex;
    align-items: center;
    gap: 24px;
  }

  .brand {
    display: flex;
    align-items: center;
    gap: 12px;
    text-decoration: none;
    color: inherit;
    flex: 0 0 auto;
  }

  .brand_mark {
    width: 36px;
    height: 36px;
    border-radius: 11px;
    display: grid;
    place-items: center;
    color: #fff;
    font-weight: 800;
    background: linear-gradient(135deg, #1d4ed8, #60a5fa);
    box-shadow: 0 10px 20px rgba(37, 99, 235, .22);
  }

  .brand_text {
    display: grid;
    gap: 2px;

    strong {
      font-size: 18px;
      line-height: 1.1;
    }

    span {
      color: var(--color-text-3);
      font-size: 12px;
      line-height: 1;
    }
  }

  .nav_links {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1;
    min-width: 0;

    a {
      padding: 8px 10px;
      border-radius: 999px;
      text-decoration: none;
      color: var(--color-text-2);
      font-size: 14px;
      transition: all .18s ease;

      &:hover {
        color: #1d4ed8;
        background: rgba(29, 78, 216, .08);
      }
    }

    a.router-link-exact-active {
      color: #1d4ed8 !important;
      background: rgba(29, 78, 216, .1);
      font-weight: 600;
    }
  }

  .right {
    display: flex;
    align-items: center;
    gap: 12px;
    flex: 0 0 auto;

    .theme {
      color: var(--color-text-2);
      font-size: 18px;
      cursor: pointer;
    }
  }

  .plain_link {
    padding: 0;
    border: 0;
    background: transparent;
    color: var(--color-text-2);
    text-decoration: none;
    font-size: 14px;
    cursor: pointer;
  }
}

@media (max-width: 768px) {
  .f_nav {
    height: 66px;

    .container {
      padding: 0 16px;
      gap: 12px;
    }

    .brand_text span,
    .nav_links {
      display: none;
    }

    .right {
      margin-left: auto;
      gap: 10px;
    }
  }
}
</style>
