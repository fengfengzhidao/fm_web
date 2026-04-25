<script setup lang="ts">
import {computed, onMounted, reactive, ref} from "vue";
import {useRouter} from "vue-router";
import {Message} from "@arco-design/web-vue";
import {commentCreateApi, type commentCreateItem} from "@/api/comment_api";
import {orderRevGoodsApi, orderUserListApi, orderUserRemoveApi, type orderUserType} from "@/api/order_api";
import {dateTimeFormat} from "@/utils/date";
import {canCommentOrder, canReceiveOrder, commentLevelText, formatPrice, orderStatusColor, orderStatusText} from "@/views/web/user_center/utils";

const router = useRouter()
const loading = ref(false)
const submiting = ref(false)
const orders = ref<orderUserType[]>([])
const orderNo = ref("")
const goodsTitle = ref("")
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)
const formMap = reactive<Record<number, {content: string; level: number}>>({})

const count = computed(() => total.value || orders.value.length)

async function loadOrders(resetPage = false) {
  if (resetPage) {
    page.value = 1
  }
  loading.value = true
  try {
    const res = await orderUserListApi({
      limit: pageSize.value,
      page: page.value,
      no: orderNo.value || undefined,
      goodsTitle: goodsTitle.value || undefined,
    })
    if (res.code) {
      Message.error(res.msg)
      return
    }
    orders.value = res.data.list || []
    total.value = res.data.count || 0
    orders.value.forEach((order) => {
      order.orderGoodsList.forEach((goods) => {
        if (!formMap[goods.orderGoodsID]) {
          formMap[goods.orderGoodsID] = {content: "", level: 5}
        }
      })
    })
  } catch (error) {
    console.error(error)
    Message.error("订单加载失败")
  } finally {
    loading.value = false
  }
}

async function searchOrders() {
  await loadOrders(true)
}

async function resetSearch() {
  orderNo.value = ""
  goodsTitle.value = ""
  await loadOrders(true)
}

function openDetail(item: orderUserType) {
  router.push({name: "web_user_center_order_detail", params: {id: item.id}})
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
      content: form.content.trim(),
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
    await loadOrders()
  } catch (error) {
    console.error(error)
    Message.error("提交评价失败")
  } finally {
    submiting.value = false
  }
}

async function receiveOrder(item: orderUserType) {
  const res = await orderRevGoodsApi({orderID: item.id})
  if (res.code) {
    Message.error(res.msg)
    return
  }
  Message.success("已确认收货")
  await loadOrders()
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

function onPageChange(nextPage: number) {
  page.value = nextPage
  loadOrders()
}

onMounted(loadOrders)
</script>

<template>
  <div class="order_view">
    <div class="panel_head">
      <div>
        <div class="eyebrow">ORDERS</div>
        <h2>我的订单</h2>
      </div>
      <div class="head_tag">共 {{ count }} 单</div>
    </div>

    <div class="filter_bar">
      <a-input v-model="orderNo" allow-clear placeholder="按订单号搜索" @press-enter="searchOrders"/>
      <a-input v-model="goodsTitle" allow-clear placeholder="按商品名称搜索" @press-enter="searchOrders"/>
      <a-button type="primary" @click="searchOrders">搜索</a-button>
      <a-button @click="resetSearch">重置</a-button>
    </div>

    <a-spin :loading="loading">
      <div v-if="orders.length" class="order_list">
        <article v-for="item in orders" :key="item.id" class="order_card">
          <div class="order_top">
            <div>
              <strong>{{ item.no }}</strong>
              <span>创建时间：{{ dateTimeFormat(item.createdAt) }}</span>
            </div>
            <a-tag :color="orderStatusColor(item.status)">{{ orderStatusText(item.status) }}</a-tag>
          </div>

          <div class="order_goods">
            <div class="goods_item" v-for="goods in item.orderGoodsList" :key="goods.orderGoodsID">
              <img :src="goods.goodsCover" :alt="goods.goodsTitle">
              <div class="goods_meta">
                <strong>{{ goods.goodsTitle }}</strong>
                <span>单价 ￥ {{ formatPrice(goods.goodsPrice) }}</span>
                <span>数量 x{{ goods.num }}</span>
                <span>备注：{{ goods.note || "无" }}</span>
                <div v-if="canCommentOrder(item.status)" class="comment_editor">
                  <div class="comment_editor_head">
                    <span class="comment_label">商品评价</span>
                    <div class="rate_row">
                      <a-rate v-model="formMap[goods.orderGoodsID].level" allow-clear/>
                      <span class="rate_text">{{ commentLevelText(formMap[goods.orderGoodsID].level) }}</span>
                    </div>
                  </div>
                  <a-textarea
                    v-model="formMap[goods.orderGoodsID].content"
                    placeholder="写下你的真实感受"
                    :auto-size="{minRows: 3, maxRows: 5}"
                  />
                  <div class="comment_actions">
                    <a-button type="primary" :loading="submiting" @click="submitComment(goods.orderGoodsID)">提交评价</a-button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="order_bottom">
            <div class="price_line">
              <span>订单金额 ￥ {{ formatPrice(item.price) }}</span>
              <span>优惠金额 ￥ {{ formatPrice(item.couponPrice) }}</span>
            </div>
            <div class="action_line">
              <a-button type="primary" @click="openDetail(item)">查看详情</a-button>
              <a-button v-if="canReceiveOrder(item.status)" @click="receiveOrder(item)">确认收货</a-button>
              <a-popconfirm content="确定删除该订单吗？" @ok="removeOrder(item)">
                <a-button status="danger">删除</a-button>
              </a-popconfirm>
            </div>
          </div>
        </article>
      </div>
      <div v-else class="empty_card">暂无订单</div>
    </a-spin>

    <div v-if="count > pageSize" class="pager_bar">
      <a-pagination
        :current="page"
        :page-size="pageSize"
        :total="count"
        show-total
        @change="onPageChange"
      />
    </div>
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
.order_top span,
.goods_meta span {
  color: #6b7280;
}

.panel_head p {
  margin: 0;
  font-size: 14px;
  line-height: 1.8;
}

.head_tag {
  display: inline-flex;
  align-items: center;
  height: 34px;
  padding: 0 14px;
  border-radius: 999px;
  background: #fff4f6;
  color: #ff637a;
  font-size: 12px;
  font-weight: 700;
}

.filter_bar {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) auto auto;
  gap: 12px;
  padding: 14px;
  border-radius: 16px;
  background: #fafafb;
  border: 1px solid #eceef2;
}

