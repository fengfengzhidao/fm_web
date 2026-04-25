<script setup lang="ts">
import {computed, onMounted, ref} from "vue";
import {useRouter} from "vue-router";
import {Message} from "@arco-design/web-vue";
import {
  IconCheckCircle,
  IconDelete,
  IconHeart,
  IconSafe,
  IconStorage
} from "@arco-design/web-vue/es/icon";
import {carListApi, carNumUpdateApi, carRemoveApi, carToCollectApi, type carGoodsInfoType, type carListType} from "@/api/car_api";
import {userStorei} from "@/stores/user_store";

const router = useRouter()
const store = userStorei()
const loading = ref(false)
const selectedIds = ref<number[]>([])
const selectedCouponIDs = ref<number[]>([])

function createEmptyCart(): carListType {
  return {
    goodsList: [],
    couponList: [],
    price: 0,
  }
}

function normalizeCartData(data?: Partial<carListType> | null): carListType {
  const goodsList = data?.goodsList
  const couponList = data?.couponList

  return {
    goodsList: Array.isArray(goodsList) ? goodsList : [],
    couponList: Array.isArray(couponList) ? couponList : [],
    price: typeof data?.price === "number" ? data.price : 0,
  }
}

const cart = ref<carListType>(createEmptyCart())

function formatPrice(price?: number | null): string {
  if (price === null || price === undefined) {
    return "0.00"
  }
  return (price / 100).toFixed(price % 100 === 0 ? 0 : 2)
}

async function loadCart(nextSelectedIds?: number[]) {
  loading.value = true
  try {
    const res = await carListApi({
      carIDList: nextSelectedIds ?? selectedIds.value,
      couponIDList: selectedCouponIDs.value,
    })
    if (res.code) {
      Message.error(res.msg)
      return
    }
    cart.value = normalizeCartData(res.data)
    selectedIds.value = cart.value.goodsList.filter((item) => item.used).map((item) => item.carID)

    if (!selectedIds.value.length && cart.value.goodsList.length && !nextSelectedIds) {
      selectedIds.value = cart.value.goodsList.map((item) => item.carID)
      await loadCart(selectedIds.value)
      return
    }
  } catch (error) {
    console.error(error)
    cart.value = createEmptyCart()
    selectedIds.value = []
    selectedCouponIDs.value = []
    Message.error("购物车加载失败")
  } finally {
    loading.value = false
  }
}

async function updateNum(item: carGoodsInfoType, num: number) {
  const nextNum = Number(num)
  if (!nextNum || nextNum < 1) {
    return
  }
  const res = await carNumUpdateApi({carID: item.carID, num: nextNum})
  if (res.code) {
    Message.error(res.msg)
    return
  }
  Message.success("数量已更新")
  await loadCart(selectedIds.value)
}

async function removeItem(item: carGoodsInfoType) {
  const res = await carRemoveApi([item.carID])
  if (res.code) {
    Message.error(res.msg)
    return
  }
  Message.success("已删除")
  selectedIds.value = selectedIds.value.filter((id) => id !== item.carID)
  await loadCart(selectedIds.value)
}

async function collectItem(item: carGoodsInfoType) {
  const res = await carToCollectApi([item.carID])
  if (res.code) {
    Message.error(res.msg)
    return
  }
  Message.success("已转入收藏")
  await loadCart(selectedIds.value)
}

async function toggleSelect(item: carGoodsInfoType, checked: boolean) {
  const next = new Set(selectedIds.value)
  if (checked) {
    next.add(item.carID)
  } else {
    next.delete(item.carID)
  }
  selectedIds.value = Array.from(next)
  await loadCart(selectedIds.value)
}

async function toggleSelectAll(checked: boolean) {
  if (!cart.value.goodsList.length) {
    return
  }
  selectedIds.value = checked ? cart.value.goodsList.map((item) => item.carID) : []
  await loadCart(selectedIds.value)
}

async function toggleCoupon(id: number, checked: boolean) {
  const next = new Set(selectedCouponIDs.value)
  if (checked) {
    next.add(id)
  } else {
    next.delete(id)
  }
  selectedCouponIDs.value = Array.from(next)
  await loadCart(selectedIds.value)
}

