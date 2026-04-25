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

    <div class="profile_actions">
      <a-popconfirm content="确定退出当前登录状态吗？" @ok="store.userLogout()">
        <a-button status="danger">退出登录</a-button>
      </a-popconfirm>
    </div>

    <div class="quick_grid">
      <button v-for="item in quickLinks" :key="item.name" class="quick_card" @click="router.push({name: item.name})">
        <span class="card_icon">
          <IconOrderedList v-if="item.icon === 'order'"/>
          <IconStar v-else-if="item.icon === 'star'"/>
          <IconLocation v-else-if="item.icon === 'location'"/>
          <IconGift v-else/>
        </span>
        <div class="quick_text">
          <strong class="quick_name">{{ item.title }}</strong>
          <span class="quick_desc">{{ item.desc }}</span>
        </div>
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

.profile_actions {
  display: flex;
  justify-content: flex-start;
}

.quick_card {
  text-align: left;
  appearance: none;
  padding: 18px;
  border-radius: 14px;
  border: 1px solid #eceef2;
  background: #fafafb;
  cursor: pointer;
  transition: .18s ease;
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr);
  column-gap: 14px;
  align-items: center;
  min-height: 108px;
  line-height: 1;

  &:hover {
    border-color: #ffccd5;
    background: #fff4f6;
    transform: translateY(-1px);
  }
}

.card_icon {
  width: 44px;
  height: 44px;
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

.quick_text {
  min-width: 0;
  min-height: 44px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 8px;
}

.quick_name,
.quick_desc {
  display: block;
}

.quick_name {
  color: #111827;
  font-size: 16px;
}

.quick_desc {
  color: #6b7280;
  font-size: 12px;
  line-height: 1.7;
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
