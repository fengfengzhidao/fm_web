<script setup lang="ts">
import {computed} from "vue";
import {useRoute, useRouter} from "vue-router";
import F_nav from "@/components/web/f_nav.vue";
import F_main from "@/components/web/f_main.vue";
import F_footer from "@/components/web/f_footer.vue";
import {userStorei} from "@/stores/user_store";

const router = useRouter()
const route = useRoute()
const store = userStorei()

const menus = [
  {name: "web_user_center_info", title: "个人中心", desc: "账号资料与快捷入口"},
  {name: "web_user_center_order", title: "我的订单", desc: "订单记录与详情"},
  {name: "web_user_center_comment", title: "我的评价", desc: "已发布的评价"},
  {name: "web_user_center_evaluate", title: "评论商品", desc: "给已购商品打分"},
  {name: "web_user_center_collect", title: "我的收藏", desc: "收藏商品管理"},
  {name: "web_user_center_look", title: "我的足迹", desc: "浏览记录"},
  {name: "web_user_center_addr", title: "我的地址", desc: "收货地址维护"},
  {name: "web_user_center_coupon", title: "我的优惠券", desc: "可领、未用、已用"},
  {name: "web_user_center_msg", title: "消息通知", desc: "订单与商品消息"},
]

const activeName = computed(() => typeof route.name === "string" ? route.name : "web_user_center_info")

function go(name: string) {
  if (route.name === name) return
  router.push({name})
}
</script>

<template>
  <div class="user_center_view">
    <f_nav no-scroll/>
    <f_main>
      <section class="hero_shell">
        <div class="hero_meta">
          <div class="eyebrow">USER CENTER</div>
          <h1>用户后台</h1>
          <p>围绕订单、收藏、足迹、地址、优惠券和消息做的个人中心。</p>
        </div>
        <div class="hero_card">
          <a-avatar :size="60" :image-url="store.userInfo.avatar || '/logo.png'"/>
          <div class="hero_user">
            <strong>{{ store.userInfo.nickName || store.userInfo.userName || "未命名用户" }}</strong>
            <span>账号：{{ store.userInfo.userName || "-" }}</span>
          </div>
        </div>
      </section>

      <section class="center_shell">
        <aside class="side_panel">
          <div class="side_title">功能菜单</div>
          <div class="menu_list">
            <button
              v-for="item in menus"
              :key="item.name"
              class="menu_item"
              :class="{active: activeName === item.name}"
              @click="go(item.name)">
              <strong>{{ item.title }}</strong>
              <span>{{ item.desc }}</span>
            </button>
          </div>
        </aside>

        <main class="content_panel">
          <router-view/>
        </main>
      </section>
    </f_main>
    <f_footer/>
  </div>
</template>

<style scoped lang="less">
.user_center_view {
  color: var(--color-text-1);
}

.hero_shell,
.center_shell {
  margin: 24px max(20px, calc((100% - 1200px) / 2));
}

.hero_shell {
  margin-top: 84px;
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) 340px;
  gap: 20px;
  padding: 28px;
  border-radius: 24px;
  background: linear-gradient(135deg, #fff 0%, #fff8fa 100%);
  border: 1px solid var(--color-border-2);
  box-shadow: 0 10px 40px rgba(15, 23, 42, .04);
}

.eyebrow {
  color: #ff5d72;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: .08em;
}

.hero_meta h1 {
  margin: 12px 0 10px;
  font-size: 42px;
  line-height: 1.08;
}

.hero_meta p {
  margin: 0;
  color: var(--color-text-2);
  line-height: 1.8;
}

.hero_card {
  display: flex;
  gap: 16px;
  align-items: center;
  padding: 20px;
  border-radius: 22px;
  background: rgba(255, 93, 114, .08);
}

.hero_user {
  display: grid;
  gap: 4px;
}

.hero_user strong {
  font-size: 20px;
}

.hero_user span {
  color: var(--color-text-2);
}

.center_shell {
  display: grid;
  grid-template-columns: 270px minmax(0, 1fr);
  gap: 20px;
}

.side_panel,
.content_panel {
  padding: 20px;
  border-radius: 24px;
  background: var(--color-bg-1);
  border: 1px solid var(--color-border-2);
  box-shadow: 0 10px 40px rgba(15, 23, 42, .04);
}

.side_title {
  font-size: 18px;
  font-weight: 800;
  margin-bottom: 14px;
}

.menu_list {
  display: grid;
  gap: 10px;
}

.menu_item {
  width: 100%;
  text-align: left;
  border: 1px solid var(--color-border-2);
  background: var(--color-fill-1);
  border-radius: 18px;
  padding: 14px 16px;
  cursor: pointer;
  transition: all .2s ease;

  strong,
  span {
    display: block;
  }

  strong {
    font-size: 16px;
  }

  span {
    margin-top: 4px;
    color: var(--color-text-2);
    font-size: 12px;
  }

  &.active {
    border-color: rgba(255, 93, 114, .32);
    background: rgba(255, 93, 114, .08);
  }
}

@media (max-width: 1100px) {
  .hero_shell,
  .center_shell {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .hero_shell,
  .center_shell {
    margin-left: 16px;
    margin-right: 16px;
  }

  .hero_shell {
    margin-top: 76px;
    padding: 20px;
  }

  .hero_meta h1 {
    font-size: 34px;
  }
}
</style>