async function clearCoupons() {
  if (!selectedCouponIDs.value.length) {
    return
  }
  selectedCouponIDs.value = []
  await loadCart(selectedIds.value)
}

function goGoodsDetail(item: carGoodsInfoType) {
  router.push({name: "web_goods_detail", params: {id: item.goodsID}})
}

function checkout() {
  if (!store.isLogin) {
    Message.warning("请先登录后再结算")
    router.push({name: "login", query: {redirect: "/checkout"}})
    return
  }

  const carIDs = selectedIds.value
  if (!carIDs.length) {
    Message.warning("请先选择要结算的商品")
    return
  }
  router.push({name: "web_checkout", query: {carIDs: carIDs.join(",")}})
}

const totalPrice = computed(() => formatPrice(cart.value.price))
const allSelected = computed(() => cart.value.goodsList.length > 0 && selectedIds.value.length === cart.value.goodsList.length)
const selectedCount = computed(() => selectedIds.value.length)
const selectedCouponCount = computed(() => selectedCouponIDs.value.length)
const isEmpty = computed(() => !cart.value.goodsList.length)

onMounted(() => {
  if (!store.isLogin) {
    Message.warning("请先登录后查看购物车")
  }
  loadCart()
})
</script>

<template>
  <div class="cart_view">
    <div class="page_shell">
      <section class="hero_surface">
        <section class="hero_section">
          <div class="hero_copy">
            <div class="eyebrow">CART</div>
            <h1>购物车</h1>

            <div class="hero_tags">
              <span><IconStorage/> 勾选结算</span>
              <span><IconHeart/> 转入收藏</span>
              <span><IconSafe/> 优惠后金额实时重算</span>
            </div>
          </div>

          <aside class="hero_summary">
            <div class="summary_title">当前结算概览</div>
            <div class="summary_value">￥ {{ totalPrice }}</div>
            <div class="summary_meta">已选商品 {{ selectedCount }} 件，已选优惠券 {{ selectedCouponCount }} 张</div>
            <a-button long type="primary" @click="checkout">去结算</a-button>
          </aside>
        </section>
      </section>

      <section class="cart_surface">
        <a-spin :loading="loading" tip="加载中...">
          <div v-if="!isEmpty" class="cart_grid">
            <div class="goods_panel">
              <div class="panel_head_row">
                <div>
                  <div class="panel_title">商品列表</div>
                </div>
                <a-checkbox
                  :model-value="allSelected"
                  :indeterminate="selectedIds.length > 0 && !allSelected"
                  @change="(checked) => toggleSelectAll(Boolean(checked))"
                >
                  全选
                </a-checkbox>
              </div>

              <article class="cart_item" v-for="item in cart.goodsList" :key="item.carID">
                <div class="item_select">
                  <a-checkbox
                    :model-value="selectedIds.includes(item.carID)"
                    @change="(checked) => toggleSelect(item, Boolean(checked))"
                  />
                </div>

                <div class="item_cover" @click="goGoodsDetail(item)">
                  <img :src="item.cover" :alt="item.title">
                </div>

                <div class="item_body">
                  <div class="item_title" @click="goGoodsDetail(item)">{{ item.title }}</div>
                  <div class="item_price">单价 ￥ {{ formatPrice(item.price) }}</div>
                  <div class="item_sub">
                    <span>合计 ￥ {{ formatPrice(item.totalPrice) }}</span>
                    <span>实付 ￥ {{ formatPrice(item.payPrice) }}</span>
                    <span v-if="item.couponInfo">优惠券 ￥ {{ formatPrice(item.couponInfo.couponPrice) }}</span>
                  </div>
                </div>

                <div class="item_actions">
                  <a-input-number :model-value="item.num" :min="1" @change="(value) => updateNum(item, Number(value || 1))"/>
                  <div class="action_buttons">
                    <a-button @click="collectItem(item)">收藏</a-button>
                    <a-popconfirm content="确定删除该商品吗？" @ok="removeItem(item)">
                      <a-button status="danger"><IconDelete/>删除</a-button>
                    </a-popconfirm>
                  </div>
                </div>
              </article>
            </div>

            <aside class="summary_panel">
              <div class="panel_title">结算信息</div>

              <div class="summary_total">
                <strong>￥ {{ totalPrice }}</strong>
                <span>优惠后应付金额</span>
              </div>

              <div class="summary_status">
                <span><IconCheckCircle/> 已选 {{ selectedCount }} 件商品</span>
                <span><IconHeart/> 已用 {{ selectedCouponCount }} 张券</span>
              </div>

              <div class="coupon_list">
                <div class="coupon_head">
                  <div class="coupon_title">可用优惠券</div>
                  <a-button v-if="selectedCouponIDs.length" size="mini" type="text" @click="clearCoupons">清空</a-button>
                </div>
                <div class="coupon_hint">勾选优惠券后，金额会按当前购物车重新计算。</div>
                <div v-if="cart.couponList.length" class="coupon_items">
                  <label class="coupon_card" v-for="coupon in cart.couponList" :key="coupon.id">
                    <a-checkbox :model-value="selectedCouponIDs.includes(coupon.id)" @change="(checked) => toggleCoupon(coupon.id, Boolean(checked))"/>
                    <div>
                      <strong>￥ {{ formatPrice(coupon.couponPrice) }}</strong>
                      <span>满 {{ formatPrice(coupon.threshold) }} 可用</span>
                    </div>
                  </label>
                </div>
                <div v-else class="coupon_empty">暂无可用优惠券</div>
              </div>

              <div class="summary_actions">
                <a-button type="primary" long @click="checkout">去结算</a-button>
                <a-button long @click="loadCart(selectedIds)">刷新购物车</a-button>
              </div>
            </aside>
          </div>

          <div v-else class="empty_state">
            <div class="empty_icon"><IconStorage/></div>
            <div class="empty_title">{{ store.isLogin ? "购物车还是空的" : "登录后查看购物车" }}</div>
            <div class="empty_desc">
              {{ store.isLogin ? "先去首页或搜索页挑几件商品，再回到这里统一结算。" : "当前未登录，先登录再查看已加入购物车的商品。" }}
            </div>
            <div class="empty_actions">
              <a-button type="primary" @click="store.isLogin ? router.push({name: 'web_home'}) : store.openLoginModal('/cart')">
                {{ store.isLogin ? "去逛逛" : "立即登录" }}
              </a-button>
              <a-button @click="router.push({name: 'web_search'})">搜索商品</a-button>
            </div>
          </div>
        </a-spin>
      </section>
    </div>
  </div>
