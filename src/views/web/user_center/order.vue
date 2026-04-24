<script setup lang="ts">
import {computed, onMounted, ref} from "vue";
import {useRouter} from "vue-router";
import {Message} from "@arco-design/web-vue";
import {orderUserListApi, orderUserRemoveApi, type orderUserType} from "@/api/order_api";
import {dateTimeFormat} from "@/utils/date";
import {formatPrice, orderStatusText} from "@/views/web/user_center/utils";

const router = useRouter()
const loading = ref(false)
const orders = ref<orderUserType[]>([])

const count = computed(() => orders.value.length)

async function loadOrders() {
  loading.value = true
  try {
    const res = await orderUserListApi({limit: 20, page: 1})
    if (res.code) {
      Message.error(res.msg)
      return
    }
    orders.value = res.data.list || []
  } catch (error) {
    console.error(error)
    Message.error("订单加载失败")
  } finally {
    loading.value = false
  }
}

function openDetail(item: orderUserType) {
  router.push({name: "web_user_center_order_detail", params: {id: item.id}})
}

async function removeOrder(item: orderUserType) {
  const res = await orderUserRemoveApi([item.id])
  if (res.code) {
    Message.error(res.msg)
    return
  }
  Message.success("已删除订单")
  await loadOrders()
}

onMounted(loadOrders)
</script>

<template>
  <div class="order_view">
    <div class="panel_head">
      <div>
        <div class="eyebrow">ORDERS</div>
        <h2>我的订单</h2>
        <p>查看订单列表、金额与详情。</p>
      </div>
      <a-tag color="blue">共 {{ count }} 单</a-tag>
    </div>

    <a-spin :loading="loading">
      <div v-if="orders.length" class="order_list">
        <article v-for="item in orders" :key="item.id" class="order_card">
          <div class="order_top">
            <div>
              <strong>{{ item.no }}</strong>
              <span>创建时间：{{ dateTimeFormat(item.createdAt) }}</span>
            </div>
            <a-tag>{{ orderStatusText(item.status) }}</a-tag>
          </div>

          <div class="order_goods">
            <div class="goods_item" v-for="goods in item.orderGoodsList" :key="goods.orderGoodsID">
              <img :src="goods.goodsCover" :alt="goods.goodsTitle">
              <div class="goods_meta">
                <strong>{{ goods.goodsTitle }}</strong>
                <span>单价 ￥{{ formatPrice(goods.goodsPrice) }}</span>
                <span>数量 x{{ goods.num }}</span>
                <span>备注：{{ goods.note || "无" }}</span>
              </div>
            </div>
          </div>

          <div class="order_bottom">
            <div class="price_line">
              <span>订单金额 ￥{{ formatPrice(item.price) }}</span>
              <span>优惠金额 ￥{{ formatPrice(item.couponPrice) }}</span>
            </div>
            <div class="action_line">
              <a-button type="primary" @click="openDetail(item)">查看详情</a-button>
              <a-button @click="router.push({name: 'web_user_center_evaluate'})">去评价</a-button>
              <a-popconfirm content="确定删除该订单吗？" @ok="removeOrder(item)">
                <a-button status="danger">删除</a-button>
              </a-popconfirm>
            </div>
          </div>
        </article>
      </div>
      <a-empty v-else description="暂无订单"/>
    </a-spin>
  </div>
</template>

<style scoped lang="less">
.order_view {
  display: grid;
  gap: 18px;
}

.panel_head {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
}

.panel_head h2 {
  margin: 8px 0 8px;
  font-size: 30px;
}

.panel_head p,
.order_top span,
.goods_meta span {
  color: var(--color-text-2);
}

.eyebrow {
  color: #ff5d72;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: .08em;
}

.order_list {
  display: grid;
  gap: 14px;
}

.order_card {
  padding: 18px;
  border-radius: 22px;
  background: var(--color-fill-1);
  border: 1px solid var(--color-border-2);
}

.order_top,
.order_bottom {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
}

.order_top strong {
  display: block;
  font-size: 18px;
  margin-bottom: 6px;
}

.order_goods {
  margin-top: 16px;
  display: grid;
  gap: 12px;
}

.goods_item {
  display: grid;
  grid-template-columns: 96px minmax(0, 1fr);
  gap: 14px;
  padding: 12px;
  border-radius: 18px;
  background: var(--color-bg-1);
}

.goods_item img {
  width: 96px;
  height: 96px;
  border-radius: 14px;
  object-fit: cover;
}

.goods_meta {
  display: grid;
  gap: 4px;
}

.goods_meta strong {
  font-size: 16px;
}

.order_bottom {
  margin-top: 16px;
  align-items: center;
}

.price_line,
.action_line {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.action_line {
  justify-content: flex-end;
}

@media (max-width: 768px) {
  .panel_head,
  .order_top,
  .order_bottom {
    flex-direction: column;
  }

  .goods_item {
    grid-template-columns: 1fr;
  }

  .goods_item img {
    width: 100%;
    height: auto;
    aspect-ratio: 1;
  }

  .action_line {
    justify-content: flex-start;
  }
}
</style>
