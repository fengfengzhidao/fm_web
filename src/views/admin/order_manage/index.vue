<script setup lang="ts">
import {computed, reactive, ref} from "vue";
import {Message} from "@arco-design/web-vue";
import F_list, {type columnType} from "@/components/admin/f_list.vue";
import {
  orderAdminListApi,
  orderDetailApi,
  orderSendOutGoodsApi,
  type orderAdminType,
  type orderDetailType,
} from "@/api/order_api";
import {dateTemFormat} from "@/utils/date";
import {formatPrice, orderStatusColor, orderStatusText} from "@/views/web/user_center/utils";

const fListRef = ref<InstanceType<typeof F_list>>()
const sendVisible = ref(false)
const detailVisible = ref(false)
const sendFormRef = ref()
const sendLoading = ref(false)
const detailLoading = ref(false)
const detailData = ref<orderDetailType | null>(null)
const currentSendOrder = ref<orderAdminType | null>(null)
const searchForm = reactive({
  no: "",
  userID: undefined as number | undefined,
  status: undefined as number | undefined,
})

const sendForm = reactive({
  orderGoodsID: 0,
  goodsTitle: "",
  waybillNumber: "",
  message: "",
})

const columns: columnType[] = [
  {title: "订单号", slotName: "no", width: 180},
  {title: "用户", slotName: "user", width: 150},
  {title: "商品", slotName: "goods", width: 260},
  {title: "支付价格", slotName: "price", width: 120},
  {title: "下单时间", slotName: "createdAt", width: 180},
  {title: "状态", slotName: "status", width: 120},
  {title: "操作", slotName: "action", width: 240},
]

const statusOptions = [
  {label: "待付款", value: 1},
  {label: "已付款", value: 2},
  {label: "待收货", value: 3},
  {label: "待评价", value: 4},
  {label: "已评价", value: 5},
  {label: "已取消", value: 7},
  {label: "超时", value: 8},
]

const orderCount = computed(() => fListRef.value?.data.count || 0)
const sendGoodsOptions = computed(() => currentSendOrder.value?.orderGoodsList.map((item) => ({
  label: item.goodsTitle,
  value: item.orderGoodsID,
})) || [])

function payTypeText(payType: number) {
  const map: Record<number, string> = {
    1: "微信支付",
    2: "站内支付",
  }
  return map[payType] || `方式 ${payType}`
}

function canSendOrder(order: orderAdminType) {
  return order.status === 2 && order.orderGoodsList.length > 0
}

function searchOrders() {
  fListRef.value?.getList({
    no: searchForm.no || undefined,
    userID: searchForm.userID,
    status: searchForm.status,
    page: 1,
  })
}

function resetSearch() {
  searchForm.no = ""
  searchForm.userID = undefined
  searchForm.status = undefined
  searchOrders()
}

function openSendModal(order: orderAdminType) {
  currentSendOrder.value = order
  const firstGoods = order.orderGoodsList[0]
  sendForm.orderGoodsID = firstGoods?.orderGoodsID || 0
  sendForm.goodsTitle = firstGoods?.goodsTitle || ""
  sendForm.waybillNumber = ""
  sendForm.message = ""
  sendVisible.value = true
}

function changeSendGoods(order: orderAdminType, orderGoodsID: number) {
  const currentGoods = order.orderGoodsList.find((item) => item.orderGoodsID === orderGoodsID)
  sendForm.orderGoodsID = orderGoodsID
  sendForm.goodsTitle = currentGoods?.goodsTitle || ""
}

async function openDetailModal(order: orderAdminType) {
  detailLoading.value = true
  detailVisible.value = true
  try {
    const res = await orderDetailApi(order.id)
    if (res.code) {
      Message.error(res.msg)
      detailVisible.value = false
      return
    }
    detailData.value = res.data
  } finally {
    detailLoading.value = false
  }
}

async function submitSend(done: (closed: boolean) => void) {
  const error = await sendFormRef.value.validate()
  if (error) {
    done(false)
    return
  }
  sendLoading.value = true
  try {
    const res = await orderSendOutGoodsApi({
      orderGoodsID: sendForm.orderGoodsID,
      waybillNumber: sendForm.waybillNumber,
      message: sendForm.message,
    })
    if (res.code) {
      Message.error(res.msg)
      done(false)
      return
    }
    Message.success("发货成功")
    fListRef.value?.getList()
    currentSendOrder.value = null
    done(true)
  } finally {
    sendLoading.value = false
  }
}
</script>

