<script setup lang="ts">
import {computed, onMounted, reactive, ref} from "vue";
import {useRoute} from "vue-router";
import {Message} from "@arco-design/web-vue";
import {commentCreateApi, type commentCreateItem} from "@/api/comment_api";
import {orderUserListApi, type orderUserType} from "@/api/order_api";
import {commentLevelText, formatPrice} from "@/views/web/user_center/utils";

const route = useRoute()
const loading = ref(false)
const submiting = ref(false)
const orders = ref<orderUserType[]>([])
const formMap = reactive<Record<number, {content: string; level: number}>>({})

const targetOrderID = computed(() => {
  const raw = route.query.orderID
  const value = Array.isArray(raw) ? raw[0] : raw
  const num = Number(value)
  return Number.isFinite(num) && num > 0 ? num : 0
})

const targetOrderGoodsID = computed(() => {
  const raw = route.query.orderGoodsID
  const value = Array.isArray(raw) ? raw[0] : raw
  const num = Number(value)
  return Number.isFinite(num) && num > 0 ? num : 0
})

const visibleOrders = computed(() => {
  if (!targetOrderID.value) {
    return orders.value
  }
  return orders.value.filter((order) => order.id === targetOrderID.value)
})

async function loadList() {
  loading.value = true
  try {
    const res = await orderUserListApi({limit: 20, page: 1})
    if (res.code) {
      Message.error(res.msg)
      return
    }
    orders.value = res.data.list || []
    orders.value.forEach((order) => {
      order.orderGoodsList.forEach((goods) => {
        if (!formMap[goods.orderGoodsID]) {
          formMap[goods.orderGoodsID] = {content: "", level: 5}
        }
      })
    })
    if (targetOrderID.value && !orders.value.some((order) => order.id === targetOrderID.value)) {
      Message.warning("未找到指定订单，请返回后重试")
    }
  } catch (error) {
    console.error(error)
    Message.error("待评价订单加载失败")
  } finally {
    loading.value = false
  }
}

async function submitComment(orderGoodsID: number) {
  const form = formMap[orderGoodsID]
  if (!form?.content.trim()) {
    Message.warning("请输入评价内容")
    return
  }

  submiting.value = true
  try {
    const payload: commentCreateItem = {
      orderGoodsID,
      content: form.content,
      level: form.level,
      images: [],
    }
    const res = await commentCreateApi({list: [payload]})
    if (res.code) {
      Message.error(res.msg)
      return
    }
    Message.success("评价已提交")
    form.content = ""
    form.level = 5
  } catch (error) {
    console.error(error)
    Message.error("提交评价失败")
  } finally {
    submiting.value = false
  }
}

function isTargetGoods(orderGoodsID: number): boolean {
  return targetOrderGoodsID.value === orderGoodsID
}

onMounted(loadList)
</script>

<template>
  <div class="page_view">
    <div class="panel_head">
      <div>
        <div class="eyebrow">EVALUATE</div>
        <h2>评论商品</h2>
        <p>从已购订单里挑选商品提交评价，订单页会直接跳转到这里完成评论。</p>
      </div>
    </div>

    <a-spin :loading="loading">
      <div v-if="visibleOrders.length" class="order_list">
        <article v-for="order in visibleOrders" :key="order.id" class="order_card" :class="{target_order: targetOrderID === order.id}">
          <div class="order_head">
            <strong>{{ order.no }}</strong>
            <span class="order_price">订单金额 ￥{{ formatPrice(order.price) }}</span>
          </div>

          <div class="goods_list">
            <section
              v-for="goods in order.orderGoodsList"
              :key="goods.orderGoodsID"
              class="goods_card"
              :class="{target_goods: isTargetGoods(goods.orderGoodsID)}"
            >
              <img :src="goods.goodsCover" :alt="goods.goodsTitle">
              <div class="goods_body">
                <div class="goods_title">{{ goods.goodsTitle }}</div>
                <div class="goods_meta">
                  <span>单价 ￥{{ formatPrice(goods.goodsPrice) }}</span>
                  <span>数量 x{{ goods.num }}</span>
                  <span>订单商品ID：{{ goods.orderGoodsID }}</span>
                </div>
                <div class="rate_row">
                  <a-rate v-model="formMap[goods.orderGoodsID].level" allow-clear/>
                  <span class="rate_text">{{ commentLevelText(formMap[goods.orderGoodsID].level) }}</span>
                </div>
                <a-textarea v-model="formMap[goods.orderGoodsID].content" placeholder="写下你的真实感受" :auto-size="{minRows: 3, maxRows: 5}"/>
                <div class="goods_actions">
                  <a-button type="primary" :loading="submiting" @click="submitComment(goods.orderGoodsID)">提交评价</a-button>
                  <span class="target_chip" v-if="isTargetGoods(goods.orderGoodsID)">当前商品</span>
                </div>
              </div>
            </section>
          </div>
        </article>
      </div>
      <a-empty v-else description="暂无可评价订单"/>
    </a-spin>
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
.order_head span,
.goods_meta span {
  color: var(--color-text-2);
}

.eyebrow {
  color: #ff5d72;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: .12em;
}

.order_list {
  display: grid;
  gap: 16px;
}

.order_card {
  padding: 18px;
  border-radius: 18px;
  background: linear-gradient(180deg, #fffafb, #fff);
  border: 1px solid #eceef2;
  box-shadow: 0 12px 30px rgba(17, 24, 39, .04);
}

.order_card.target_order {
  border-color: rgba(255, 93, 114, .28);
  box-shadow: 0 14px 32px rgba(255, 93, 114, .08);
}

.order_head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
  margin-bottom: 14px;
}

.order_price {
  color: #ff647c !important;
  font-weight: 700;
}

.goods_list {
  display: grid;
  gap: 12px;
}

.goods_card {
  display: grid;
  grid-template-columns: 96px minmax(0, 1fr);
  gap: 14px;
  padding: 14px;
  border-radius: 18px;
  background: #fafafb;
  border: 1px solid #eceef2;
}

.goods_card.target_goods {
  background: rgba(255, 93, 114, .05);
  border: 1px solid rgba(255, 93, 114, .24);
}

.goods_card img {
  width: 96px;
  height: 96px;
  border-radius: 14px;
  object-fit: cover;
}

.goods_body {
  display: grid;
  gap: 8px;
}

.goods_title {
  font-size: 16px;
  font-weight: 700;
}

.goods_meta {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  color: var(--color-text-2);
}

.rate_row {
  display: flex;
  align-items: center;
  gap: 10px;

  :deep(.arco-rate-character-full),
  :deep(.arco-rate-character-half),
  :deep(.arco-rate-character:hover) {
    color: #ff647c;
  }
}

.rate_text,
.target_chip {
  padding: 7px 12px;
  border-radius: 999px;
  color: #ff647c;
  font-size: 12px;
  font-weight: 700;
  background: #fff2f5;
  border: 1px solid #ffd4dc;
}

.goods_body {
  display: grid;
  gap: 10px;
}

.goods_body :deep(.arco-textarea-wrapper) {
  border-radius: 14px;
  background: #fff;
}

.goods_actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  align-items: center;
}

@media (max-width: 768px) {
  .order_head,
  .goods_card {
    grid-template-columns: 1fr;
  }

  .goods_card {
    display: grid;
  }

  .goods_card img {
    width: 100%;
    height: auto;
    aspect-ratio: 1;
  }
}
</style>
