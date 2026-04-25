<script setup lang="ts">
import {computed, onMounted, ref, watch} from "vue";
import {useRoute, useRouter} from "vue-router";
import {Message} from "@arco-design/web-vue";
import {
  IconCheckCircle,
  IconGift,
  IconLocation,
  IconSafe
} from "@arco-design/web-vue/es/icon";
import {orderCallbackApi, orderDetailApi, orderRevGoodsApi, orderStatusApi, type orderDetailType} from "@/api/order_api";
import {dateTimeFormat} from "@/utils/date";
import {canPayOrder, canReceiveOrder, formatPrice, orderStatusColor, orderStatusText} from "@/views/web/user_center/utils";

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const actionLoading = ref(false)
const detail = ref<orderDetailType | null>(null)

const orderID = computed(() => Number(route.params.id))

function resolvePayRoute(payUrl: string): string {
  try {
    const target = new URL(payUrl, window.location.origin)
    if (target.pathname.startsWith("/order/pay")) {
      return `${target.pathname}${target.search}`
    }
    return target.toString()
  } catch (error) {
    return payUrl
  }
}

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
      router.push(resolvePayRoute(detail.value.payUrl))
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

watch(orderID, loadDetail, {immediate: true})

onMounted(loadDetail)
</script>

<template>
  <div class="order_detail_view">
    <div class="panel_head">
      <div>
        <div class="eyebrow">ORDER DETAIL</div>
        <h2>订单详情</h2>
      </div>
      <div class="head_actions">
        <a-button @click="refreshStatus">刷新状态</a-button>
        <a-button v-if="detail && canPayOrder(detail.status)" type="primary" :loading="actionLoading" @click="goPay">去支付</a-button>
        <a-button v-if="detail && canPayOrder(detail.status)" :loading="actionLoading" @click="simulatePaid">模拟支付完成</a-button>
        <a-button v-if="detail && canReceiveOrder(detail.status)" type="primary" :loading="actionLoading" @click="receiveGoods">确认收货</a-button>
        <a-button @click="router.back()">返回</a-button>
      </div>
    </div>

    <a-spin :loading="loading">
      <div v-if="detail" class="detail_stack">
        <section class="status_card">
          <div class="status_main">
            <div class="status_copy">
              <div class="card_label">订单状态</div>
              <div class="status_row">
                <h3>{{ orderStatusText(detail.status) }}</h3>
                <a-tag :color="orderStatusColor(detail.status)">{{ orderStatusText(detail.status) }}</a-tag>
              </div>
              <div class="status_no">订单号：{{ detail.no }}</div>
            </div>

            <div class="status_price">
              <span>实付金额</span>
              <strong>￥{{ formatPrice(detail.price) }}</strong>
              <em>已优惠 ￥{{ formatPrice(detail.coupon) }}</em>
            </div>
          </div>

          <div class="status_meta">
            <span><IconCheckCircle/> 创建时间：{{ dateTimeFormat(detail.createdAt) }}</span>
            <span><IconSafe/> 更新时间：{{ dateTimeFormat(detail.updatedAt) }}</span>
          </div>
        </section>

        <section class="content_card">
          <section class="content_section">
            <div class="section_head">
              <div class="card_title">收货与支付</div>
            </div>

            <div class="info_grid">
              <div class="info_block">
                <div class="block_title">收货地址</div>
                <div class="addr_box">
                  <strong>{{ detail.addrInfo.name }} {{ detail.addrInfo.tel }}</strong>
                  <span>{{ detail.addrInfo.addr }} {{ detail.addrInfo.detailAddr }}</span>
                </div>
                <div class="hint_row">
                  <IconLocation/>
                  <span>下单后默认按照该地址进行配送</span>
                </div>
              </div>

              <div class="info_block">
                <div class="block_title">支付信息</div>
                <div class="info_list">
                  <div><span>支付方式</span><strong>{{ detail.payType }}</strong></div>
                  <div>
                    <span>支付地址</span>
                    <a-link v-if="detail.payUrl" :href="detail.payUrl" target="_blank">打开支付页</a-link>
                    <strong v-else>暂无</strong>
                  </div>
                </div>
                <div class="hint_row">
                  <IconGift/>
                  <span>如果后端生成了支付地址，会从这里直接跳转</span>
                </div>
              </div>
            </div>
          </section>

          <section class="content_section">
            <div class="section_head">
              <div class="card_title">商品列表</div>
            </div>

            <div class="goods_list">
              <article v-for="item in detail.goodsList" :key="item.orderGoodsID" class="goods_row">
                <img :src="item.cover" :alt="item.title">
                <div class="goods_meta">
                  <strong>{{ item.title }}</strong>
                  <div class="goods_desc">
                    <span>单价 ￥{{ formatPrice(item.price) }}</span>
                    <span>数量 x{{ item.num }}</span>
                    <span>备注：{{ item.note || "无" }}</span>
                  </div>
                </div>
              </article>
            </div>
          </section>

          <section class="content_section">
            <div class="section_head">
              <div class="card_title">优惠券</div>
            </div>

            <div v-if="detail.couponList.length" class="coupon_list">
              <div v-for="coupon in detail.couponList" :key="coupon.couponPrice + coupon.type" class="coupon_item">
                <strong>￥{{ formatPrice(coupon.couponPrice) }}</strong>
                <span>类型 {{ coupon.type }}</span>
              </div>
            </div>
            <div v-else class="empty_card">暂无优惠券</div>
          </section>
        </section>
      </div>
      <div v-else class="empty_card">未找到订单</div>
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
.info_list,
.addr_box span,
.goods_meta span,
.coupon_item span,
.summary_hint,
.hint_row {
  color: #6b7280;
}

