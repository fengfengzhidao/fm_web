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
import {carListApi, type carGoodsInfoType} from "@/api/car_api";
import {addrListApi, type addrType} from "@/api/user_center_api";
import {orderConfirmApi, orderPayApi, type orderConfirmType, type orderGoodsRequest} from "@/api/order_api";
import {formatPrice} from "@/views/web/user_center/utils";

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const paying = ref(false)
const goodsList = ref<carGoodsInfoType[]>([])
const confirm = ref<orderConfirmType | null>(null)
const addrList = ref<addrType[]>([])
const selectedAddrID = ref<number>()
const selectedCouponIDs = ref<number[]>([])
const payType = ref(1)

const carIDs = computed(() => {
  const raw = route.query.carIDs
  if (typeof raw !== "string" || !raw) return []
  return raw.split(",").map((item) => Number(item)).filter((item) => !Number.isNaN(item) && item > 0)
})

const orderGoodsList = computed<orderGoodsRequest[]>(() => goodsList.value.map((item) => ({
  goodsID: item.goodsID,
  num: item.num,
})))

const totalPrice = computed(() => formatPrice(confirm.value?.price || 0))
const goodsCount = computed(() => confirm.value?.goodsList.reduce((sum, item) => sum + item.num, 0) || 0)

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

function toggleCoupon(id: number, checked: boolean) {
  const next = new Set(selectedCouponIDs.value)
  if (checked) {
    next.add(id)
  } else {
    next.delete(id)
  }
  selectedCouponIDs.value = Array.from(next)
}

function handleCouponChange(id: number, event: Event) {
  toggleCoupon(id, (event.target as HTMLInputElement).checked)
}

async function loadData() {
  if (!carIDs.value.length) {
    Message.warning("没有可结算的商品")
    router.replace({name: "web_cart"})
    return
  }

  loading.value = true
  try {
    const [cartRes, addrRes] = await Promise.all([
      carListApi({carIDList: carIDs.value}),
      addrListApi(),
    ])

    if (cartRes.code) {
      Message.error(cartRes.msg)
      return
    }
    if (addrRes.code) {
      Message.warning(addrRes.msg)
    }

    goodsList.value = cartRes.data.goodsList || []
    addrList.value = addrRes.code ? [] : (addrRes.data.list || [])
    selectedAddrID.value = addrList.value.find((item) => item.isDefault)?.id || addrList.value[0]?.id

    const confirmRes = await orderConfirmApi({
      orderGoodsList: orderGoodsList.value,
      couponIDList: selectedCouponIDs.value,
    })
    if (confirmRes.code) {
      Message.error(confirmRes.msg)
      return
    }
    confirm.value = confirmRes.data
  } catch (error) {
    console.error(error)
    Message.error("结算信息加载失败")
  } finally {
    loading.value = false
  }
}

async function refreshConfirm() {
  if (!goodsList.value.length) return
  const res = await orderConfirmApi({
    orderGoodsList: orderGoodsList.value,
    couponIDList: selectedCouponIDs.value,
  })
  if (res.code) {
    Message.error(res.msg)
    return
  }
  confirm.value = res.data
}

async function submitOrder() {
  if (!selectedAddrID.value) {
    Message.warning("请先选择收货地址")
    return
  }

  paying.value = true
  try {
    const res = await orderPayApi({
      orderGoodsList: orderGoodsList.value,
      couponIDList: selectedCouponIDs.value,
      addrID: selectedAddrID.value,
      payType: payType.value,
      carIDList: carIDs.value,
    })
    if (res.code) {
      Message.error(res.msg)
      return
    }
    Message.success("下单成功")
    if (res.data.payUrl) {
      router.push(resolvePayRoute(res.data.payUrl))
      return
    }
    router.push({name: "web_user_center_order"})
  } catch (error) {
    console.error(error)
    Message.error("提交订单失败")
  } finally {
    paying.value = false
  }
}

watch(selectedCouponIDs, () => {
  refreshConfirm()
})

onMounted(loadData)
</script>