<template>
  <div class="order_manage_view">
    <div class="order_summary">
      <div>
        <div class="label">订单总数</div>
        <div class="value">{{ orderCount }}</div>
      </div>
      <div>
        <div class="label">当前筛选</div>
        <div class="value small">
          {{ searchForm.no || searchForm.userID || searchForm.status ? "已筛选" : "全部订单" }}
        </div>
      </div>
    </div>

    <f_list
      ref="fListRef"
      :url="orderAdminListApi"
      :columns="columns"
      search-placeholder="接口暂不支持关键词搜索"
      no-add
      no-edit
      no-delete
      no-action-group
    >
      <template #search_other>
        <div class="order_filters">
          <a-input
            v-model="searchForm.no"
            allow-clear
            placeholder="订单号"
            @press-enter="searchOrders"
          />
          <a-input-number
            v-model="searchForm.userID"
            :min="1"
            hide-button
            placeholder="用户ID"
            @press-enter="searchOrders"
          />
          <a-select
            v-model="searchForm.status"
            allow-clear
            placeholder="订单状态"
            :options="statusOptions"
          />
          <a-button type="primary" @click="searchOrders">筛选</a-button>
          <a-button @click="resetSearch">重置</a-button>
        </div>
      </template>

      <template #no="{record}:{record: orderAdminType}">
        <div class="stack_cell">
          <span class="primary_text">{{ record.no }}</span>
          <span class="muted">订单ID：{{ record.id }}</span>
        </div>
      </template>

      <template #user="{record}:{record: orderAdminType}">
        <div class="stack_cell">
          <span class="primary_text">{{ record.userNickname || `用户 ${record.userID}` }}</span>
          <span class="muted">用户ID：{{ record.userID }}</span>
        </div>
      </template>

      <template #goods="{record}:{record: orderAdminType}">
        <div class="goods_list">
          <div v-for="goods in record.orderGoodsList" :key="goods.orderGoodsID" class="goods_item">
            <a-image :src="goods.goodsCover" :width="44" :height="44" fit="cover" />
            <div class="goods_info">
              <span class="primary_text">{{ goods.goodsTitle }}</span>
            </div>
          </div>
        </div>
      </template>

      <template #price="{record}:{record: orderAdminType}">
        <span>￥ {{ formatPrice(record.price) }}</span>
      </template>

      <template #createdAt="{record}:{record: orderAdminType}">
        {{ dateTemFormat(record.createdAt) }}
      </template>

      <template #status="{record}:{record: orderAdminType}">
        <a-tag :color="orderStatusColor(record.status)">{{ orderStatusText(record.status) }}</a-tag>
      </template>

      <template #action_left="{record}:{record: orderAdminType}">
        <a-button v-if="canSendOrder(record)" type="primary" status="warning" @click="openSendModal(record)">
          发货
        </a-button>
      </template>
      <template #action_right="{record}:{record: orderAdminType}">
        <a-button @click="openDetailModal(record)">详情</a-button>
      </template>
    </f_list>

    <a-modal
      v-model:visible="sendVisible"
      title="订单发货"
      :confirm-loading="sendLoading"
      :on-before-ok="submitSend"
    >
      <a-form ref="sendFormRef" :model="sendForm" auto-label-width>
        <a-form-item field="orderGoodsID" label="商品" :rules="[{required: true, message: '请选择商品'}]">
          <a-select
            :model-value="sendForm.orderGoodsID"
            @change="(value) => currentSendOrder && changeSendGoods(currentSendOrder, Number(value))"
            :options="sendGoodsOptions"
            placeholder="请选择商品"
          />
        </a-form-item>
        <a-form-item
          field="waybillNumber"
          label="运单号"
          :rules="[{required: true, message: '请输入运单号'}]"
        >
          <a-input v-model="sendForm.waybillNumber" placeholder="请输入运单号" />
        </a-form-item>
        <a-form-item
          field="message"
          label="发货消息"
          :rules="[{required: true, message: '请输入发货消息'}]"
        >
          <a-textarea
            v-model="sendForm.message"
            :auto-size="{minRows: 3, maxRows: 5}"
            placeholder="例如：商品已由顺丰发出，请注意查收"
          />
        </a-form-item>
      </a-form>
    </a-modal>

    <a-modal
      v-model:visible="detailVisible"
      title="订单详情"
      :footer="false"
      :width="920"
      modal-class="order-detail-modal"
    >
      <a-spin :loading="detailLoading">
        <div v-if="detailData" class="detail_modal">
          <div class="detail_hero">
            <div class="detail_hero_main">
              <div class="detail_hero_label">ORDER DETAIL</div>
              <div class="detail_hero_no">{{ detailData.no }}</div>
              <div class="detail_hero_meta">
                <span>用户：{{ detailData.userNickname || `用户 ${detailData.userID}` }}</span>
                <span>下单时间：{{ dateTemFormat(detailData.createdAt) }}</span>
              </div>
            </div>
            <div class="detail_hero_side">
              <a-tag class="detail_status_tag" :color="orderStatusColor(detailData.status)">
                {{ orderStatusText(detailData.status) }}
              </a-tag>
              <div class="detail_hero_price">￥ {{ formatPrice(detailData.price) }}</div>
              <div class="detail_hero_price_desc">订单实付金额</div>
            </div>
          </div>

          <div class="detail_grid">
            <div class="detail_card">
              <div class="detail_label">支付方式</div>
              <div class="detail_value strong">{{ payTypeText(detailData.payType) }}</div>
            </div>
            <div class="detail_card">
              <div class="detail_label">优惠价格</div>
              <div class="detail_value strong">{{ detailData.coupon ? `￥ ${formatPrice(detailData.coupon)}` : "-" }}</div>
            </div>
            <div class="detail_card">
              <div class="detail_label">支付时间</div>
              <div class="detail_value">{{ detailData.payTime ? dateTemFormat(detailData.payTime) : "-" }}</div>
            </div>
            <div class="detail_card">
              <div class="detail_label">商品数量</div>
              <div class="detail_value strong">{{ detailData.goodsList.length }} 件</div>
            </div>
            <div class="detail_card">
              <div class="detail_label">收货人</div>
              <div class="detail_value strong">{{ detailData.addrInfo.name }} {{ detailData.addrInfo.tel }}</div>
            </div>
            <div class="detail_card">
              <div class="detail_label">收货地址</div>
              <div class="detail_value">{{ detailData.addrInfo.addr }} {{ detailData.addrInfo.detailAddr }}</div>
            </div>
          </div>

          <div class="detail_layout">
            <div class="detail_section">
              <div class="detail_section_title">商品清单</div>
              <div class="detail_goods_list">
                <div v-for="goods in detailData.goodsList" :key="goods.orderGoodsID" class="detail_goods_item">
                  <a-image :src="goods.cover" :width="64" :height="64" fit="cover" />
                  <div class="detail_goods_info">
                    <div class="primary_text">{{ goods.title }}</div>
                    <div class="goods_inline_meta">
                      <span class="muted">数量 {{ goods.num }}</span>
                      <span class="muted">单价 ￥ {{ formatPrice(goods.price) }}</span>
                    </div>
                    <div class="muted" v-if="goods.note">备注：{{ goods.note }}</div>
                  </div>
                </div>
              </div>
            </div>

            <div class="detail_section">
              <div class="detail_section_title">补充信息</div>
              <div class="detail_side_group">
                <div class="detail_sub_card">
                  <div class="detail_sub_label">优惠券信息</div>
                  <div v-if="detailData.couponList.length" class="detail_coupon_list">
                    <div
                      v-for="(coupon, index) in detailData.couponList"
                      :key="`${coupon.type}-${index}`"
                      class="muted"
                    >
                      类型 {{ coupon.type }}，优惠 ￥ {{ formatPrice(coupon.couponPrice) }}
                    </div>
                  </div>
                  <div v-else class="muted">未使用优惠券</div>
                </div>

                <div class="detail_sub_card">
                  <div class="detail_sub_label">地址信息</div>
                  <div class="muted">{{ detailData.addrInfo.name }} {{ detailData.addrInfo.tel }}</div>
                  <div class="muted">{{ detailData.addrInfo.addr }} {{ detailData.addrInfo.detailAddr }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </a-spin>
    </a-modal>
  </div>
</template>

<style lang="less">
.order_manage_view {
  .order_summary {
    display: flex;
    gap: 40px;
    padding: 20px 20px 0;

    .label {
      color: @color-text-2;
      font-size: 13px;
      margin-bottom: 6px;
    }

    .value {
      color: @color-text-1;
      font-size: 24px;
      font-weight: 600;

      &.small {
        font-size: 18px;
      }
    }
  }

  .order_filters {
    display: flex;
    align-items: center;
    gap: 10px;

    .arco-input,
    .arco-input-number,
    .arco-select {
      width: 150px;
    }

    .arco-input {
      width: 220px;
    }
  }

  .stack_cell,
  .goods_info {
    display: flex;
    flex-direction: column;
    line-height: 1.6;
  }

  .primary_text {
    color: @color-text-1;
    font-weight: 500;
  }

  .muted {
    color: @color-text-3;
    font-size: 12px;
  }

  .goods_list {
    display: grid;
    gap: 10px;
  }

  .goods_item {
    display: grid;
    grid-template-columns: 44px minmax(0, 1fr);
    gap: 10px;
    align-items: center;
  }

  .detail_modal {
    display: grid;
    gap: 20px;
  }

  .detail_hero {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    padding: 18px 20px;
    border-radius: 14px;
    background: linear-gradient(135deg, rgba(255, 116, 138, .12), rgba(255, 92, 117, .04));
    border: 1px solid rgba(255, 116, 138, .12);
  }

  .detail_hero_main,
  .detail_hero_side {
    display: grid;
    gap: 8px;
  }

  .detail_hero_label {
    color: @color-text-3;
    font-size: 12px;
    letter-spacing: .12em;
    font-weight: 700;
  }

  .detail_hero_no {
    color: @color-text-1;
    font-size: 24px;
    font-weight: 700;
    line-height: 1.2;
    word-break: break-all;
  }

  .detail_hero_meta {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    color: @color-text-2;
    font-size: 13px;
  }

  .detail_hero_side {
    justify-items: end;
    align-content: start;
  }

  .detail_status_tag {
    padding: 2px 10px;
    border-radius: 999px;
  }

  .detail_hero_price {
    color: #f53f3f;
    font-size: 28px;
    font-weight: 700;
    line-height: 1;
  }

  .detail_hero_price_desc {
    color: @color-text-3;
    font-size: 12px;
  }

  .detail_grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
  }

  .detail_card,
  .detail_section {
    border: 1px solid var(--color-border-2);
    border-radius: 10px;
    background: var(--color-fill-1);
  }

  .detail_card {
    padding: 14px 16px;
  }

  .detail_label {
    color: @color-text-3;
    font-size: 12px;
    margin-bottom: 6px;
  }

  .detail_value {
    color: @color-text-1;
    font-size: 14px;
    line-height: 1.6;
    word-break: break-all;
  }

  .detail_section {
    padding: 16px;
  }

  .detail_layout {
    display: grid;
    grid-template-columns: minmax(0, 1.45fr) minmax(280px, .55fr);
    gap: 14px;
  }

  .detail_section_title {
    color: @color-text-1;
    font-size: 16px;
    font-weight: 600;
    margin-bottom: 12px;
  }

  .detail_goods_list {
    display: grid;
    gap: 12px;
  }

  .detail_goods_item {
    display: grid;
    grid-template-columns: 64px minmax(0, 1fr);
    gap: 12px;
    align-items: center;
    padding: 10px 0;
    border-bottom: 1px solid var(--color-border-2);
  }

  .detail_goods_item:last-child {
    border-bottom: 0;
  }

  .detail_goods_info {
    display: grid;
    gap: 4px;
  }

  .goods_inline_meta {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
  }

  .detail_side_group {
    display: grid;
    gap: 12px;
  }

  .detail_sub_card {
    padding: 14px;
    border-radius: 12px;
    background: var(--color-bg-1);
    border: 1px solid var(--color-border-2);
    display: grid;
    gap: 8px;
  }

  .detail_sub_label {
    color: @color-text-1;
    font-size: 14px;
    font-weight: 600;
  }

  .detail_coupon_list {
    display: grid;
    gap: 6px;
  }

  @media (max-width: 900px) {
    .detail_hero {
      flex-direction: column;
    }

    .detail_hero_side {
      justify-items: start;
    }

    .detail_grid,
    .detail_layout {
      grid-template-columns: 1fr;
    }
  }

  .arco-image {
    border-radius: 4px;
    overflow: hidden;
    background-color: var(--color-fill-2);
  }
}

