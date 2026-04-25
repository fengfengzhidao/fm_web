<script setup lang="ts">
import {computed, ref, watch} from "vue";
import {useRoute, useRouter} from "vue-router";
import {Message} from "@arco-design/web-vue";
import {IconCheckCircle, IconClockCircle, IconSafe} from "@arco-design/web-vue/es/icon";
import {orderCallbackApi, orderPayPageApi} from "@/api/order_api";
import {formatPrice} from "@/views/web/user_center/utils";

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const paying = ref(false)
const payInfo = ref<{ no: string; price: number } | null>(null)

const orderNo = computed(() => {
  const no = route.query.no
  return typeof no === "string" ? no.trim() : ""
})

async function loadPayInfo() {
  if (!orderNo.value) {
    Message.error("缺少订单号")
    router.replace({name: "web_user_center_order"})
    return
  }

  loading.value = true
  try {
    const res = await orderPayPageApi({no: orderNo.value})
    if (res.code) {
      Message.error(res.msg)
      router.replace({name: "web_user_center_order"})
      return
    }
    payInfo.value = res.data
  } catch (error) {
    console.error(error)
    Message.error("支付信息加载失败")
    router.replace({name: "web_user_center_order"})
  } finally {
    loading.value = false
  }
}

async function handlePaySuccess() {
  if (!orderNo.value) {
    Message.error("缺少订单号")
    return
  }

  paying.value = true
  try {
    const res = await orderCallbackApi({no: orderNo.value})
    if (res.code) {
      Message.error(res.msg)
      return
    }
    Message.success("支付成功")
    router.replace({name: "web_user_center_order"})
  } catch (error) {
    console.error(error)
    Message.error("支付回调失败")
  } finally {
    paying.value = false
  }
}

watch(orderNo, loadPayInfo, {immediate: true})
</script>

<template>
  <div class="order_pay_view">
    <div class="page_shell">
      <section class="pay_surface">
        <a-spin :loading="loading" tip="加载中...">
          <div v-if="payInfo" class="pay_layout">
            <div class="pay_main">
              <div class="eyebrow">PAYMENT</div>
              <h1>订单支付</h1>
              <p class="pay_desc">这是一个前台假支付页，点击支付成功后会调用后端支付回调接口完成订单支付。</p>

              <div class="pay_steps">
                <span><IconClockCircle/> 确认订单号</span>
                <span><IconSafe/> 点击支付成功</span>
                <span><IconCheckCircle/> 返回订单列表查看状态</span>
              </div>

              <div class="pay_card">
                <div class="pay_label">订单号</div>
                <div class="pay_no">{{ payInfo.no }}</div>
                <div class="pay_label">支付金额</div>
                <div class="pay_price">￥ {{ formatPrice(payInfo.price) }}</div>
              </div>

              <div class="pay_actions">
                <a-button type="primary" size="large" :loading="paying" @click="handlePaySuccess">支付成功</a-button>
                <a-button size="large" @click="router.push({name: 'web_user_center_order'})">返回订单列表</a-button>
              </div>
            </div>

            <aside class="pay_summary">
              <div class="summary_title">支付说明</div>
              <div class="summary_list">
                <div class="summary_item">当前页只做前台演示，不接第三方支付网关。</div>
                <div class="summary_item">点击“支付成功”后会调用 `/api/order/callback`。</div>
                <div class="summary_item">支付完成后会回到我的订单，可继续发货、收货和评价流程。</div>
              </div>
            </aside>
          </div>
        </a-spin>
      </section>
    </div>
  </div>
</template>

<style scoped lang="less">
.order_pay_view {
  min-height: 100vh;
  background: var(--web-page-bg);
}

.page_shell {
  width: min(1180px, calc(100% - 48px));
  margin: 0 auto;
  padding: 0 0 36px;
}

.pay_surface {
  border-radius: 18px;
  background: transparent;
}

.pay_surface :deep(.arco-spin) {
  width: 100%;
}

.pay_layout {
  display: grid;
  grid-template-columns: minmax(0, 1.5fr) 300px;
  gap: 16px;
}

.pay_main,
.pay_summary {
  border-radius: 16px;
  border: 1px solid var(--web-border);
  background: var(--web-surface);
}

.pay_main {
  padding: 28px 28px 32px;
  background: var(--web-hero-grad);
}

.eyebrow {
  color: #ff647c;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: .12em;
}

.pay_main h1 {
  margin: 8px 0 10px;
  font-size: 36px;
  line-height: 1.08;
  color: #111827;
}

.pay_desc {
  margin: 0;
  color: #6b7280;
  font-size: 14px;
  line-height: 1.8;
}

.pay_steps {
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

.pay_card {
  margin-top: 22px;
  padding: 24px;
  border-radius: 18px;
  border: 1px solid var(--web-border);
  background: var(--web-surface);
}

.pay_label {
  color: #9ca3af;
  font-size: 13px;
}

.pay_no {
  margin-top: 8px;
  color: #111827;
  font-size: 20px;
  font-weight: 700;
  word-break: break-all;
}

.pay_price {
  margin-top: 8px;
  color: #ff637a;
  font-size: 40px;
  font-weight: 700;
  line-height: 1.1;
}

.pay_actions {
  margin-top: 24px;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.pay_summary {
  padding: 24px 20px;
  align-self: start;
}

.summary_title {
  color: #111827;
  font-size: 18px;
  font-weight: 700;
}

.summary_list {
  margin-top: 16px;
  display: grid;
  gap: 12px;
}

.summary_item {
  padding: 14px 14px;
  border-radius: 12px;
  background: var(--web-soft-bg);
  color: #4b5563;
  font-size: 13px;
  line-height: 1.7;
}

@media (max-width: 900px) {
  .page_shell {
    width: calc(100% - 24px);
    padding-top: 12px;
  }

  .pay_layout {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .page_shell {
    width: calc(100% - 16px);
  }

  .pay_main {
    padding: 22px 16px 24px;
  }

  .pay_main h1,
  .pay_price {
    font-size: 28px;
  }
}
</style>
