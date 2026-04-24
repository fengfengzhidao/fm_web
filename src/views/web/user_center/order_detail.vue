<script setup lang="ts">
import {computed, onMounted, ref, watch} from "vue";
import {useRoute, useRouter} from "vue-router";
import {Message} from "@arco-design/web-vue";
import {orderCallbackApi, orderDetailApi, orderRevGoodsApi, orderStatusApi, type orderDetailType} from "@/api/order_api";
import {dateTimeFormat} from "@/utils/date";
import {canCommentOrder, canPayOrder, canReceiveOrder, formatPrice, orderStatusColor, orderStatusText} from "@/views/web/user_center/utils";

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const actionLoading = ref(false)
const detail = ref<orderDetailType | null>(null)

const orderID = computed(() => Number(route.params.id))

async function loadDetail() {
  const id = orderID.value
  if (!id) {
    Message.error("订单不存在")
    router.replace({name: "web_user_center_order"})
    return
  }

  loading.value = true
  try {
    const res = await orderDetailApi(id)
    if (res.code) {
      Message.error(res.msg)
      return
    }
    detail.value = res.data
  } catch (error) {
    console.error(error)
    Message.error("订单详情加载失败")
  } finally {
    loading.value = false
  }
}

async function refreshStatus() {
  if (!detail.value?.no) {
    return
  }
  const res = await orderStatusApi({no: detail.value.no})
  if (res.code) {
    Message.error(res.msg)
    return
  }
  if (detail.value) {
    detail.value.status = res.data.status
  }
}

async function goPay() {
  if (!detail.value) {
    return
  }
  actionLoading.value = true
  try {
    if (detail.value.payUrl) {
      window.open(detail.value.payUrl, "_blank")
      return
    }
    Message.warning("当前订单没有支付地址")
  } catch (error) {
    console.error(error)
    Message.error("打开支付页失败")
  } finally {
    actionLoading.value = false
  }
}

async function receiveGoods() {
  if (!detail.value?.id) {
    return
  }
  actionLoading.value = true
  try {
    const res = await orderRevGoodsApi({orderID: detail.value.id})
    if (res.code) {
      Message.error(res.msg)
      return
    }
    Message.success("已确认收货")
    await loadDetail()
  } catch (error) {
    console.error(error)
    Message.error("确认收货失败")
  } finally {
    actionLoading.value = false
  }
}

async function simulatePaid() {
  if (!detail.value?.no) {
    return
  }
  actionLoading.value = true
  try {
    const res = await orderCallbackApi({no: detail.value.no})
    if (res.code) {
      Message.error(res.msg)
      return
    }
    Message.success("支付状态已更新")
    await loadDetail()
  } catch (error) {
    console.error(error)
    Message.error("更新支付状态失败")
  } finally {
    actionLoading.value = false
  }
}

function goEvaluate() {
  if (!detail.value) {
    return
  }
  const firstOrderGoodsID = detail.value.goodsList[0]?.orderGoodsID
  router.push({
    name: "web_user_center_evaluate",
    query: {
      orderID: detail.value.id,
      ...(firstOrderGoodsID ? {orderGoodsID: firstOrderGoodsID} : {}),
    },
  })
}

watch(orderID, loadDetail, {immediate: true})

onMounted(loadDetail)
</script>