.order-detail-modal {
  .arco-modal-body {
    padding-top: 20px;
  }

  .primary_text {
    color: @color-text-1;
    font-weight: 600;
    font-size: 15px;
    line-height: 1.5;
  }

  .muted {
    color: @color-text-3;
    font-size: 13px;
    line-height: 1.6;
  }

  .detail_modal {
    display: grid;
    gap: 20px;
  }

  .detail_hero {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    padding: 20px 22px;
    border-radius: 14px;
    background: linear-gradient(135deg, rgba(255, 116, 138, .14), rgba(255, 92, 117, .05));
    border: 1px solid rgba(255, 116, 138, .12);
  }

  .detail_hero_main,
  .detail_hero_side {
    display: grid;
    gap: 8px;
  }

  .detail_hero_label {
    color: @color-text-3;
    font-size: 12px;
    letter-spacing: .12em;
    font-weight: 700;
  }

  .detail_hero_no {
    color: @color-text-1;
    font-size: 24px;
    font-weight: 700;
    line-height: 1.2;
    word-break: break-all;
  }

  .detail_hero_meta {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    color: @color-text-2;
    font-size: 13px;
    line-height: 1.6;
  }

  .detail_hero_side {
    justify-items: end;
    align-content: start;
  }

  .detail_status_tag {
    padding: 2px 10px;
    border-radius: 999px;
  }

  .detail_hero_price {
    color: #f53f3f;
    font-size: 30px;
    font-weight: 700;
    line-height: 1;
  }

  .detail_hero_price_desc {
    color: @color-text-3;
    font-size: 12px;
  }

  .detail_grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
  }

  .detail_card,
  .detail_section {
    border: 1px solid var(--color-border-2);
    border-radius: 12px;
    background: var(--color-fill-1);
  }

  .detail_card {
    padding: 14px 16px;
    min-height: 86px;
    display: grid;
    align-content: space-between;
    gap: 8px;
  }

  .detail_label {
    color: @color-text-3;
    font-size: 12px;
    line-height: 1.4;
  }

  .detail_value {
    color: @color-text-1;
    font-size: 14px;
    line-height: 1.7;
    word-break: break-all;
  }

  .detail_value.strong {
    font-size: 18px;
    font-weight: 600;
    line-height: 1.4;
  }

  .detail_section {
    padding: 18px;
  }

  .detail_layout {
    display: grid;
    grid-template-columns: minmax(0, 1.45fr) minmax(280px, .55fr);
    gap: 14px;
  }

  .detail_section_title {
    color: @color-text-1;
    font-size: 16px;
    font-weight: 600;
    margin-bottom: 14px;
  }

  .detail_goods_list {
    display: grid;
    gap: 12px;
  }

  .detail_goods_item {
    display: grid;
    grid-template-columns: 64px minmax(0, 1fr);
    gap: 12px;
    align-items: center;
    padding: 10px 0;
    border-bottom: 1px solid var(--color-border-2);
  }

  .detail_goods_item:last-child {
    border-bottom: 0;
  }

  .detail_goods_info {
    display: grid;
    gap: 4px;
  }

  .goods_inline_meta {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
  }

  .detail_side_group {
    display: grid;
    gap: 12px;
  }

  .detail_sub_card {
    padding: 14px;
    border-radius: 12px;
    background: var(--color-bg-1);
    border: 1px solid var(--color-border-2);
    display: grid;
    gap: 8px;
  }

  .detail_sub_label {
    color: @color-text-1;
    font-size: 14px;
    font-weight: 600;
  }

  .detail_coupon_list {
    display: grid;
    gap: 6px;
  }

  .arco-image {
    border-radius: 6px;
    overflow: hidden;
    background-color: var(--color-fill-2);
  }
}

@media (max-width: 900px) {
  .order-detail-modal {
    .detail_hero {
      flex-direction: column;
    }

    .detail_hero_side {
      justify-items: start;
    }

    .detail_grid,
    .detail_layout {
      grid-template-columns: 1fr;
    }
  }
}
</style>
