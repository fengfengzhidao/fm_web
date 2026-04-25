<script setup lang="ts">
import {computed, onMounted, onUnmounted, ref} from "vue";
import {slogan, enSlogan} from "@/conf/global";
import F_theme from "@/components/common/f_theme.vue";
import F_user_dropdown from "@/components/common/f_user_dropdown.vue";
import {userStorei} from "@/stores/user_store";
import {useRoute, useRouter} from "vue-router";

const store = userStorei()
const route = useRoute()
const router = useRouter()

interface Props {
  noScroll?: boolean
  scrollTop?: number
}

const props = defineProps<Props>()
const {noScroll = false, scrollTop = 200} = props

const isShow = ref(noScroll)

const navItems = computed(() => [
  {
    label: "购物车",
    name: "web_cart",
    active: route.name === "web_cart",
    icon: "cart",
  },
  {
    label: "消息通知",
    name: "web_user_center_msg",
    active: route.name === "web_user_center_msg",
  },
  {
    label: "我的收藏",
    name: "web_user_center_collect",
    active: route.name === "web_user_center_collect",
  },
  {
    label: "个人中心",
    name: "web_user_center_info",
    active: typeof route.name === "string" && route.name.startsWith("web_user_center"),
  },
])

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

function openNav(name: string) {
  router.push({name})
}
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
        <button
          v-for="item in navItems"
          :key="item.name"
          type="button"
          class="nav_link_btn"
          :class="{active: item.active}"
          @click="openNav(item.name)"
        >
          <span v-if="item.icon === 'cart'" class="nav_icon" aria-hidden="true">🛒</span>
          <span>{{ item.label }}</span>
        </button>
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
  background: rgba(255, 255, 255, .97);
  border-bottom: 1px solid rgba(255, 217, 224, .82);
  box-shadow: 0 8px 24px rgba(255, 107, 127, .06);

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
    background: linear-gradient(135deg, #ff8fa3, #ff667d);
    box-shadow: 0 10px 22px rgba(255, 103, 125, .24);
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

    .nav_link_btn {
      border: 0;
      background: transparent;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 10px;
      border-radius: 999px;
      color: var(--color-text-2);
      font-size: 14px;
      transition: all .18s ease;
      cursor: pointer;

      &:hover {
        color: #ff647c;
        background: rgba(255, 100, 124, .08);
      }

      &.active {
        color: #ff647c;
        background: rgba(255, 100, 124, .12);
        font-weight: 600;
      }
    }

    .nav_icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 15px;
      line-height: 1;
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
    transition: color .18s ease;

    &:hover {
      color: #ff647c;
    }
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
