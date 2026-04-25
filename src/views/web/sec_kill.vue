<script setup lang="ts">
import {computed, onMounted, ref, watch} from "vue";
import dayjs from "dayjs";
import {Message} from "@arco-design/web-vue";
import {
  IconCalendar,
  IconClockCircle,
  IconFire,
  IconGift,
  IconNotification,
  IconThunderbolt
} from "@arco-design/web-vue/es/icon";
import F_footer from "@/components/web/f_footer.vue";
import {
  secKillApi,
  secKillDateListApi,
  secKillDetailApi,
  secKillListApi,
  secKillOrderApi,
  type secKillDateItem,
  type secKillDetailType,
  type secKillInfoType,
} from "@/api/sec_kill_api";
import {addrListApi, type addrType} from "@/api/user_center_api";
import {formatPrice} from "@/views/web/user_center/utils";
import {useRouter} from "vue-router";

type SecKillStage = "not_started" | "running" | "ended"

const router = useRouter()

const loading = ref(false)
const submitting = ref(false)
const dateLoading = ref(false)
const dateList = ref<secKillDateItem[]>([])
const goodsList = ref<secKillInfoType[]>([])
const selectedDateText = ref("")
const detailVisible = ref(false)
const detailLoading = ref(false)
const detailInfo = ref<secKillDetailType | null>(null)
const detailKey = ref("")
const addrList = ref<addrType[]>([])
const selectedAddrID = ref<number>()
const payType = ref(1)
const note = ref("")

const selectedDateLabel = computed(() => selectedDateText.value || "未选择")
const summaryText = computed(() => `${goodsList.value.length} 个秒杀商品`)
const dateTabList = computed(() => dateList.value.slice(0, 8))

function dateTextToKey(value: string): string {
  const parts = value.trim().split(/\s+/)
  if (parts.length < 2) {
    return value.trim()
  }
  const hour = parts[1].split(":")[0]
  return `${parts[0]}-${hour}`
}

function formatTime(value?: string | null): string {
  if (!value) return "--"
  return dayjs(value).format("MM-DD HH:mm")
}

function stageCountdown(item: secKillInfoType): string {
  const now = Date.now()
  const start = new Date(item.startTime).getTime()
  const end = new Date(item.endTime).getTime()
  if (Number.isNaN(start) || Number.isNaN(end)) {
    return "火热进行中"
  }
  if (now < start) {
    return `距开始 ${dayjs(start).format("MM-DD HH:mm")}`
  }
  if (now > end) {
    return `已于 ${dayjs(end).format("MM-DD HH:mm")} 结束`
  }
  return `距结束 ${dayjs(end).format("MM-DD HH:mm")}`
}

function getStage(item: secKillInfoType): SecKillStage {
  const now = Date.now()
  const start = new Date(item.startTime).getTime()
  const end = new Date(item.endTime).getTime()
  if (Number.isNaN(start) || Number.isNaN(end)) {
    return "running"
  }
  if (now < start) return "not_started"
  if (now > end) return "ended"
  return "running"
}

function stageText(stage: SecKillStage): string {
  if (stage === "not_started") return "即将开始"
  if (stage === "ended") return "已结束"
  return "抢购中"
}

function stageTagClass(stage: SecKillStage): string {
  if (stage === "not_started") return "pending"
  if (stage === "ended") return "ended"
  return "running"
}

async function loadDateList() {
  dateLoading.value = true
  try {
    const res = await secKillDateListApi()
    if (res.code) {
      Message.warning(res.msg)
      dateList.value = []
      selectedDateText.value = ""
      goodsList.value = []
      return
    }

    dateList.value = res.data || []
    selectedDateText.value = routePreferredDate() || res.data?.[0]?.date || ""
  } catch (error) {
    console.error(error)
    Message.error("秒杀日期加载失败")
  } finally {
    dateLoading.value = false
  }
}

function routePreferredDate(): string {
  const raw = new URLSearchParams(window.location.search).get("date")
  return raw || ""
}

async function loadGoods() {
  if (!selectedDateText.value) {
    goodsList.value = []
    return
  }

  loading.value = true
  try {
    const res = await secKillListApi({date: dateTextToKey(selectedDateText.value)})
    if (res.code) {
      Message.warning(res.msg)
      goodsList.value = []
      return
    }
    goodsList.value = res.data || []
  } catch (error) {
    console.error(error)
    Message.error("秒杀商品加载失败")
  } finally {
    loading.value = false
  }
}

