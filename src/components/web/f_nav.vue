<script setup lang="ts">
import {computed, onMounted, onUnmounted, ref} from "vue";
import {slogan, enSlogan} from "@/conf/global";
import {useRoute, useRouter} from "vue-router";
import {userStorei} from "@/stores/user_store";

const route = useRoute()
const router = useRouter()
const store = userStorei()

interface Props {
  noScroll?: boolean
  scrollTop?: number
}

const props = defineProps<Props>()
const {noScroll = false, scrollTop = 200} = props

const isShow = ref(noScroll)
const showBrand = computed(() => route.name !== "web_home")

const navItems = computed(() => [
  ...(store.isAdmin ? [{
    label: "后台管理",
    name: "home",
    active: route.name === "home" || route.name === "dataStatistics",
  }] : []),
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
      <router-link v-if="showBrand" class="brand" to="/">
        <div class="brand_text">
          <strong>{{ slogan }}</strong>
          <span>享受快人一步</span>
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
    </div>
  </div>
</template>

<style lang="less">
.f_nav {
  width: 100%;
  height: 72px;
  display: flex;
  justify-content: center;
  color: var(--color-text-1);
  background: transparent;

  .container {
    width: min(1180px, calc(100% - 48px));
    display: flex;
    align-items: center;
    gap: 20px;
  }

  .brand {
    text-decoration: none;
    color: inherit;
    flex: 0 0 auto;
  }

  .brand_text {
    display: grid;
    gap: 6px;

    strong {
      font-size: 22px;
      line-height: 1;
      font-weight: 700;
      color: #ff667d;
      letter-spacing: .02em;
    }

    span {
      color: #ff8b9b;
      font-size: 12px;
      line-height: 1;
      letter-spacing: .18em;
    }
  }

  .nav_links {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1 1 auto;
    min-width: 0;
    justify-content: flex-end;
    margin-left: auto;

    .nav_link_btn {
      border: 0;
      background: transparent;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 6px;
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
}

@media (max-width: 900px) {
  .f_nav {
    .container {
      width: calc(100% - 24px);
    }
  }
}

@media (max-width: 768px) {
  .f_nav {
    height: 66px;

    .container {
      width: calc(100% - 16px);
      gap: 12px;
    }

    .brand {
      display: none;
    }

    .nav_links {
      display: none;
    }
  }
}
</style>
