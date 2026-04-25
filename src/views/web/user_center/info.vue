<script setup lang="ts">
import {computed} from "vue";
import {useRouter} from "vue-router";
import {
  IconGift,
  IconLocation,
  IconOrderedList,
  IconStar
} from "@arco-design/web-vue/es/icon";
import {userStorei} from "@/stores/user_store";

const router = useRouter()
const store = userStorei()

const quickLinks = [
  {title: "我的订单", desc: "查看订单记录与详情", name: "web_user_center_order", icon: "order"},
  {title: "我的收藏", desc: "管理收藏商品", name: "web_user_center_collect", icon: "star"},
  {title: "我的地址", desc: "维护收货地址", name: "web_user_center_addr", icon: "location"},
  {title: "我的优惠券", desc: "查看可用优惠券", name: "web_user_center_coupon", icon: "gift"},
]

const roleText = computed(() => store.isAdmin ? "管理员" : "普通用户")
</script>

<template>
  <div class="info_view">
    <div class="panel_head">
      <div class="eyebrow">PROFILE</div>
      <h2>个人中心</h2>
      <p>查看当前账号信息，并快速进入最常用的订单、收藏、地址和优惠券模块。</p>
    </div>

    <div class="profile_card">
      <a-avatar :size="88" :image-url="store.userInfo.avatar || '/logo.png'"/>
      <div class="profile_body">
        <strong>{{ store.userInfo.nickName || store.userInfo.userName || "未命名用户" }}</strong>
        <span>用户名：{{ store.userInfo.userName || "-" }}</span>
        <span>角色：{{ roleText }}</span>
        <span>用户ID：{{ store.userInfo.userID || "-" }}</span>
      </div>
    </div>

    <div class="quick_grid">
      <button v-for="item in quickLinks" :key="item.name" class="quick_card" @click="router.push({name: item.name})">
        <span class="card_icon">
          <IconOrderedList v-if="item.icon === 'order'"/>
          <IconStar v-else-if="item.icon === 'star'"/>
          <IconLocation v-else-if="item.icon === 'location'"/>
          <IconGift v-else/>
        </span>
        <strong>{{ item.title }}</strong>
        <span>{{ item.desc }}</span>
      </button>
    </div>
  </div>
</template>

<style scoped lang="less">
.info_view {
  display: grid;
  gap: 18px;
}

.eyebrow {
  color: #ff647c;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: .12em;
}

.panel_head h2 {
  margin: 10px 0 8px;
  color: #111827;
  font-size: 32px;
  line-height: 1.1;
}

.panel_head p,
.profile_body span,
.quick_card span:last-child {
  color: #6b7280;
}

.panel_head p {
  margin: 0;
  font-size: 14px;
  line-height: 1.8;
}

.profile_card {
  display: flex;
  gap: 18px;
  align-items: center;
  padding: 22px;
  border-radius: 16px;
  background: linear-gradient(180deg, #fffafb, #ffffff 62%);
  border: 1px solid #eceef2;
}

.profile_body {
  display: grid;
  gap: 6px;
}

.profile_body strong {
  color: #111827;
  font-size: 24px;
}

.profile_body span {
  font-size: 13px;
}

.quick_grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.quick_card {
  text-align: left;
  padding: 18px;
  border-radius: 14px;
  border: 1px solid #eceef2;
  background: #fafafb;
  cursor: pointer;
  transition: .18s ease;

  &:hover {
    border-color: #ffccd5;
    background: #fff4f6;
  }

  strong,
  span {
    display: block;
  }

  strong {
    margin-top: 12px;
    color: #111827;
    font-size: 16px;
  }

  span:last-child {
    margin-top: 6px;
    font-size: 12px;
    line-height: 1.7;
  }
}

.card_icon {
  width: 36px;
  height: 36px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  background: #fff;
  color: #ff637a;
  font-size: 18px;
}

@media (max-width: 768px) {
  .profile_card {
    flex-direction: column;
    align-items: flex-start;
  }

  .quick_grid {
    grid-template-columns: 1fr;
  }
}
</style>