async function loadAddressList() {
  try {
    const res = await addrListApi()
    if (res.code) {
      Message.warning(res.msg)
      addrList.value = []
      return
    }
    addrList.value = res.data.list || []
    selectedAddrID.value = addrList.value.find((item) => item.isDefault)?.id || addrList.value[0]?.id
  } catch (error) {
    console.error(error)
    Message.error("收货地址加载失败")
  }
}

async function openPurchase(item: secKillInfoType) {
  if (!selectedDateText.value) {
    Message.warning("请先选择秒杀码段")
    return
  }

  const stage = getStage(item)
  if (stage === "not_started") {
    Message.warning("秒杀尚未开始")
    return
  }
  if (stage === "ended") {
    Message.warning("本场秒杀已结束")
    return
  }

  submitting.value = true
  try {
    const res = await secKillApi({
      date: dateTextToKey(selectedDateText.value),
      goodsID: item.goodsID,
    })
    if (res.code) {
      Message.error(res.msg)
      return
    }

    detailKey.value = res.data.key
    detailLoading.value = true
    const detailRes = await secKillDetailApi({key: res.data.key})
    if (detailRes.code) {
      Message.error(detailRes.msg)
      return
    }

    detailInfo.value = detailRes.data
    detailVisible.value = true
    await loadAddressList()
  } catch (error) {
    console.error(error)
    Message.error("抢购信息加载失败")
  } finally {
    detailLoading.value = false
    submitting.value = false
  }
}

async function submitOrder() {
  if (!detailKey.value) {
    Message.warning("请先完成抢购")
    return
  }
  if (!selectedAddrID.value) {
    Message.warning("请先选择收货地址")
    return
  }

  submitting.value = true
  try {
    const res = await secKillOrderApi({
      key: detailKey.value,
      addrID: selectedAddrID.value,
      payType: payType.value,
      note: note.value || undefined,
    })
    if (res.code) {
      Message.error(res.msg)
      return
    }
    Message.success("秒杀订单提交成功")
    if (res.data.payUrl) {
      Message.info("已生成支付地址")
      window.open(res.data.payUrl, "_blank")
    }
    detailVisible.value = false
    router.push({name: "web_user_center_order"})
  } catch (error) {
    console.error(error)
    Message.error("提交秒杀订单失败")
  } finally {
    submitting.value = false
  }
}

watch(selectedDateText, () => {
  loadGoods()
})

onMounted(loadDateList)
</script>

