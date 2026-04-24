<script setup lang="ts">
import {computed, onMounted, ref, watch} from "vue";
import {Message} from "@arco-design/web-vue";
import F_nav from "@/components/web/f_nav.vue";
import F_main from "@/components/web/f_main.vue";
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
  return value.replace("T", " ").replace(/\.\d+Z?$/, "")
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
  if (stage === "not_started") return "未开始"
  if (stage === "ended") return "已结束"
  return "抢购中"
}

function stageTagType(stage: SecKillStage): "arcoblue" | "orange" | "red" {
  if (stage === "not_started") return "arcoblue"
  if (stage === "ended") return "orange"
  return "red"
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
    <f_nav no-scroll/>
    <f_main>
      <section class="hero">
        <div class="hero_copy">
          <div class="eyebrow">FLASH SALE</div>
          <h1>秒杀专区</h1>
          <p>
            先选择一个秒杀码段，再查看对应商品列表。点击“立即抢购”会先拿到购买凭证，再进入下单确认。
          </p>
        </div>

        <div class="hero_card">
          <div class="hero_card_title">当前秒杀码段</div>
          <strong>{{ selectedDateLabel }}</strong>
          <span>共 {{ goodsList.length }} 个商品</span>
          <a-button long type="primary" @click="router.push({name: 'web_home'})">返回首页</a-button>
        </div>
      </section>

      <section class="panel">
        <div class="section_head">
          <div>
            <h2>秒杀码段</h2>
            <span>接口来自 <code>/api/sec_kill/date</code>，没有数据时先回到后台创建秒杀</span>
          </div>
          <a-button size="small" @click="loadDateList">刷新日期</a-button>
        </div>

        <a-spin :loading="dateLoading" tip="加载日期中...">
          <div v-if="dateList.length" class="date_tabs">
            <button
              v-for="item in dateList"
              :key="item.date"
              class="date_tab"
              :class="{active: selectedDateText === item.date}"
              @click="selectedDateText = item.date"
            >
              {{ item.date }}
            </button>
          </div>
          <a-empty v-else description="暂无秒杀码段">
            <template #image>
              <a-result status="info" title="暂无秒杀码段" subtitle="可以先到后台活动管理创建秒杀活动。"/>
            </template>
          </a-empty>
        </a-spin>
      </section>

      <section class="panel">
        <div class="section_head">
          <div>
            <h2>秒杀商品</h2>
            <span>按选中的时间段展示商品和库存状态</span>
          </div>
          <a-button size="small" @click="loadGoods">刷新商品</a-button>
        </div>

        <a-spin :loading="loading" tip="加载商品中...">
          <div v-if="goodsList.length" class="goods_grid">
            <article v-for="item in goodsList" :key="item.goodsID" class="goods_card">
              <div class="goods_cover">
                <img :src="item.cover" :alt="item.title">
                <a-tag class="stage_tag" :color="stageTagType(getStage(item))">
                  {{ stageText(getStage(item)) }}
                </a-tag>
              </div>
              <div class="goods_body">
                <h3>{{ item.title }}</h3>
                <div class="price_row">
                  <strong>￥{{ formatPrice(item.killPrice) }}</strong>
                  <span>原价 ￥{{ formatPrice(item.price) }}</span>
                </div>
                <div class="meta_row">
                  <span>库存 {{ item.killInventory }}</span>
                  <span>已购 {{ item.buyNum }}</span>
                </div>
                <div class="time_row">
                  <span>开始 {{ formatTime(item.startTime) }}</span>
                  <span>结束 {{ formatTime(item.endTime) }}</span>
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
          <a-empty v-else description="当前秒杀码段暂无商品"/>
        </a-spin>
      </section>
    </f_main>

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
            <div class="panel_title">商品信息</div>
            <div class="detail_goods">
              <img :src="detailInfo.cover" :alt="detailInfo.title">
              <div>
                <h3>{{ detailInfo.title }}</h3>
                <p>秒杀码段：{{ selectedDateLabel }}</p>
                <p>原价 ￥{{ formatPrice(detailInfo.price) }}，秒杀价 ￥{{ formatPrice(detailInfo.killPrice) }}</p>
                <p>库存 {{ detailInfo.killInventory }}，已购 {{ detailInfo.buyNum }}</p>
              </div>
            </div>
          </section>

          <section class="detail_panel">
            <div class="panel_title">收货地址</div>
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
            <div class="panel_title">支付信息</div>
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
  color: var(--color-text-1);
}

