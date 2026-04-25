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
import F_footer from "@/components/web/f_footer.vue";
import {userStorei} from "@/stores/user_store";

const router = useRouter()
const route = useRoute()
const store = userStorei()

const menus = [
  {name: "web_user_center_info", title: "个人中心", desc: "账号资料与快捷入口", icon: "user"},
  {name: "web_user_center_order", title: "我的订单", desc: "订单记录与详情", icon: "book"},
  {name: "web_user_center_comment", title: "我的评价", desc: "已发布的评价", icon: "star"},
  {name: "web_user_center_evaluate", title: "评论商品", desc: "给已购商品打分", icon: "star"},
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
        <header class="hero_header">
          <router-link class="brand_block" to="/">
            <div class="brand_title">枫枫商城</div>
            <div class="brand_subtitle">享受快人一步</div>
          </router-link>

          <div class="header_actions">
            <button type="button" @click="router.push({name: 'web_home'})">商城首页</button>
            <button type="button" @click="router.push({name: 'web_cart'})">购物车</button>
            <button type="button" @click="router.push({name: 'web_search'})">搜索商品</button>
          </div>
        </header>

        <section class="hero_section">
          <div class="hero_meta">
            <div class="eyebrow">USER CENTER</div>
            <h1>用户中心</h1>
            <p>围绕订单、收藏、足迹、地址、优惠券和消息做一体化个人后台，继续沿用前台白底卡片风格。</p>
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
                <strong>{{ item.title }}</strong>
                <span>{{ item.desc }}</span>
              </div>
            </button>
          </div>
        </aside>

        <main class="content_panel">
          <router-view/>
        </main>
      </section>
    </div>
    <f_footer/>
  </div>
</template>

<style scoped lang="less">
.user_center_view {
  min-height: 100vh;
  color: var(--color-text-1);
  background:
    linear-gradient(180deg, #f5f5f6 0, #f5f5f6 420px, #f2f3f5 420px, #f2f3f5 100%);
}

.page_shell {
  width: min(1180px, calc(100% - 48px));
  margin: 0 auto;
  padding: 26px 0 36px;
}

.hero_surface,
.center_surface {
  border-radius: 18px;
  background: #fff;
  box-shadow: 0 20px 45px rgba(17, 24, 39, .05);
}

.hero_surface {
  padding: 24px 22px 22px;
}

.hero_header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.brand_block {
  text-decoration: none;
  color: inherit;
}

.brand_title {
  font-size: 28px;
  line-height: 1.05;
  color: #ff667d;
  font-weight: 700;
  letter-spacing: .02em;
}

.brand_subtitle {
  margin-top: 6px;
  color: #ff8b9b;
  font-size: 12px;
  letter-spacing: .18em;
}

.header_actions {
  display: flex;
  align-items: center;
  gap: 18px;

  button {
    border: 0;
    background: transparent;
    padding: 0;
    color: #4b5563;
    font-size: 12px;
    cursor: pointer;
  }
}

.hero_section {
  margin-top: 24px;
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) 320px;
  gap: 14px;
}

.hero_meta,
.hero_card {
  border-radius: 16px;
  border: 1px solid #eceef2;
  background: #fff;
}

.hero_meta {
  padding: 24px 22px;
  background: linear-gradient(180deg, #fffafb, #ffffff 62%);
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
  color: #111827;
}

.hero_meta p {
  margin: 0;
  color: #6b7280;
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
    color: #111827;
  }

  span {
    color: #6b7280;
    font-size: 12px;
  }
}

.center_surface {
  margin-top: 18px;
  padding: 18px;
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr);
  gap: 16px;
}

.side_panel,
.content_panel {
  border-radius: 16px;
  border: 1px solid #eceef2;
  background: #fff;
  padding: 18px;
}

.content_panel {
  min-height: 560px;
}

.side_title {
  color: #111827;
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
  border: 1px solid #eceef2;
  background: #fafafb;
  border-radius: 14px;
  padding: 13px 14px;
  cursor: pointer;
  transition: .18s ease;
  display: flex;
  gap: 12px;
  align-items: center;
  min-height: 68px;
  line-height: 1;

  strong,
  span {
    display: block;
  }

  strong {
    color: #111827;
    font-size: 15px;
  }

  span:last-child {
    margin-top: 4px;
    color: #6b7280;
    font-size: 12px;
    line-height: 1.6;
  }

  &.active {
    border-color: #ffccd5;
    background: #fff4f6;
    box-shadow: 0 8px 20px rgba(255, 93, 114, .06);
  }

  &:hover {
    border-color: #ffd5dd;
    background: #fff7f8;
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
  background: linear-gradient(180deg, #fff8fa 0%, #fff 100%);
  border: 1px solid #ffe0e6;
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

  .hero_header {
    align-items: flex-start;
    flex-direction: column;
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
    padding-left: 12px;
    padding-right: 12px;
  }

  .brand_title,
  .hero_meta h1,
  .side_title {
    font-size: 24px;
  }

  .header_actions {
    gap: 10px;
    flex-wrap: wrap;
  }
}
</style>