<template>
  <div class="sec_kill_view">
    <div class="page_shell">
      <section class="hero_surface">
        <header class="hero_header">
          <router-link class="brand_block" to="/">
            <div class="brand_title">枫枫商城</div>
            <div class="brand_subtitle">享受快人一步</div>
          </router-link>

          <div class="header_actions">
            <button type="button" @click="router.push({name: 'web_home'})">商城首页</button>
            <button type="button" @click="router.push({name: 'web_search'})">搜索商品</button>
            <button type="button" @click="router.push({name: 'web_cart'})">购物车</button>
          </div>
        </header>

        <section class="hero_section">
          <div class="hero_copy">
            <div class="eyebrow">FLASH SALE</div>
            <h1>秒杀专区</h1>
            <p>先选时间段，再看场次商品。页面结构沿用首页和搜索页的前台白底卡片风格，把秒杀信息压成更直接的抢购视图。</p>

            <div class="hero_tags">
              <span><IconThunderbolt/> 限时抢购</span>
              <span><IconCalendar/> 按场次切换</span>
              <span><IconGift/> 直达下单</span>
            </div>
          </div>

          <aside class="hero_summary">
            <div class="summary_title">当前秒杀码段</div>
            <div class="summary_value">{{ selectedDateLabel }}</div>
            <div class="summary_meta">{{ summaryText }}</div>
            <div class="summary_hint">
              <IconNotification/>
              <span>无场次数据时先到后台活动管理创建秒杀</span>
            </div>
            <a-button long type="primary" @click="router.push({name: 'web_home'})">返回首页</a-button>
          </aside>
        </section>
      </section>

      <section class="panel_surface">
        <div class="panel_head">
          <div>
            <div class="panel_title">秒杀码段</div>
            <div class="panel_desc">选择一个时间场次后，再查看对应的秒杀商品和抢购状态</div>
          </div>
          <a-button size="small" @click="loadDateList">刷新日期</a-button>
        </div>

        <a-spin :loading="dateLoading" tip="加载日期中...">
          <div v-if="dateTabList.length" class="date_tabs">
            <button
              v-for="item in dateTabList"
              :key="item.date"
              class="date_tab"
              :class="{active: selectedDateText === item.date}"
              @click="selectedDateText = item.date"
            >
              <span class="date_day">{{ item.date.split(' ')[0] }}</span>
              <strong class="date_hour">{{ item.date.split(' ')[1] || item.date }}</strong>
            </button>
          </div>
          <div v-else class="empty_card">
            <div class="empty_icon"><IconClockCircle/></div>
            <div class="empty_title">暂无秒杀码段</div>
            <div class="empty_desc">可以先到后台活动管理创建秒杀活动，页面会自动按场次展示。</div>
          </div>
        </a-spin>
      </section>

      <section class="panel_surface">
        <div class="panel_head">
          <div>
            <div class="panel_title">秒杀商品</div>
            <div class="panel_desc">按当前场次展示库存、进度和开抢时间，卡片信息和首页商品区保持统一</div>
          </div>
          <a-button size="small" @click="loadGoods">刷新商品</a-button>
        </div>

        <a-spin :loading="loading" tip="加载商品中...">
          <div v-if="goodsList.length" class="goods_grid">
            <article v-for="item in goodsList" :key="item.goodsID" class="goods_card">
              <div class="goods_cover">
                <img :src="item.cover" :alt="item.title">
                <span class="stage_badge" :class="stageTagClass(getStage(item))">
                  {{ stageText(getStage(item)) }}
                </span>
              </div>
              <div class="goods_body">
                <h3>{{ item.title }}</h3>
                <div class="price_row">
                  <strong>￥ {{ formatPrice(item.killPrice) }}</strong>
                  <span>原价 ￥ {{ formatPrice(item.price) }}</span>
                </div>
                <div class="meta_row">
                  <span>库存 {{ item.killInventory }}</span>
                  <span>已购 {{ item.buyNum }}</span>
                </div>
                <div class="time_row">
                  <span>{{ stageCountdown(item) }}</span>
                </div>
                <a-button
                  type="primary"
                  long
                  :loading="submitting && !detailVisible"
                  :disabled="getStage(item) !== 'running' || item.buyNum >= item.killInventory"
                  @click="openPurchase(item)"
                >
                  立即抢购
                </a-button>
              </div>
            </article>
          </div>
          <div v-else class="empty_card large">
            <div class="empty_icon"><IconFire/></div>
            <div class="empty_title">当前场次暂无商品</div>
            <div class="empty_desc">先切换其它秒杀码段，或者回到后台补齐秒杀活动和商品配置。</div>
          </div>
        </a-spin>
      </section>
    </div>

    <a-modal
      v-model:visible="detailVisible"
      :width="760"
      title="秒杀下单"
      :footer="false"
      :mask-closable="false"
    >
      <a-spin :loading="detailLoading" tip="加载秒杀详情中...">
        <div v-if="detailInfo" class="detail_grid">
          <section class="detail_panel">
            <div class="detail_title">商品信息</div>
            <div class="detail_goods">
              <img :src="detailInfo.cover" :alt="detailInfo.title">
              <div>
                <h3>{{ detailInfo.title }}</h3>
                <p>秒杀码段：{{ selectedDateLabel }}</p>
                <p>原价 ￥{{ formatPrice(detailInfo.price) }}，秒杀价 ￥{{ formatPrice(detailInfo.killPrice) }}</p>
                <p>库存 {{ detailInfo.killInventory }}，已购 {{ detailInfo.buyNum }}</p>
                <p>开始 {{ formatTime(detailInfo.startTime) }}，结束 {{ formatTime(detailInfo.endTime) }}</p>
              </div>
            </div>
          </section>

          <section class="detail_panel">
            <div class="detail_title">收货地址</div>
            <div v-if="addrList.length" class="addr_list">
              <label
                v-for="item in addrList"
                :key="item.id"
                class="addr_item"
                :class="{active: selectedAddrID === item.id}"
              >
                <input v-model="selectedAddrID" type="radio" :value="item.id">
                <div>
                  <strong>{{ item.name }} {{ item.tel }}</strong>
                  <span>{{ item.addr }} {{ item.detailAddr }}</span>
                </div>
              </label>
            </div>
            <a-empty v-else description="暂无地址，请先到个人中心添加"/>
          </section>

          <section class="detail_panel">
            <div class="detail_title">支付信息</div>
            <a-radio-group v-model="payType" class="pay_group">
              <a-radio :value="1">默认支付</a-radio>
              <a-radio :value="2">快捷支付</a-radio>
            </a-radio-group>
            <a-textarea v-model="note" :auto-size="{minRows: 2, maxRows: 4}" placeholder="订单备注，可选"/>
            <div class="action_row">
              <a-button @click="detailVisible = false">取消</a-button>
              <a-button type="primary" :loading="submitting" @click="submitOrder">提交秒杀订单</a-button>
            </div>
          </section>
        </div>
      </a-spin>
    </a-modal>
    <f_footer/>
  </div>
