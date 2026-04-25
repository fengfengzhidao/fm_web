<script setup lang="ts">
import {computed} from "vue";
import {useRoute} from "vue-router";
import {userStorei} from "@/stores/user_store";
import {title, ico} from "@/conf/global";
import {loadTheme} from "@/components/common/f_theme";
import F_login_modal from "@/components/web/f_login_modal.vue";
import F_nav from "@/components/web/f_nav.vue";

loadTheme()
const store = userStorei()
const route = useRoute()
const isWebRoute = computed(() => route.path === "/" || (!route.path.startsWith("/admin") && !route.path.startsWith("/login")))

store.loadUserInfo()

if (title) {
  document.title = title
}
if (ico) {
  const link = document.querySelector('link[rel="icon"]')
  if (link) {
    link.setAttribute("href", ico)
  }
}

</script>

<template>
  <div class="app_shell" :class="{web_theme: isWebRoute}">
    <f_nav v-if="isWebRoute"/>
    <div class="router_shell" :class="{web_content: isWebRoute}">
      <router-view></router-view>
    </div>
    <f_login_modal/>
  </div>
</template>

<style lang="less">
.router_shell.web_content {
  padding-top: 0;
}

@media (max-width: 768px) {
  .router_shell.web_content {
    padding-top: 0;
  }
}

.app_shell.web_theme {
  --web-primary: #ff6f8e;
  --web-primary-hover: #ff6385;
  --web-primary-active: #ef4f75;
  --web-primary-glow: rgba(255, 111, 142, .28);
  --web-primary-glow-strong: rgba(255, 111, 142, .36);

  .arco-btn-primary {
    color: #fff;
    border-color: transparent;
    background: linear-gradient(135deg, #ff8ea5 0%, var(--web-primary) 55%, #ff5f82 100%);
    box-shadow: 0 12px 28px var(--web-primary-glow);
    transition:
      transform .16s ease,
      box-shadow .16s ease,
      filter .16s ease,
      background .16s ease;
  }

  .arco-btn-primary:not(.arco-btn-disabled):hover {
    border-color: transparent;
    background: linear-gradient(135deg, #ff9aaf 0%, var(--web-primary-hover) 56%, #ff6b8d 100%);
    box-shadow: 0 16px 30px var(--web-primary-glow-strong);
    transform: translateY(-1px);
  }

  .arco-btn-primary:not(.arco-btn-disabled):active {
    border-color: transparent;
    background: linear-gradient(135deg, #ff6f8e 0%, var(--web-primary-active) 58%, #de456a 100%);
    box-shadow:
      inset 0 3px 8px rgba(176, 26, 69, .18),
      0 8px 18px rgba(239, 79, 117, .24);
    transform: translateY(1px) scale(.985);
    filter: saturate(1.02);
  }

  .arco-btn-primary:not(.arco-btn-disabled):focus-visible {
    box-shadow:
      0 0 0 3px rgba(255, 255, 255, .78),
      0 0 0 6px rgba(255, 111, 142, .2),
      0 14px 28px var(--web-primary-glow-strong);
  }

  .arco-btn-primary.arco-btn-loading,
  .arco-btn-primary.arco-btn-disabled {
    border-color: transparent;
    background: linear-gradient(135deg, #ffb3c2 0%, #ff9ab0 100%);
    box-shadow: none;
    transform: none;
  }
}
</style>