.panel_head p {
  margin: 0;
  font-size: 14px;
  line-height: 1.8;
}

.detail_stack {
  display: grid;
  gap: 16px;
}

.status_card,
.content_card {
  padding: 20px;
  border-radius: 16px;
  background: var(--web-surface);
  border: 1px solid var(--web-border);
}

.status_card {
  background: var(--web-hero-grad);
}

.status_main {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 18px;
  align-items: center;
}

.card_label {
  color: #ff647c;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: .08em;
}

.status_row {
  margin-top: 6px;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
}

.status_row h3 {
  margin: 0;
  color: #111827;
  font-size: 30px;
  line-height: 1.1;
}

.status_no {
  margin-top: 12px;
  color: #6b7280;
  font-size: 14px;
  word-break: break-all;
}

.status_price {
  display: grid;
  justify-items: end;
  gap: 4px;

  span,
  em {
    color: #6b7280;
    font-size: 12px;
    font-style: normal;
  }

  strong {
    color: #ff637a;
    font-size: 34px;
    line-height: 1;
  }
}

.status_meta {
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px solid #f0f2f5;
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  color: #6b7280;
  font-size: 12px;

  span {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
}

.content_card {
  display: grid;
  gap: 0;
}

.content_section {
  padding: 4px 0 0;

  & + .content_section {
    margin-top: 18px;
    padding-top: 18px;
    border-top: 1px solid #f0f2f5;
  }
}

.section_head {
  margin-bottom: 14px;
}

.card_title {
  color: #111827;
  font-size: 24px;
  font-weight: 700;
  line-height: 1.1;
}

.info_grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

.info_block {
  min-width: 0;
}

.block_title {
  margin-bottom: 10px;
  color: #111827;
  font-size: 16px;
  font-weight: 700;
}

.info_list {
  display: grid;
  gap: 10px;
  line-height: 1.7;

  > div {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 14px;
    align-items: center;
  }

  span {
    color: #9ca3af;
    font-size: 13px;
  }

  strong {
    color: #111827;
    font-size: 14px;
    font-weight: 600;
  }
}

.addr_box {
  display: grid;
  gap: 6px;
  line-height: 1.7;

  strong {
    color: #111827;
    font-size: 16px;
  }
}

.hint_row {
  margin-top: 14px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #6b7280;
}

.goods_list {
  display: grid;
  gap: 12px;
}

.goods_row {
  display: grid;
  grid-template-columns: 96px minmax(0, 1fr);
  gap: 14px;
  padding: 14px;
  border-radius: 14px;
  background: var(--web-soft-bg);
}

.goods_row img {
  width: 96px;
  height: 54px;
  border-radius: 12px;
  object-fit: cover;
}

.goods_meta {
  display: grid;
  gap: 8px;
}

.goods_meta strong,
.coupon_item strong {
  color: #111827;
  font-size: 16px;
}

.goods_desc {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 14px;
  color: #6b7280;
  font-size: 13px;
  line-height: 1.7;
}

.coupon_list {
  display: grid;
  gap: 10px;
}

.coupon_item {
  padding: 12px 14px;
  border-radius: 14px;
  background: var(--web-soft-bg);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.empty_card {
  padding: 20px;
  border-radius: 16px;
  border: 1px dashed #f0d7dd;
  background: var(--web-hero-grad);
  color: #9ca3af;
  font-size: 13px;
  text-align: center;
}

@media (max-width: 900px) {
  .panel_head {
    flex-direction: column;
  }

  .head_actions {
    justify-content: flex-start;
  }

  .status_main,
  .info_grid {
    grid-template-columns: 1fr;
  }

  .status_price {
    justify-items: flex-start;
  }
}

@media (max-width: 768px) {
  .goods_row {
    grid-template-columns: 1fr;
  }

  .goods_row img {
    width: 100%;
    height: auto;
    aspect-ratio: 16 / 9;
  }
}
</style>