</template>

<style scoped lang="less">
.sec_kill_view {
  min-height: 100vh;
  color: var(--color-text-1);
  background:
    linear-gradient(180deg, #f5f5f6 0, #f5f5f6 460px, #f2f3f5 460px, #f2f3f5 100%);
}

.page_shell {
  width: min(1180px, calc(100% - 48px));
  margin: 0 auto;
  padding: 26px 0 36px;
}

.hero_surface,
.panel_surface {
  border-radius: 18px;
  background: #fff;
  box-shadow: 0 20px 45px rgba(17, 24, 39, .05);
}

.hero_surface {
  padding: 24px 22px 22px;
}

.hero_header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.brand_block {
  text-decoration: none;
  color: inherit;
}

.brand_title {
  font-size: 28px;
  line-height: 1.05;
  color: #ff667d;
  font-weight: 700;
  letter-spacing: .02em;
}

.brand_subtitle {
  margin-top: 6px;
  color: #ff8b9b;
  font-size: 12px;
  letter-spacing: .18em;
}

.header_actions {
  display: flex;
  align-items: center;
  gap: 18px;

  button {
    border: 0;
    background: transparent;
    padding: 0;
    color: #4b5563;
    font-size: 12px;
    cursor: pointer;
  }
}

.hero_section {
  margin-top: 24px;
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
  word-break: break-all;
}

.summary_meta {
  color: #4b5563;
  font-size: 14px;
}

.summary_hint {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  color: #9ca3af;
  font-size: 12px;
  line-height: 1.6;
}

.panel_surface {
  margin-top: 18px;
  padding: 18px;
}

.panel_head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 14px;
}

.panel_title {
  color: #111827;
  font-size: 28px;
  font-weight: 700;
  line-height: 1.1;
}

.panel_desc {
  margin-top: 8px;
  color: #9ca3af;
  font-size: 13px;
}