.hero {
  margin: 20px max(16px, calc((100% - 1240px) / 2)) 20px;
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) 360px;
  gap: 16px;
}

.hero_copy,
.hero_card,
.panel,
.detail_panel {
  border-radius: 24px;
  border: 1px solid var(--color-border-2);
  background: var(--color-bg-1);
  box-shadow: 0 10px 40px rgba(15, 23, 42, .04);
}

.hero_copy {
  padding: 30px;
  background:
      radial-gradient(circle at 18% 18%, rgba(255, 93, 114, .04), transparent 22%),
      radial-gradient(circle at 84% 14%, rgba(29, 78, 216, .04), transparent 20%),
      linear-gradient(180deg, #fff 0%, #fbfcfe 100%);
}

.eyebrow {
  color: #ff5d72;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: .08em;
}

.hero_copy h1 {
  margin: 10px 0 12px;
  font-size: 44px;
  line-height: 1.1;
}

.hero_copy p {
  margin: 0;
  color: var(--color-text-2);
  line-height: 1.85;
}

.hero_card {
  padding: 28px;
  display: grid;
  gap: 12px;
  align-content: start;
  background: #fff;
}

.hero_card_title {
  color: var(--color-text-2);
  font-size: 14px;
}

.hero_card strong {
  font-size: 18px;
  word-break: break-all;
}

.hero_card span {
  color: var(--color-text-2);
  font-size: 14px;
}

.panel {
  margin: 0 max(16px, calc((100% - 1240px) / 2)) 20px;
  padding: 28px;
}

.section_head {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-end;
  margin-bottom: 18px;
}

.section_head h2 {
  margin: 0;
  font-size: 28px;
}

.section_head span {
  display: block;
  margin-top: 8px;
  color: var(--color-text-2);
}

.date_tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  padding-top: 4px;
}

.date_tab {
  padding: 12px 16px;
  border-radius: 999px;
  border: 1px solid var(--color-border-2);
  background: var(--color-fill-1);
  color: var(--color-text-2);
  cursor: pointer;
  transition: all .18s ease;

  &.active {
    background: rgba(255, 93, 114, .12);
    border-color: rgba(255, 93, 114, .26);
    color: #ff5d72;
    font-weight: 700;
  }
}

.goods_grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}

.goods_card {
  overflow: hidden;
  border-radius: 24px;
  border: 1px solid var(--color-border-2);
  background: var(--color-fill-1);
}

.goods_cover {
  position: relative;
  aspect-ratio: 1;
  background: #fff;
}

.goods_cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.stage_tag {
  position: absolute;
  left: 12px;
  top: 12px;
}

.goods_body {
  padding: 16px;
}

.goods_body h3 {
  margin: 0;
  font-size: 17px;
  line-height: 1.6;
  min-height: 54px;
}

.price_row,
.meta_row,
.time_row {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 8px;
  margin-top: 10px;
}

.price_row strong {
  color: #e11d48;
  font-size: 22px;
}

.price_row span,
.meta_row,
.time_row {
  color: var(--color-text-2);
}

.meta_row,
.time_row {
  font-size: 13px;
  line-height: 1.6;
}

.detail_grid {
  display: grid;
  gap: 14px;
}

.detail_panel {
  padding: 18px;
  background: #fff;
}

.panel_title {
  margin-bottom: 12px;
  font-size: 18px;
  font-weight: 800;
}

.detail_goods {
  display: grid;
  grid-template-columns: 120px minmax(0, 1fr);
  gap: 14px;
}

.detail_goods img {
  width: 120px;
  height: 120px;
  border-radius: 16px;
  object-fit: cover;
}

.detail_goods h3 {
  margin: 0 0 8px;
}

.detail_goods p {
  margin: 6px 0 0;
  color: var(--color-text-2);
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
  border-radius: 16px;
  background: var(--color-fill-1);
  border: 1px solid var(--color-border-2);
  cursor: pointer;
}

.addr_item.active {
  border-color: rgba(255, 93, 114, .35);
  background: rgba(255, 93, 114, .08);
}

.addr_item span {
  color: var(--color-text-2);
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
  .hero,
  .goods_grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .hero,
  .panel {
    margin-left: 16px;
    margin-right: 16px;
  }

  .hero {
    grid-template-columns: 1fr;
  }

  .hero_copy {
    padding: 22px;
  }

  .hero_copy h1 {
    font-size: 34px;
  }

  .section_head {
    align-items: flex-start;
    flex-direction: column;
  }

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
