<script setup lang="ts">
import {computed, onMounted, ref} from "vue";
import {useRouter} from "vue-router";
import {Message} from "@arco-design/web-vue";
import F_nav from "@/components/web/f_nav.vue";
import F_main from "@/components/web/f_main.vue";
import F_footer from "@/components/web/f_footer.vue";
import {carListApi, carNumUpdateApi, carRemoveApi, carToCollectApi, type carGoodsInfoType, type carListType} from "@/api/car_api";
import {userStorei} from "@/stores/user_store";
import {dateTimeFormat} from "@/utils/date";

const router = useRouter()
const store = userStorei()
const loading = ref(false)
const cart = ref<carListType>({
  goodsList: [],
  couponList: [],
  price: 0,
})
const selectedIds = ref<number[]>([])

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
      carIDList: nextSelectedIds || selectedIds.value,
    })
    if (res.code) {
      Message.error(res.msg)
      return
    }
    cart.value = res.data
    selectedIds.value = cart.value.goodsList.filter((item) => item.used).map((item) => item.carID)

    if (!selectedIds.value.length && cart.value.goodsList.length && !nextSelectedIds) {
      selectedIds.value = cart.value.goodsList.map((item) => item.carID)
      await loadCart(selectedIds.value)
      return
    }
  } catch (error) {
    console.error(error)
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
  await loadCart()
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
  await loadCart()
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

function goGoodsDetail(item: carGoodsInfoType) {
  router.push({name: "web_goods_detail", params: {id: item.goodsID}})
}

function checkout() {
  Message.info("结算页将在下一阶段补齐")
}

const totalPrice = computed(() => formatPrice(cart.value.price))

onMounted(() => {
  if (!store.isLogin) {
    Message.warning("请先登录后查看购物车")
  }
  loadCart()
})
</script>

<template>
  <div class="cart_view">
    <f_nav no-scroll/>
    <f_main>
      <section class="cart_shell">
        <div class="page_head">
          <div>
            <div class="eyebrow">CART</div>
            <h1>购物车</h1>
            <p>支持修改数量、删除、收藏，并且按原型保留清晰的结算信息区。</p>
          </div>
          <div class="head_actions">
            <a-button @click="router.back()">返回</a-button>
            <a-button type="primary" @click="checkout">去结算</a-button>
          </div>
        </div>

        <a-spin :loading="loading" tip="加载中...">
          <div v-if="cart.goodsList.length" class="cart_grid">
            <div class="goods_panel">
              <div class="panel_title">商品列表</div>
              <article class="cart_item" v-for="item in cart.goodsList" :key="item.carID">
                <a-checkbox :model-value="selectedIds.includes(item.carID)" @change="(checked) => toggleSelect(item, Boolean(checked))"/>
                <div class="item_cover" @click="goGoodsDetail(item)">
                  <img :src="item.cover" :alt="item.title"></img>
                </div>
                <div class="item_body">
                  <div class="item_title" @click="goGoodsDetail(item)">{{ item.title }}</div>
                  <div class="item_price">单价 ￥{{ formatPrice(item.price) }}</div>
                  <div class="item_sub">
                    <span>合计 ￥{{ formatPrice(item.totalPrice) }}</span>
                    <span>实付 ￥{{ formatPrice(item.payPrice) }}</span>
                    <span v-if="item.couponInfo">优惠券 ￥{{ formatPrice(item.couponInfo.couponPrice) }}</span>
                  </div>
                </div>
                <div class="item_actions">
                  <a-input-number :model-value="item.num" :min="1" @change="(value) => updateNum(item, Number(value || 1))"/>
                  <a-button @click="collectItem(item)">收藏</a-button>
                  <a-popconfirm content="确定删除该商品吗？" @ok="removeItem(item)">
                    <a-button status="danger">删除</a-button>
                  </a-popconfirm>
                </div>
              </article>
            </div>

            <aside class="summary_panel">
              <div class="panel_title">结算信息</div>
              <div class="summary_total">
                <strong>￥{{ totalPrice }}</strong>
                <span>优惠后应付金额</span>
              </div>

              <div class="coupon_list">
                <div class="coupon_title">可用优惠券</div>
                <div v-if="cart.couponList.length" class="coupon_items">
                  <div class="coupon_card" v-for="coupon in cart.couponList" :key="coupon.id">
                    <strong>￥{{ formatPrice(coupon.couponPrice) }}</strong>
                    <span>满 {{ formatPrice(coupon.threshold) }} 可用</span>
                  </div>
                </div>
                <a-empty v-else description="暂无可用优惠券"/>
              </div>

              <div class="summary_note">
                购物车金额由后端计算，页面只负责展示和触发操作。
              </div>

              <div class="summary_actions">
                <a-button type="primary" long @click="checkout">去结算</a-button>
                <a-button long @click="loadCart(selectedIds)">刷新购物车</a-button>
              </div>
            </aside>
          </div>
          <a-empty v-else description="购物车还是空的"/>
        </a-spin>
      </section>

      <section class="tip_shell">
        <div class="tip_card">
          <div class="panel_title">操作说明</div>
          <div class="tip_text">
            当前阶段先把“详情页加入购物车”和“购物车管理”跑通，结算页会在下一阶段接上订单确认与地址选择。
          </div>
        </div>
      </section>
    </f_main>
    <f_footer/>
  </div>
</template>

<style scoped lang="less">
.cart_view {
  color: var(--color-text-1);
}

.cart_shell,
.tip_shell {
  margin: 24px max(20px, calc((100% - 1200px) / 2));
  padding: 28px;
  border-radius: 24px;
  background: var(--color-bg-1);
  border: 1px solid var(--color-border-2);
  box-shadow: 0 10px 40px rgba(15, 23, 42, .04);
}

.cart_shell {
  margin-top: 84px;
}

.page_head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 20px;
  margin-bottom: 24px;

  h1 {
    margin: 12px 0 10px;
    font-size: 40px;
    line-height: 1.1;
  }

  p {
    margin: 0;
    color: var(--color-text-2);
    line-height: 1.8;
  }
}

