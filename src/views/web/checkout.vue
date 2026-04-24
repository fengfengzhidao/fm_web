<script setup lang="ts">
import {computed, onMounted, ref, watch} from "vue";
import {useRoute, useRouter} from "vue-router";
import {Message} from "@arco-design/web-vue";
import F_nav from "@/components/web/f_nav.vue";
import F_main from "@/components/web/f_main.vue";
import F_footer from "@/components/web/f_footer.vue";
import {carListApi, type carGoodsInfoType} from "@/api/car_api";
import {addrListApi, type addrType} from "@/api/user_center_api";
import {orderConfirmApi, orderPayApi, type orderConfirmType, type orderGoodsRequest} from "@/api/order_api";
import {formatPrice} from "@/views/web/user_center/utils";

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const paying = ref(false)
const loadingAddr = ref(false)
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
  loadingAddr.value = true
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
    loadingAddr.value = false
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
      Message.info("已生成支付地址")
      window.open(res.data.payUrl, "_blank")
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
    <f_nav no-scroll/>
    <f_main>
      <section class="checkout_shell">
        <div class="page_head">
          <div>
            <div class="eyebrow">CHECKOUT</div>
            <h1>确认订单</h1>
            <p>确认收货地址、优惠券和支付方式后提交。</p>
          </div>
          <div class="head_actions">
            <a-button @click="router.back()">返回</a-button>
            <a-button type="primary" :loading="paying" @click="submitOrder">提交订单</a-button>
          </div>
        </div>

        <a-spin :loading="loading" tip="加载中...">
          <div v-if="confirm" class="checkout_grid">
            <section class="panel">
              <div class="panel_title">商品清单</div>
              <article class="goods_item" v-for="item in confirm.goodsList" :key="item.goodsID">
                <img :src="item.cover" :alt="item.title">
                <div class="goods_meta">
                  <strong>{{ item.title }}</strong>
                  <span>单价 ￥{{ formatPrice(item.price) }}</span>
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
              <a-empty v-else description="暂无地址，请先到个人中心添加"/>
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
                  <span>￥{{ formatPrice(coupon.couponPrice) }}，满 {{ formatPrice(coupon.threshold) }} 可用</span>
                </label>
              </div>
              <a-empty v-else description="暂无可用优惠券"/>
            </section>

            <section class="panel summary_panel">
              <div class="panel_title">结算信息</div>
              <div class="summary_box">
                <div><span>应付金额</span><strong>￥{{ totalPrice }}</strong></div>
                <div><span>支付方式</span><a-radio-group v-model="payType"><a-radio :value="1">默认支付</a-radio><a-radio :value="2">快捷支付</a-radio></a-radio-group></div>
                <div><span>地址数量</span><strong>{{ addrList.length }}</strong></div>
              </div>
              <div class="summary_note">
                提交后如果后端返回支付地址，会在新窗口打开。
              </div>
              <a-button type="primary" long :loading="paying" @click="submitOrder">提交订单</a-button>
            </section>
          </div>
          <a-empty v-else description="没有可结算的商品"/>
        </a-spin>
      </section>
    </f_main>
    <f_footer/>
  </div>
</template>

<style scoped lang="less">
.checkout_view {
  color: var(--color-text-1);
}

.checkout_shell {
  margin: 84px max(20px, calc((100% - 1200px) / 2)) 24px;
  padding: 28px;
  border-radius: 24px;
  background: var(--color-bg-1);
  border: 1px solid var(--color-border-2);
  box-shadow: 0 10px 40px rgba(15, 23, 42, .04);
}

.page_head {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
  margin-bottom: 20px;
}

.page_head h1 {
  margin: 8px 0 8px;
  font-size: 38px;
}

.page_head p,
.goods_meta span,
.addr_item span,
.summary_note {
  color: var(--color-text-2);
}

.eyebrow {
  color: #ff5d72;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: .08em;
}

.checkout_grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 16px;
}

.panel,
.summary_panel {
  padding: 18px;
  border-radius: 22px;
  background: var(--color-fill-1);
  border: 1px solid var(--color-border-2);
}

.panel_title {
  font-size: 18px;
  font-weight: 800;
  margin-bottom: 12px;
}

.goods_item {
  display: grid;
  grid-template-columns: 92px minmax(0, 1fr);
  gap: 14px;
  padding: 12px 0;
  border-top: 1px solid var(--color-border-2);
}

.goods_item:first-of-type {
  border-top: 0;
  padding-top: 0;
}

.goods_item img {
  width: 92px;
  height: 92px;
  border-radius: 14px;
  object-fit: cover;
}

.goods_meta {
  display: grid;
  gap: 4px;
}

.addr_list,
.coupon_list {
  display: grid;
  gap: 10px;
}

.addr_item,
.coupon_item {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  padding: 12px 14px;
  border-radius: 16px;
  background: var(--color-bg-1);
  border: 1px solid var(--color-border-2);
  cursor: pointer;
}

.addr_item.active {
  border-color: rgba(255, 93, 114, .35);
  background: rgba(255, 93, 114, .08);
}

.summary_panel {
  display: grid;
  gap: 14px;
  align-self: start;
}

.summary_box {
  display: grid;
  gap: 12px;
}

.summary_box > div {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
}

.summary_box strong {
  font-size: 22px;
  color: #e11d48;
}

.summary_note {
  line-height: 1.7;
}

@media (max-width: 1100px) {
  .checkout_grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .checkout_shell {
    margin-left: 16px;
    margin-right: 16px;
    padding: 20px;
  }

  .page_head {
    flex-direction: column;
  }

  .page_head h1 {
    font-size: 32px;
  }

  .goods_item {
    grid-template-columns: 1fr;
  }

  .goods_item img {
    width: 100%;
    height: auto;
    aspect-ratio: 1;
  }
}
</style>