.date_tabs {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.date_tab {
  padding: 16px 14px;
  border-radius: 14px;
  border: 1px solid #eceef2;
  background: #fafafb;
  display: grid;
  justify-items: start;
  gap: 6px;
  cursor: pointer;
  transition: .18s ease;

  &.active {
    border-color: #ffccd5;
    background: linear-gradient(180deg, #fff4f6, #fff);
    box-shadow: 0 12px 24px rgba(255, 99, 122, .08);
  }
}

.date_day {
  color: #9ca3af;
  font-size: 12px;
}

.date_hour {
  color: #111827;
  font-size: 22px;
  line-height: 1;
}

.goods_grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.goods_card {
  overflow: hidden;
  border: 1px solid #eceef2;
  border-radius: 10px;
  background: #fff;
  transition: transform .18s ease, box-shadow .18s ease, border-color .18s ease;

  &:hover {
    transform: translateY(-2px);
    border-color: #ffd2da;
    box-shadow: 0 14px 28px rgba(17, 24, 39, .08);
  }
}

.goods_cover {
  position: relative;
  aspect-ratio: 1;
  background: #f7f8fa;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
}

.stage_badge {
  position: absolute;
  left: 10px;
  top: 10px;
  display: inline-flex;
  align-items: center;
  height: 24px;
  padding: 0 10px;
  border-radius: 999px;
  color: #fff;
  font-size: 11px;
  font-weight: 700;

  &.running {
    background: linear-gradient(135deg, #ff6f86, #ff556f);
  }

  &.pending {
    background: linear-gradient(135deg, #6aa9ff, #3f84ff);
  }

  &.ended {
    background: linear-gradient(135deg, #9ca3af, #6b7280);
  }
}

.goods_body {
  padding: 12px;

  h3 {
    margin: 0;
    min-height: 38px;
    color: #374151;
    font-size: 13px;
    line-height: 1.5;
    display: -webkit-box;
    overflow: hidden;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }
}

.price_row,
.meta_row,
.time_row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: 10px;
}

.price_row strong {
  color: #ff637a;
  font-size: 16px;
  font-weight: 700;
}

.price_row span,
.meta_row,
.time_row {
  color: #9ca3af;
  font-size: 11px;
}

.meta_row,
.time_row {
  line-height: 1.5;
}

.time_row span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.empty_card {
  min-height: 180px;
  border-radius: 16px;
  border: 1px dashed #f0d7dd;
  background: linear-gradient(180deg, #fffafb, #fff);
  display: grid;
  justify-items: center;
  align-content: center;
  text-align: center;
  padding: 24px;

  &.large {
    min-height: 260px;
  }
}

.empty_icon {
  width: 56px;
  height: 56px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  background: #fff1f4;
  color: #ff647c;
  font-size: 28px;
}

.empty_title {
  margin-top: 12px;
  color: #111827;
  font-size: 18px;
  font-weight: 700;
}

.empty_desc {
  margin-top: 8px;
  max-width: 420px;
  color: #9ca3af;
  font-size: 13px;
  line-height: 1.7;
}

.detail_grid {
  display: grid;
  gap: 14px;
}

.detail_panel {
  padding: 16px;
  border-radius: 14px;
  border: 1px solid #eceef2;
  background: #fff;
}

.detail_title {
  margin-bottom: 12px;
  font-size: 18px;
  font-weight: 700;
}

.detail_goods {
  display: grid;
  grid-template-columns: 110px minmax(0, 1fr);
  gap: 14px;

  img {
    width: 110px;
    height: 110px;
    border-radius: 10px;
    object-fit: cover;
  }

  h3 {
    margin: 0 0 8px;
  }

  p {
    margin: 6px 0 0;
    color: #6b7280;
  }
}

.addr_list {
  display: grid;
  gap: 10px;
}

.addr_item {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  padding: 12px 14px;
  border-radius: 14px;
  background: #fafafb;
  border: 1px solid #eceef2;
  cursor: pointer;

  &.active {
    border-color: #ffccd5;
    background: #fff4f6;
  }

  span {
    display: block;
    margin-top: 6px;
    color: #6b7280;
  }
}

.pay_group {
  margin-bottom: 12px;
}

.action_row {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

@media (max-width: 1100px) {
  .hero_section,
  .goods_grid,
  .date_tabs {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .hero_section {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 900px) {
  .page_shell {
    width: calc(100% - 24px);
    padding-top: 12px;
  }

  .hero_surface,
  .panel_surface {
    border-radius: 14px;
  }

  .hero_header,
  .panel_head {
    align-items: flex-start;
    flex-direction: column;
  }
}

@media (max-width: 640px) {
  .page_shell {
    width: calc(100% - 16px);
  }

  .hero_surface {
    padding: 16px 12px 14px;
  }

  .panel_surface {
    padding: 14px 12px;
  }

  .brand_title,
  .panel_title,
  .hero_copy h1,
  .summary_value {
    font-size: 24px;
  }

  .header_actions,
  .hero_tags {
    gap: 10px;
    flex-wrap: wrap;
  }

  .date_tabs,
  .goods_grid,
  .detail_goods {
    grid-template-columns: 1fr;
  }

  .detail_goods img {
    width: 100%;
    height: auto;
    aspect-ratio: 1;
  }
}
</style>
