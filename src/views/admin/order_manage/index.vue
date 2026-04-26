<script setup lang="ts">
import {computed, reactive, ref} from "vue";
import {Message} from "@arco-design/web-vue";
import F_list, {type columnType} from "@/components/admin/f_list.vue";
import {
  orderAdminListApi,
  orderSendOutGoodsApi,
  type orderAdminGoodsType,
  type orderAdminType,
} from "@/api/order_api";
import {dateTemFormat} from "@/utils/date";
import {formatPrice, orderStatusColor, orderStatusText} from "@/views/web/user_center/utils";

const fListRef = ref<InstanceType<typeof F_list>>()
const sendVisible = ref(false)
const sendFormRef = ref()
const sendLoading = ref(false)
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
  {title: "优惠价格", slotName: "coupon", width: 120},
  {title: "下单时间", slotName: "createdAt", width: 180},
  {title: "状态", slotName: "status", width: 120},
  {title: "支付时间", slotName: "payTime", width: 180},
  {title: "支付方式", slotName: "payType", width: 120},
  {title: "操作", slotName: "action", width: 180},
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

function payTypeText(payType: number) {
  const map: Record<number, string> = {
    1: "微信支付",
    2: "站内支付",
  }
  return map[payType] || `方式 ${payType}`
}

function goodsSendable(goods: orderAdminGoodsType) {
  return goods.status === 2
}

function goodsStatusText(goods: orderAdminGoodsType) {
  if (goods.status === 2) return "去发货"
  if (goods.status === 3) return "已发货"
  if (goods.status === 4 || goods.status === 5 || goods.status === 6) return "已完成"
  return orderStatusText(goods.status)
}

function goodsStatusType(goods: orderAdminGoodsType) {
  if (goods.status === 2) return "primary" as const
  if (goods.status === 3) return "success" as const
  return "secondary" as const
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

function openSendModal(orderGoods: orderAdminGoodsType) {
  sendForm.orderGoodsID = orderGoods.orderGoodsID
  sendForm.goodsTitle = orderGoods.goodsTitle
  sendForm.waybillNumber = ""
  sendForm.message = ""
  sendVisible.value = true
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
              <a-button
                v-if="goodsSendable(goods)"
                type="text"
                size="mini"
                class="send_link"
                @click="openSendModal(goods)"
              >
                去发货
              </a-button>
              <a-tag v-else :color="goodsStatusType(goods)">{{ goodsStatusText(goods) }}</a-tag>
            </div>
          </div>
        </div>
      </template>

      <template #price="{record}:{record: orderAdminType}">
        <span>￥ {{ formatPrice(record.price) }}</span>
      </template>

      <template #coupon="{record}:{record: orderAdminType}">
        <span>{{ record.coupon ? `￥ ${formatPrice(record.coupon)}` : "-" }}</span>
      </template>

      <template #createdAt="{record}:{record: orderAdminType}">
        {{ dateTemFormat(record.createdAt) }}
      </template>

      <template #status="{record}:{record: orderAdminType}">
        <a-tag :color="orderStatusColor(record.status)">{{ orderStatusText(record.status) }}</a-tag>
      </template>

      <template #payTime="{record}:{record: orderAdminType}">
        {{ record.payTime ? dateTemFormat(record.payTime) : "-" }}
      </template>

      <template #payType="{record}:{record: orderAdminType}">
        {{ payTypeText(record.payType) }}
      </template>

      <template #action_right="{record}:{record: orderAdminType}">
        <a-popover position="left">
          <a-button>商品数 {{ record.orderGoodsList.length }}</a-button>
          <template #content>
            <div class="popover_list">
              <div v-for="goods in record.orderGoodsList" :key="goods.orderGoodsID">
                {{ goods.goodsTitle }}
              </div>
            </div>
          </template>
        </a-popover>
      </template>
    </f_list>

    <a-modal
      v-model:visible="sendVisible"
      title="订单发货"
      :confirm-loading="sendLoading"
      :on-before-ok="submitSend"
    >
      <a-form ref="sendFormRef" :model="sendForm" auto-label-width>
        <a-form-item field="goodsTitle" label="商品">
          <a-input v-model="sendForm.goodsTitle" disabled />
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

  .send_link {
    justify-content: flex-start;
    padding-left: 0;
  }

  .popover_list {
    display: grid;
    gap: 6px;
    max-width: 240px;
  }

  .arco-image {
    border-radius: 4px;
    overflow: hidden;
    background-color: var(--color-fill-2);
  }
}
</style>