</template>

<style scoped lang="less">
.cart_view {
  min-height: 100vh;
  color: var(--color-text-1);
  background: #fff;
}

.page_shell {
  width: min(1180px, calc(100% - 48px));
  margin: 0 auto;
  padding: 0 0 36px;
}

.hero_surface,
.cart_surface {
  border-radius: 18px;
}

.hero_surface {
  padding: 24px 22px 22px;
}

.cart_surface {
  background: #fff;
  box-shadow: 0 20px 45px rgba(17, 24, 39, .05);
}

.hero_section {
  display: grid;
  grid-template-columns: minmax(0, 1.7fr) 320px;
  gap: 14px;
}

.hero_copy,
.hero_summary {
  border-radius: 16px;
  border: 1px solid #eceef2;
  background: #fff;
}

.hero_copy {
  padding: 24px 22px;
  background: linear-gradient(180deg, #fffafb, #ffffff 62%);
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

.cart_surface {
  margin-top: 18px;
  padding: 18px;
}

.cart_grid {
  display: grid;
  grid-template-columns: minmax(0, 1.3fr) minmax(300px, .7fr);
  gap: 16px;
}

.goods_panel,
.summary_panel {
  border-radius: 16px;
  border: 1px solid #eceef2;
  background: #fff;
  padding: 18px;
}

.panel_head_row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
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

.cart_item {
  display: grid;
  grid-template-columns: auto 112px minmax(0, 1fr) 180px;
  gap: 14px;
  align-items: center;
  padding: 16px 0;
  border-top: 1px solid #eceef2;
}

.item_cover {
  width: 112px;
  aspect-ratio: 16 / 9;
  overflow: hidden;
  border-radius: 12px;
  cursor: pointer;
  background: #f7f8fa;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
}

.item_body {
  min-width: 0;
}

.item_title {
  color: #111827;
  font-size: 15px;
  font-weight: 700;
  line-height: 1.6;
  cursor: pointer;
}

.item_price {
  margin-top: 8px;
  color: #ff637a;
  font-weight: 700;
}

.item_sub {
  margin-top: 10px;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  color: #9ca3af;
  font-size: 12px;
  line-height: 1.7;
}

.item_actions {
  display: grid;
  gap: 10px;
  justify-items: end;
}

.action_buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.summary_total {
  margin-top: 14px;
  padding: 18px;
  border-radius: 14px;
  background: linear-gradient(135deg, rgba(255, 93, 114, .1), rgba(255, 93, 114, .04));
  display: grid;
  gap: 4px;

  strong {
    font-size: 30px;
    color: #ff637a;
  }

  span {
    color: #6b7280;
    font-size: 13px;
  }
}

.summary_status {
  margin-top: 14px;
  display: grid;
  gap: 8px;

  span {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: #6b7280;
    font-size: 12px;
  }
}

.coupon_list {
  margin-top: 18px;
}

.coupon_head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.coupon_title {
  color: #111827;
  font-size: 15px;
  font-weight: 700;
}

.coupon_hint {
  margin-top: 8px;
  color: #9ca3af;
  font-size: 12px;
  line-height: 1.7;
}

.coupon_items {
  margin-top: 12px;
  display: grid;
  gap: 10px;
}

.coupon_card {
  padding: 14px 16px;
  border-radius: 14px;
  background: #fafafb;
  border: 1px solid #eceef2;
  display: flex;
  gap: 12px;
  align-items: flex-start;
  cursor: pointer;

  strong {
    display: block;
    color: #ff637a;
    font-size: 18px;
  }

  span {
    display: block;
    margin-top: 6px;
    color: #6b7280;
    font-size: 12px;
  }
}

.coupon_empty {
  margin-top: 12px;
  padding: 16px;
  border-radius: 14px;
  background: #fafafb;
  color: #9ca3af;
  font-size: 12px;
  text-align: center;
}

.summary_actions {
  margin-top: 18px;
  display: grid;
  gap: 10px;
}

.empty_state {
  min-height: 360px;
  border-radius: 16px;
  border: 1px dashed #f0d7dd;
  background: linear-gradient(180deg, #fffafb, #fff);
  display: grid;
  justify-items: center;
  align-content: center;
  text-align: center;
  padding: 28px;
}

.empty_icon {
  width: 60px;
  height: 60px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  background: #fff1f4;
  color: #ff647c;
  font-size: 30px;
}

.empty_title {
  margin-top: 14px;
  color: #111827;
  font-size: 24px;
  font-weight: 700;
}

.empty_desc {
  margin-top: 10px;
  max-width: 420px;
  color: #9ca3af;
  font-size: 13px;
  line-height: 1.8;
}

.empty_actions {
  margin-top: 18px;
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: center;
}

@media (max-width: 1100px) {
  .hero_section,
  .cart_grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 900px) {
  .page_shell {
    width: calc(100% - 24px);
    padding-top: 12px;
  }

  .hero_surface,
  .cart_surface {
    border-radius: 14px;
  }

  .panel_head_row {
    align-items: flex-start;
    flex-direction: column;
  }

  .cart_item {
    grid-template-columns: 1fr;
  }

  .item_cover {
    width: 100%;
  }

  .item_actions,
  .action_buttons {
    justify-items: stretch;
    justify-content: flex-start;
  }

  .item_actions :deep(.arco-input-number) {
    width: 100%;
  }
}

@media (max-width: 640px) {
  .page_shell {
    width: calc(100% - 16px);
  }

  .hero_surface {
    padding: 16px 12px 14px;
  }

  .cart_surface,
  .goods_panel,
  .summary_panel {
    padding-left: 12px;
    padding-right: 12px;
  }

  .hero_copy h1,
  .panel_title,
  .summary_value,
  .empty_title {
    font-size: 24px;
  }

  .hero_tags,
  .empty_actions {
    gap: 10px;
    flex-wrap: wrap;
  }
}
</style>