<template>
  <div class="checkout_view">
    <div class="page_shell">
      <section class="hero_surface">
        <section class="hero_section">
          <div class="hero_copy">
            <div class="eyebrow">CHECKOUT</div>
            <h1>确认订单</h1>

            <div class="hero_tags">
              <span><IconLocation/> 确认地址</span>
              <span><IconGift/> 选择优惠券</span>
              <span><IconSafe/> 提交后拉起支付</span>
            </div>
          </div>

          <aside class="hero_summary">
            <div class="summary_title">本次订单概览</div>
            <div class="summary_value">￥ {{ totalPrice }}</div>
            <div class="summary_meta">共 {{ goodsCount }} 件商品，可用优惠券 {{ confirm?.couponList.length || 0 }} 张</div>
            <a-button long type="primary" :loading="paying" @click="submitOrder">提交订单</a-button>
          </aside>
        </section>
      </section>

      <section class="checkout_surface">
        <a-spin :loading="loading" tip="加载中...">
          <div v-if="confirm" class="checkout_grid">
            <section class="panel">
              <div class="panel_title">商品清单</div>

              <article class="goods_item" v-for="item in confirm.goodsList" :key="item.goodsID">
                <img :src="item.cover" :alt="item.title">
                <div class="goods_meta">
                  <strong>{{ item.title }}</strong>
                  <span>单价 ￥ {{ formatPrice(item.price) }}</span>
                  <span>数量 x{{ item.num }}</span>
                </div>
              </article>
            </section>

            <section class="panel">
              <div class="panel_title">收货地址</div>

              <div v-if="addrList.length" class="addr_list">
                <label v-for="item in addrList" :key="item.id" class="addr_item" :class="{active: selectedAddrID === item.id}">
                  <input v-model="selectedAddrID" type="radio" :value="item.id">
                  <div>
                    <strong>{{ item.name }} {{ item.tel }}</strong>
                    <span>{{ item.addr }} {{ item.detailAddr }}</span>
                  </div>
                </label>
              </div>
              <div v-else class="empty_card">暂无地址，请先到个人中心添加</div>
            </section>

            <section class="panel">
              <div class="panel_title">优惠券</div>

              <div v-if="confirm.couponList.length" class="coupon_list">
                <label v-for="coupon in confirm.couponList" :key="coupon.id" class="coupon_item">
                  <input
                    type="checkbox"
                    :value="coupon.id"
                    :checked="selectedCouponIDs.includes(coupon.id)"
                    @change="handleCouponChange(coupon.id, $event)">
                  <div>
                    <strong>￥ {{ formatPrice(coupon.couponPrice) }}</strong>
                    <span>满 {{ formatPrice(coupon.threshold) }} 可用</span>
                  </div>
                </label>
              </div>
              <div v-else class="empty_card">暂无可用优惠券</div>
            </section>

            <section class="panel summary_panel">
              <div class="panel_title">结算信息</div>

              <div class="summary_box">
                <div>
                  <span>应付金额</span>
                  <strong>￥ {{ totalPrice }}</strong>
                </div>
                <div>
                  <span>支付方式</span>
                  <a-radio-group v-model="payType">
                    <a-radio :value="1">默认支付</a-radio>
                    <a-radio :value="2">快捷支付</a-radio>
                  </a-radio-group>
                </div>
                <div>
                  <span>地址数量</span>
                  <strong>{{ addrList.length }}</strong>
                </div>
                <div>
                  <span>优惠券数量</span>
                  <strong>{{ selectedCouponIDs.length }}</strong>
                </div>
              </div>

              <div class="summary_note">
                <span><IconCheckCircle/> 提交后如果后端返回支付地址，会在新窗口打开。</span>
              </div>

              <div class="summary_actions">
                <a-button type="primary" long :loading="paying" @click="submitOrder">提交订单</a-button>
                <a-button long @click="router.push({name: 'web_cart'})">返回购物车</a-button>
              </div>
            </section>
          </div>

          <div v-else class="empty_state">
            <div class="empty_title">没有可结算的商品</div>
            <div class="empty_desc">先回到购物车选择商品，再进入确认订单页完成下单。</div>
            <a-button type="primary" @click="router.push({name: 'web_cart'})">返回购物车</a-button>
          </div>
        </a-spin>
      </section>
    </div>
  </div>
</template>

<style scoped lang="less">
.checkout_view {
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
.checkout_surface {
  border-radius: 18px;
}

.hero_surface {
  padding: 0;
}

.checkout_surface {
  background: var(--web-surface);
  box-shadow: var(--web-shadow-lg);
}

.checkout_surface :deep(.arco-spin) {
  width: 100%;
}

.hero_section {
  display: grid;
  grid-template-columns: minmax(0, 1.7fr) 320px;
  gap: 14px;
}

.hero_copy,
.hero_summary {
  border-radius: 16px;
  border: 1px solid var(--web-border);
  background: var(--web-surface);
}

.hero_copy {
  padding: 24px 22px;
  background: var(--web-hero-grad);
}

.eyebrow {
  color: #ff647c;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: .12em;
}

.hero_copy h1 {
  margin: 8px 0 10px;
  font-size: 36px;
  line-height: 1.05;
  color: #111827;
}

.hero_copy p {
  margin: 0;
  color: #6b7280;
  font-size: 14px;
  line-height: 1.8;
}

.hero_tags {
  margin-top: 18px;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;

  span {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 12px;
    border-radius: 999px;
    background: #fff4f6;
    color: #ff6178;
    font-size: 12px;
    font-weight: 600;
  }
}

.hero_summary {
  padding: 22px 20px;
  display: grid;
  gap: 12px;
  align-content: start;
}

.summary_title {
  color: #9ca3af;
  font-size: 13px;
}

.summary_value {
  color: #111827;
  font-size: 28px;
  line-height: 1.15;
  font-weight: 700;
}

.summary_meta {
  color: #4b5563;
  font-size: 14px;
  line-height: 1.6;
}

.checkout_surface {
  margin-top: 18px;
  padding: 0;
}

.checkout_grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 16px;
}