.eyebrow {
  color: #ff5d72;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: .08em;
}

.head_actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.cart_grid {
  display: grid;
  grid-template-columns: minmax(0, 1.25fr) minmax(320px, .75fr);
  gap: 20px;
}

.goods_panel,
.summary_panel,
.tip_card {
  padding: 20px;
  border-radius: 22px;
  background: var(--color-fill-1);
  border: 1px solid var(--color-border-2);
}

.panel_title {
  font-size: 20px;
  font-weight: 800;
  margin-bottom: 18px;
}

.cart_item {
  display: grid;
  grid-template-columns: auto 120px minmax(0, 1fr) auto;
  gap: 14px;
  align-items: center;
  padding: 16px 0;
  border-top: 1px solid var(--color-border-2);
}

.item_cover {
  width: 120px;
  border-radius: 18px;
  overflow: hidden;
  cursor: pointer;

  img {
    width: 100%;
    aspect-ratio: 1;
    object-fit: cover;
    display: block;
  }
}

.item_body {
  min-width: 0;
}

.item_title {
  font-size: 16px;
  font-weight: 700;
  line-height: 1.5;
  cursor: pointer;
}

.item_price {
  margin-top: 8px;
  color: #e11d48;
  font-weight: 700;
}

.item_sub {
  margin-top: 10px;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  color: var(--color-text-2);
}

.item_actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: flex-end;
}

.summary_panel {
  align-self: start;
}

.summary_total {
  padding: 18px;
  border-radius: 18px;
  background: linear-gradient(135deg, rgba(255, 93, 114, .1), rgba(255, 93, 114, .04));
  display: grid;
  gap: 4px;

  strong {
    font-size: 30px;
    color: #e11d48;
  }

  span {
    color: var(--color-text-2);
  }
}

.coupon_list {
  margin-top: 18px;
}

.coupon_title {
  font-weight: 700;
  margin-bottom: 12px;
}

.coupon_items {
  display: grid;
  gap: 10px;
}

.coupon_card {
  padding: 14px 16px;
  border-radius: 18px;
  background: var(--color-bg-1);
  border: 1px solid var(--color-border-2);

  strong {
    display: block;
    color: #e11d48;
    font-size: 18px;
  }

  span {
    display: block;
    margin-top: 6px;
    color: var(--color-text-2);
  }
}

.summary_note {
  margin-top: 18px;
  padding: 14px;
  border-radius: 18px;
  background: rgba(255, 93, 114, .08);
  color: var(--color-text-2);
  line-height: 1.75;
}

.summary_actions {
  margin-top: 18px;
  display: grid;
  gap: 10px;
}

.tip_shell {
  background: linear-gradient(135deg, rgba(255, 250, 251, 1), rgba(255, 255, 255, 1));
}

.tip_text {
  color: var(--color-text-2);
  line-height: 1.8;
}

@media (max-width: 1100px) {
  .cart_grid {
    grid-template-columns: 1fr;
  }

  .item_actions {
    align-items: flex-start;
  }
}

@media (max-width: 768px) {
  .cart_shell,
  .tip_shell {
    margin-left: 16px;
    margin-right: 16px;
    padding: 20px;
  }

  .cart_shell {
    margin-top: 76px;
  }

  .page_head {
    flex-direction: column;
  }

  .cart_item {
    grid-template-columns: 1fr;
  }

  .item_cover {
    width: 100%;
  }
}
</style>
