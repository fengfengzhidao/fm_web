<script setup lang="ts">
import {onMounted, ref} from "vue";
import {Message} from "@arco-design/web-vue";
import {couponAcceptableListApi, couponReceiveApi, userCouponListApi, type acceptableCouponType, type userCouponType} from "@/api/coupon_api";
import {formatPrice, userCouponStatusText} from "@/views/web/user_center/utils";

const loading = ref(false)
const active = ref("available")
const availableList = ref<acceptableCouponType[]>([])
const mineList = ref<userCouponType[]>([])
const usedList = ref<userCouponType[]>([])

async function loadList() {
  loading.value = true
  try {
    const [availableRes, mineRes, usedRes] = await Promise.all([
      couponAcceptableListApi({limit: 50, page: 1}),
      userCouponListApi({status: 2, limit: 50, page: 1}),
      userCouponListApi({status: 3, limit: 50, page: 1}),
    ])
    if (availableRes.code) Message.warning(availableRes.msg)
    if (mineRes.code) Message.warning(mineRes.msg)
    if (usedRes.code) Message.warning(usedRes.msg)
    availableList.value = availableRes.code ? [] : (availableRes.data.list || [])
    mineList.value = mineRes.code ? [] : (mineRes.data.list || [])
    usedList.value = usedRes.code ? [] : (usedRes.data.list || [])
  } catch (error) {
    console.error(error)
    Message.error("优惠券加载失败")
  } finally {
    loading.value = false
  }
}

async function receiveCoupon(item: acceptableCouponType) {
  const res = await couponReceiveApi({couponID: item.id})
  if (res.code) {
    Message.error(res.msg)
    return
  }
  Message.success("领取成功")
  await loadList()
}

onMounted(loadList)
</script>

<template>
  <div class="page_view">
    <div class="panel_head">
      <div>
        <div class="eyebrow">COUPON</div>
        <h2>我的优惠券</h2>
      </div>
    </div>

    <div class="summary_grid">
      <article class="summary_card">
        <strong>{{ availableList.length }}</strong>
        <span>待领取</span>
      </article>
      <article class="summary_card">
        <strong>{{ mineList.length }}</strong>
        <span>未使用</span>
      </article>
      <article class="summary_card">
        <strong>{{ usedList.length }}</strong>
        <span>已使用</span>
      </article>
    </div>

    <a-tabs v-model:active-key="active" class="coupon_tabs">
      <a-tab-pane key="available" title="待领取的优惠券">
        <a-spin :loading="loading">
          <div v-if="availableList.length" class="coupon_grid">
            <article v-for="item in availableList" :key="item.id" class="coupon_card">
              <div class="coupon_price">￥{{ formatPrice(item.couponPrice) }}</div>
              <div class="coupon_title">{{ item.title || "通用优惠券" }}</div>
              <div class="coupon_meta">满 {{ formatPrice(item.threshold) }} 可用</div>
              <div class="coupon_meta">可在结算时自动匹配使用</div>
              <span v-if="item.isReceive" class="coupon_state">已领取</span>
              <a-button v-else type="primary" @click="receiveCoupon(item)">立即领取</a-button>
            </article>
          </div>
          <a-empty v-else description="暂无可领取优惠券"/>
        </a-spin>
      </a-tab-pane>

      <a-tab-pane key="mine" title="未使用">
        <a-spin :loading="loading">
          <div v-if="mineList.length" class="coupon_list">
            <article v-for="item in mineList" :key="item.id" class="coupon_row">
              <div class="row_main">
                <strong>{{ item.title }}</strong>
                <span>￥{{ formatPrice(item.couponPrice) }}，满 {{ formatPrice(item.threshold) }} 可用</span>
              </div>
              <span class="row_state">{{ userCouponStatusText(item.status) }}</span>
            </article>
          </div>
          <a-empty v-else description="暂无未使用优惠券"/>
        </a-spin>
      </a-tab-pane>

      <a-tab-pane key="used" title="已使用">
        <a-spin :loading="loading">
          <div v-if="usedList.length" class="coupon_list">
            <article v-for="item in usedList" :key="item.id" class="coupon_row">
              <div class="row_main">
                <strong>{{ item.title }}</strong>
                <span>￥{{ formatPrice(item.couponPrice) }}，满 {{ formatPrice(item.threshold) }} 可用</span>
              </div>
              <span class="row_state used">{{ userCouponStatusText(item.status) }}</span>
            </article>
          </div>
          <a-empty v-else description="暂无已使用优惠券"/>
        </a-spin>
      </a-tab-pane>
    </a-tabs>
  </div>
</template>

<style scoped lang="less">
.page_view {
  display: grid;
  gap: 18px;
}

.panel_head {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: center;
}

.panel_head h2 {
  margin: 8px 0 8px;
  font-size: 30px;
}

.panel_head p,
.coupon_row span,
.coupon_card span {
  color: var(--color-text-2);
}

.eyebrow {
  color: #ff5d72;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: .12em;
}

.coupon_grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.summary_grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.summary_card {
  padding: 18px 20px;
  border-radius: 18px;
  background: linear-gradient(180deg, #fffafb, #fff);
  border: 1px solid #eceef2;
  box-shadow: 0 12px 30px rgba(17, 24, 39, .04);
}

.summary_card strong {
  display: block;
  font-size: 26px;
  color: #ff647c;
}

.summary_card span {
  color: var(--color-text-2);
}

.coupon_tabs {
  :deep(.arco-tabs-nav::before) {
    background: #f1f3f6;
  }

  :deep(.arco-tabs-tab) {
    color: #6b7280;
    font-weight: 600;
  }

  :deep(.arco-tabs-tab-active),
  :deep(.arco-tabs-tab:hover) {
    color: #ff647c;
  }

  :deep(.arco-tabs-nav-ink) {
    background: #ff647c;
  }
}

.coupon_card,
.coupon_row {
  display: grid;
  gap: 8px;
  padding: 18px;
  border-radius: 18px;
  background: linear-gradient(180deg, #fffafb, #fff);
  border: 1px solid #eceef2;
  box-shadow: 0 12px 30px rgba(17, 24, 39, .04);
}

.coupon_price {
  color: #ff647c;
  font-size: 26px;
  font-weight: 800;
}

.coupon_title {
  color: #111827;
  font-size: 16px;
  font-weight: 700;
}

.coupon_meta {
  color: #6b7280;
  font-size: 13px;
}

.coupon_state,
.row_state {
  justify-self: start;
  padding: 7px 12px;
  border-radius: 999px;
  color: #ff647c;
  font-size: 12px;
  font-weight: 700;
  background: #fff2f5;
  border: 1px solid #ffd4dc;
}

.coupon_list {
  display: grid;
  gap: 12px;
}

.coupon_row {
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 16px;
}

.row_main {
  display: grid;
  gap: 6px;
}

.row_main strong {
  color: #111827;
  font-size: 16px;
}

.row_state.used {
  color: #9ca3af;
  background: #f8fafc;
  border-color: #e5e7eb;
}

@media (max-width: 768px) {
  .coupon_grid {
    grid-template-columns: 1fr;
  }

  .summary_grid {
    grid-template-columns: 1fr;
  }

  .coupon_row {
    grid-template-columns: 1fr;
  }
}
</style>