<template>
  <div class="order_detail_view">
    <div class="panel_head">
      <div>
        <div class="eyebrow">ORDER DETAIL</div>
        <h2>订单详情</h2>
        <p>查看订单商品、收货地址和结算信息。</p>
      </div>
      <div class="head_actions">
        <a-button @click="refreshStatus">刷新状态</a-button>
        <a-button v-if="detail && canPayOrder(detail.status)" type="primary" :loading="actionLoading" @click="goPay">去支付</a-button>
        <a-button v-if="detail && canPayOrder(detail.status)" :loading="actionLoading" @click="simulatePaid">模拟支付完成</a-button>
        <a-button v-if="detail && canReceiveOrder(detail.status)" type="primary" :loading="actionLoading" @click="receiveGoods">确认收货</a-button>
        <a-button v-if="detail && canCommentOrder(detail.status)" @click="goEvaluate">去评价</a-button>
        <a-button @click="router.back()">返回</a-button>
      </div>
    </div>

    <a-spin :loading="loading">
      <div v-if="detail" class="detail_grid">
        <section class="detail_card">
          <div class="card_title">订单信息</div>
          <div class="info_list">
            <div>订单号：{{ detail.no }}</div>
            <div>创建时间：{{ dateTimeFormat(detail.createdAt) }}</div>
            <div>更新时间：{{ dateTimeFormat(detail.updatedAt) }}</div>
            <div>状态：<a-tag :color="orderStatusColor(detail.status)">{{ orderStatusText(detail.status) }}</a-tag></div>
            <div>订单金额：￥{{ formatPrice(detail.price) }}</div>
            <div>优惠金额：￥{{ formatPrice(detail.coupon) }}</div>
            <div>支付方式：{{ detail.payType }}</div>
            <div>支付地址：<a-link v-if="detail.payUrl" :href="detail.payUrl" target="_blank">打开支付页</a-link><span v-else>暂无</span></div>
          </div>
        </section>

        <section class="detail_card">
          <div class="card_title">收货地址</div>
          <div class="addr_box">
            <strong>{{ detail.addrInfo.name }}</strong>
            <span>{{ detail.addrInfo.tel }}</span>
            <span>{{ detail.addrInfo.addr }} {{ detail.addrInfo.detailAddr }}</span>
          </div>
        </section>

        <section class="detail_card detail_goods">
          <div class="card_title">商品列表</div>
          <article v-for="item in detail.goodsList" :key="item.orderGoodsID" class="goods_row">
            <img :src="item.cover" :alt="item.title">
            <div class="goods_meta">
              <strong>{{ item.title }}</strong>
              <span>单价 ￥{{ formatPrice(item.price) }}</span>
              <span>数量 x{{ item.num }}</span>
              <span>备注：{{ item.note || "无" }}</span>
            </div>
          </article>
        </section>

        <section class="detail_card">
          <div class="card_title">优惠券</div>
          <div v-if="detail.couponList.length" class="coupon_list">
            <div v-for="coupon in detail.couponList" :key="coupon.couponPrice + coupon.type" class="coupon_item">
              <strong>￥{{ formatPrice(coupon.couponPrice) }}</strong>
              <span>类型 {{ coupon.type }}</span>
            </div>
          </div>
          <a-empty v-else description="暂无优惠券"/>
        </section>
      </div>
      <a-empty v-else description="未找到订单"/>
    </a-spin>
  </div>
</template>

<style scoped lang="less">
.order_detail_view {
  display: grid;
  gap: 18px;
}

.panel_head {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
}

.head_actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.panel_head h2 {
  margin: 8px 0 8px;
  font-size: 30px;
}

.panel_head p,
.info_list,
.addr_box span,
.goods_meta span,
.coupon_item span {
  color: var(--color-text-2);
}

.eyebrow {
  color: #ff5d72;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: .08em;
}

.detail_grid {
  display: grid;
  gap: 14px;
}

.detail_card {
  padding: 18px;
  border-radius: 22px;
  background: var(--color-fill-1);
  border: 1px solid var(--color-border-2);
}

.card_title {
  font-size: 18px;
  font-weight: 800;
  margin-bottom: 12px;
}

.info_list {
  display: grid;
  gap: 8px;
  line-height: 1.7;
}

.addr_box {
  display: grid;
  gap: 6px;
  line-height: 1.7;
}

.detail_goods {
  display: grid;
  gap: 12px;
}

.goods_row {
  display: grid;
  grid-template-columns: 96px minmax(0, 1fr);
  gap: 14px;
  padding: 12px;
  border-radius: 18px;
  background: var(--color-bg-1);
}

.goods_row img {
  width: 96px;
  height: 96px;
  border-radius: 14px;
  object-fit: cover;
}

.goods_meta {
  display: grid;
  gap: 4px;
}

.goods_meta strong,
.coupon_item strong {
  font-size: 16px;
}

.coupon_list {
  display: grid;
  gap: 10px;
}

.coupon_item {
  padding: 12px 14px;
  border-radius: 16px;
  background: var(--color-bg-1);
}

@media (max-width: 768px) {
  .panel_head {
    flex-direction: column;
  }

  .head_actions {
    justify-content: flex-start;
  }

  .goods_row {
    grid-template-columns: 1fr;
  }

  .goods_row img {
    width: 100%;
    height: auto;
    aspect-ratio: 1;
  }
}
</style>