.panel {
  padding: 18px;
  border-radius: 16px;
  border: 1px solid var(--web-border);
  background: var(--web-surface);
}

.panel_title {
  color: #111827;
  font-size: 24px;
  font-weight: 700;
  line-height: 1.1;
}

.panel_desc {
  margin-top: 8px;
  color: #9ca3af;
  font-size: 13px;
}

.goods_item {
  display: grid;
  grid-template-columns: 92px minmax(0, 1fr);
  gap: 14px;
  padding: 14px 0;
  border-top: 1px solid var(--web-border);

  &:first-of-type {
    border-top: 0;
    padding-top: 16px;
  }

  img {
    width: 92px;
    height: 52px;
    border-radius: 12px;
    object-fit: cover;
  }
}

.goods_meta {
  display: grid;
  gap: 6px;

  strong {
    color: #111827;
    font-size: 15px;
    line-height: 1.6;
  }

  span {
    color: #6b7280;
    font-size: 12px;
  }
}

.addr_list,
.coupon_list {
  margin-top: 16px;
  display: grid;
  gap: 10px;
}

.addr_item,
.coupon_item {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  padding: 12px 14px;
  border-radius: 14px;
  background: var(--web-soft-bg);
  border: 1px solid var(--web-border);
  cursor: pointer;
}

.addr_item.active {
  border-color: #ffccd5;
  background: #fff4f6;
}

.addr_item span,
.coupon_item span {
  display: block;
  margin-top: 6px;
  color: #6b7280;
  font-size: 12px;
}

.coupon_item strong {
  display: block;
  color: #ff637a;
  font-size: 18px;
}

.summary_panel {
  display: grid;
  gap: 14px;
  align-self: start;
}

.summary_box {
  margin-top: 2px;
  display: grid;
  gap: 12px;
  padding: 18px;
  border-radius: 14px;
  background: var(--web-soft-grad);
}

.summary_box > div {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;

  span {
    color: #6b7280;
    font-size: 13px;
  }
}

.summary_box strong {
  font-size: 22px;
  color: #ff637a;
}

.summary_note {
  color: #6b7280;
  font-size: 12px;
  line-height: 1.7;

  span {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
}

.summary_actions {
  display: grid;
  gap: 10px;
}

.empty_card,
.empty_state {
  border-radius: 14px;
  border: 1px dashed #f0d7dd;
  background: var(--web-hero-grad);
  color: #9ca3af;
  font-size: 13px;
  line-height: 1.8;
}

.empty_card {
  margin-top: 16px;
  padding: 18px;
  text-align: center;
}

.empty_state {
  min-height: 280px;
  display: grid;
  justify-items: center;
  align-content: center;
  gap: 10px;
  padding: 28px;
  text-align: center;
}

.empty_title {
  color: #111827;
  font-size: 24px;
  font-weight: 700;
}

.empty_desc {
  max-width: 420px;
}

@media (max-width: 1100px) {
  .hero_section,
  .checkout_grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 900px) {
  .page_shell {
    width: calc(100% - 24px);
    padding-top: 12px;
  }

  .hero_surface,
  .checkout_surface {
    border-radius: 14px;
  }

}

@media (max-width: 640px) {
  .page_shell {
    width: calc(100% - 16px);
  }

  .hero_surface {
    padding: 0;
  }

  .checkout_surface,
  .panel {
    padding-left: 0;
    padding-right: 0;
  }

  .hero_copy h1,
  .panel_title,
  .summary_value,
  .empty_title {
    font-size: 24px;
  }

  .hero_tags {
    gap: 10px;
    flex-wrap: wrap;
  }

  .goods_item {
    grid-template-columns: 1fr;
  }

  .goods_item img {
    width: 100%;
    height: auto;
    aspect-ratio: 16 / 9;
  }
}
</style>
