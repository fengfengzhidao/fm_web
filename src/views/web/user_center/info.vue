<script setup lang="ts">
import {computed} from "vue";
import {useRouter} from "vue-router";
import {userStorei} from "@/stores/user_store";

const router = useRouter()
const store = userStorei()

const quickLinks = [
  {title: "我的订单", name: "web_user_center_order"},
  {title: "我的收藏", name: "web_user_center_collect"},
  {title: "我的地址", name: "web_user_center_addr"},
  {title: "我的优惠券", name: "web_user_center_coupon"},
]

const roleText = computed(() => store.isAdmin ? "管理员" : "普通用户")
</script>

<template>
  <div class="info_view">
    <div class="panel_head">
      <div>
        <div class="eyebrow">PROFILE</div>
        <h2>个人中心</h2>
        <p>查看当前账号信息，并快速进入常用模块。</p>
      </div>
    </div>

    <div class="profile_card">
      <a-avatar :size="84" :image-url="store.userInfo.avatar || '/logo.png'"/>
      <div class="profile_body">
        <strong>{{ store.userInfo.nickName || store.userInfo.userName || "未命名用户" }}</strong>
        <span>用户名：{{ store.userInfo.userName || "-" }}</span>
        <span>角色：{{ roleText }}</span>
        <span>用户ID：{{ store.userInfo.userID || "-" }}</span>
      </div>
    </div>

    <div class="quick_grid">
      <button v-for="item in quickLinks" :key="item.name" class="quick_card" @click="router.push({name: item.name})">
        <strong>{{ item.title }}</strong>
        <span>进入对应管理页</span>
      </button>
    </div>
  </div>
</template>

<style scoped lang="less">
.info_view {
  display: grid;
  gap: 18px;
}

.panel_head h2 {
  margin: 8px 0 8px;
  font-size: 30px;
}

.panel_head p,
.profile_body span {
  color: var(--color-text-2);
}

.eyebrow {
  color: #ff5d72;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: .08em;
}

.profile_card {
  display: flex;
  gap: 18px;
  align-items: center;
  padding: 20px;
  border-radius: 22px;
  background: var(--color-fill-1);
  border: 1px solid var(--color-border-2);
}

.profile_body {
  display: grid;
  gap: 6px;
}

.profile_body strong {
  font-size: 22px;
}

.quick_grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}

.quick_card {
  text-align: left;
  padding: 18px;
  border-radius: 18px;
  border: 1px solid var(--color-border-2);
  background: linear-gradient(135deg, rgba(255, 93, 114, .08), rgba(255, 255, 255, 1));
  cursor: pointer;

  strong,
  span {
    display: block;
  }

  span {
    margin-top: 6px;
    color: var(--color-text-2);
  }
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
