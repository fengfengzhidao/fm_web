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
  --web-page-bg: #ffffff;
  --web-surface: #ffffff;
  --web-surface-alt: #fffafb;
  --web-soft-bg: #fafafb;
  --web-soft-bg-2: #fff4f6;
  --web-border: #eceef2;
  --web-border-strong: #e3e7ee;
  --web-text: #111827;
  --web-text-soft: #6b7280;
  --web-text-muted: #9ca3af;
  --web-brand: #ff667d;
  --web-brand-soft: #ff8b9b;
  --web-menu-active-bg: #fff1f4;
  --web-menu-active-border: #ffccd5;
  --web-menu-active-text: #111827;
  --web-menu-active-desc: #ff7d92;
  --web-menu-active-icon-bg: linear-gradient(180deg, #fff8fa 0%, #fff 100%);
  --web-status-badge-bg: linear-gradient(135deg, #ff8ea5 0%, #ff6f8e 100%);
  --web-status-badge-border: transparent;
  --web-status-badge-text: #ffffff;
  --web-hero-grad: linear-gradient(180deg, #fffafb, #ffffff 62%);
  --web-soft-grad: linear-gradient(180deg, #fff7f8 0%, #fff 100%);
  --web-footer-grad: linear-gradient(180deg, rgba(255, 249, 250, .96), rgba(255, 255, 255, .98));
  --web-shadow-lg: 0 20px 45px rgba(17, 24, 39, .05);
  --web-shadow-soft: 0 14px 34px rgba(255, 107, 127, .05);
  background: var(--web-page-bg);

  &[arco-theme="dark"],
  body[arco-theme="dark"] & {
    --web-page-bg: #0f1115;
    --web-surface: #171a21;
    --web-surface-alt: #1b2029;
    --web-soft-bg: #20252f;
    --web-soft-bg-2: #241e26;
    --web-border: rgba(255, 255, 255, .08);
    --web-border-strong: rgba(255, 255, 255, .14);
    --web-text: #f4f6fb;
    --web-text-soft: #aab2c5;
    --web-text-muted: #7f8799;
    --web-brand: #ff8ea5;
    --web-brand-soft: #ffb3c1;
    --web-menu-active-bg: #2b2430;
    --web-menu-active-border: rgba(255, 142, 165, .42);
    --web-menu-active-text: #fff4f7;
    --web-menu-active-desc: #ff9cb0;
    --web-menu-active-icon-bg: linear-gradient(180deg, #2a2330 0%, #1f222c 100%);
    --web-status-badge-bg: rgba(255, 142, 165, .16);
    --web-status-badge-border: rgba(255, 142, 165, .36);
    --web-status-badge-text: #ffb7c5;
    --web-hero-grad: linear-gradient(180deg, #1b2029, #151821 62%);
    --web-soft-grad: linear-gradient(180deg, #20252f 0%, #171a21 100%);
    --web-footer-grad: linear-gradient(180deg, rgba(19, 22, 29, .96), rgba(15, 17, 21, .98));
    --web-shadow-lg: 0 24px 50px rgba(0, 0, 0, .28);
    --web-shadow-soft: 0 18px 40px rgba(0, 0, 0, .24);
  }

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