.order_list {
  display: grid;
  gap: 12px;
}

.order_card {
  padding: 18px;
  border-radius: 16px;
  background: #fff;
  border: 1px solid #eceef2;
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
  color: #111827;
  font-size: 18px;
  margin-bottom: 6px;
}

.order_goods {
  margin-top: 16px;
  display: grid;
  gap: 10px;
}

.goods_item {
  display: grid;
  grid-template-columns: 96px minmax(0, 1fr);
  gap: 14px;
  padding: 12px;
  border-radius: 14px;
  background: #fafafb;
  border: 1px solid #eceef2;
}

.goods_item img {
  width: 96px;
  height: 54px;
  border-radius: 12px;
  object-fit: cover;
}

.goods_meta {
  display: grid;
  gap: 4px;
}

.goods_meta strong {
  color: #111827;
  font-size: 16px;
}

.comment_editor {
  margin-top: 8px;
  padding: 14px;
  border-radius: 14px;
  background: #fff;
  border: 1px solid #f3d6dd;
  display: grid;
  gap: 12px;
}

.comment_editor_head,
.rate_row,
.comment_actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  align-items: center;
}

.comment_editor_head {
  justify-content: space-between;
}

.comment_label,
.rate_text {
  color: #ff647c;
  font-size: 12px;
  font-weight: 700;
}

.rate_row {
  justify-content: flex-end;
}

.comment_editor :deep(.arco-rate-character-full),
.comment_editor :deep(.arco-rate-character-half),
.comment_editor :deep(.arco-rate-character:hover) {
  color: #ff647c;
}

.comment_editor :deep(.arco-textarea-wrapper) {
  border-radius: 12px;
  background: #fffafb;
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

.price_line {
  color: #6b7280;
  font-size: 13px;
}

.action_line {
  justify-content: flex-end;
}

.empty_card {
  padding: 20px;
  border-radius: 16px;
  border: 1px dashed #f0d7dd;
  background: linear-gradient(180deg, #fffafb, #fff);
  color: #9ca3af;
  font-size: 13px;
  text-align: center;
}

.pager_bar {
  display: flex;
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
    aspect-ratio: 16 / 9;
  }

  .filter_bar {
    grid-template-columns: 1fr;
  }

  .comment_editor_head,
  .rate_row {
    justify-content: flex-start;
  }

  .action_line {
    justify-content: flex-start;
  }

  .pager_bar {
    justify-content: flex-start;
  }
}
</style>
