<script setup lang="ts">
import {computed} from "vue";
import {useRoute, useRouter} from "vue-router";
import {
  IconBook,
  IconGift,
  IconHeart,
  IconHistory,
  IconLocation,
  IconMessage,
  IconStar,
  IconUser
} from "@arco-design/web-vue/es/icon";
import {userStorei} from "@/stores/user_store";

const router = useRouter()
const route = useRoute()
const store = userStorei()

const menus = [
  {name: "web_user_center_info", title: "个人中心", desc: "账号资料与快捷入口", icon: "user"},
  {name: "web_user_center_order", title: "我的订单", desc: "订单记录与详情", icon: "book"},
  {name: "web_user_center_comment", title: "我的评价", desc: "已发布的评价", icon: "star"},
  {name: "web_user_center_collect", title: "我的收藏", desc: "收藏商品管理", icon: "heart"},
  {name: "web_user_center_look", title: "我的足迹", desc: "浏览记录", icon: "history"},
  {name: "web_user_center_addr", title: "我的地址", desc: "收货地址维护", icon: "location"},
  {name: "web_user_center_coupon", title: "我的优惠券", desc: "可领、未用、已用", icon: "gift"},
  {name: "web_user_center_msg", title: "消息通知", desc: "订单与商品消息", icon: "message"},
]

const activeName = computed(() => typeof route.name === "string" ? route.name : "web_user_center_info")

function go(name: string) {
  if (route.name === name) return
  router.push({name})
}
</script>

<template>
  <div class="user_center_view">
    <div class="page_shell">
      <section class="hero_surface">
        <section class="hero_section">
          <div class="hero_meta">
            <div class="eyebrow">USER CENTER</div>
            <h1>用户中心</h1>
          </div>

          <aside class="hero_card">
            <a-avatar :size="64" :image-url="store.userInfo.avatar || '/logo.png'"/>
            <div class="hero_user">
              <strong>{{ store.userInfo.nickName || store.userInfo.userName || "未命名用户" }}</strong>
              <span>账号：{{ store.userInfo.userName || "-" }}</span>
              <span>ID：{{ store.userInfo.userID || "-" }}</span>
            </div>
          </aside>
        </section>
      </section>

      <section class="center_surface">
        <aside class="side_panel">
          <div class="side_title">功能菜单</div>
          <div class="menu_list">
            <button
              v-for="item in menus"
              :key="item.name"
              class="menu_item"
              :class="{active: activeName === item.name}"
              @click="go(item.name)"
            >
              <span class="menu_icon">
                <IconUser v-if="item.icon === 'user'"/>
                <IconBook v-else-if="item.icon === 'book'"/>
                <IconStar v-else-if="item.icon === 'star'"/>
                <IconHeart v-else-if="item.icon === 'heart'"/>
                <IconHistory v-else-if="item.icon === 'history'"/>
                <IconLocation v-else-if="item.icon === 'location'"/>
                <IconGift v-else-if="item.icon === 'gift'"/>
                <IconMessage v-else/>
              </span>
              <div class="menu_text">
                <strong class="menu_name">{{ item.title }}</strong>
                <span class="menu_desc">{{ item.desc }}</span>
              </div>
            </button>
          </div>
        </aside>

        <main class="content_panel">
          <router-view/>
        </main>
      </section>
    </div>
  </div>
</template>

<style scoped lang="less">
.user_center_view {
  min-height: 100vh;
  color: var(--color-text-1);
  background: var(--web-page-bg);
}

.page_shell {
  width: min(1180px, calc(100% - 48px));
  margin: 0 auto;
  padding: 0 0 36px;
}

.hero_surface,
.center_surface {
  border-radius: 18px;
}

.hero_surface {
  padding: 0;
}

.center_surface {
  background: var(--web-surface);
  box-shadow: var(--web-shadow-lg);
}

.hero_section {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) 320px;
  gap: 14px;
}

.hero_meta,
.hero_card {
  border-radius: 16px;
  border: 1px solid var(--web-border);
  background: var(--web-surface);
}

.hero_meta {
  padding: 24px 22px;
  background: var(--web-hero-grad);
}

.eyebrow {
  color: #ff647c;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: .12em;
}

.hero_meta h1 {
  margin: 10px 0;
  font-size: 36px;
  line-height: 1.05;
  color: var(--web-text);
}

.hero_meta p {
  margin: 0;
  color: var(--web-text-soft);
  font-size: 14px;
  line-height: 1.8;
}

.hero_card {
  padding: 22px 20px;
  display: flex;
  gap: 14px;
  align-items: center;
}

.hero_user {
  display: grid;
  gap: 6px;

  strong {
    font-size: 18px;
    color: var(--web-text);
  }

  span {
    color: var(--web-text-soft);
    font-size: 12px;
  }
}

.center_surface {
  margin-top: 18px;
  padding: 0;
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr);
  gap: 16px;
}

.side_panel,
.content_panel {
  border-radius: 16px;
  border: 1px solid var(--web-border);
  background: var(--web-surface);
  padding: 18px;
}

.content_panel {
  min-height: 560px;
}

.side_title {
  color: var(--web-text);
  font-size: 24px;
  font-weight: 700;
  line-height: 1.1;
  margin-bottom: 14px;
}

.menu_list {
  display: grid;
  gap: 10px;
}

.menu_item {
  width: 100%;
  text-align: left;
  appearance: none;
  border: 1px solid var(--web-border);
  background: var(--web-soft-bg);
  border-radius: 14px;
  padding: 13px 14px;
  cursor: pointer;
  transition: .18s ease;
  display: flex;
  gap: 12px;
  align-items: center;
  min-height: 68px;
  line-height: 1;

  &.active {
    border-color: #ffccd5;
    background: var(--web-brand-soft);
    box-shadow: 0 8px 20px rgba(255, 93, 114, .06);
  }

  &:hover {
    border-color: #ffd5dd;
    background: var(--web-soft-bg-2);
    transform: translateY(-1px);
  }
}

.menu_icon {
  width: 42px;
  height: 42px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  align-self: center;
  flex-shrink: 0;
  background: var(--web-soft-grad);
  border: 1px solid var(--web-border);
  color: #ff637a;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, .9);

  :deep(svg) {
    width: 20px;
    height: 20px;
    display: block;
  }
}

.menu_text {
  flex: 1;
  min-width: 0;
  min-height: 42px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 4px;
}

.menu_name,
.menu_desc {
  display: block;
}

.menu_name {
  color: var(--web-text);
  font-size: 15px;
}

.menu_desc {
  color: var(--web-text-soft);
  font-size: 12px;
  line-height: 1.6;
}

@media (max-width: 1100px) {
  .hero_section,
  .center_surface {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 900px) {
  .page_shell {
    width: calc(100% - 24px);
    padding-top: 12px;
  }

  .hero_surface,
  .center_surface {
    border-radius: 14px;
  }

}

@media (max-width: 640px) {
  .page_shell {
    width: calc(100% - 16px);
  }

  .hero_surface,
  .center_surface,
  .side_panel,
  .content_panel {
    padding-left: 0;
    padding-right: 0;
  }

  .hero_meta h1,
  .side_title {
    font-size: 24px;
  }
}
</style>
