<script setup lang="ts">
import {computed, onBeforeUnmount, onMounted, ref, watch} from "vue";
import dayjs from "dayjs";
import {Message} from "@arco-design/web-vue";
import {
  IconApps,
  IconCalendarClock,
  IconArrowLeft,
  IconArrowRight,
  IconFire,
  IconHeart,
  IconMessage,
  IconStar,
  IconStorage,
  IconUser
} from "@arco-design/web-vue/es/icon";
import {useRouter} from "vue-router";
import {goodsCategoryListApi, goodsIndexListApi, type goodsIndexType} from "@/api/goods_api";
import {couponAcceptableListApi, couponReceiveApi, type acceptableCouponType} from "@/api/coupon_api";
import {dataUserStatisticApi} from "@/api/data_api";
import {userCouponListApi} from "@/api/coupon_api";
import {userStorei} from "@/stores/user_store";
import homeBg from "@/assets/img/home_bg.png";

interface FeatureTab {
  title: string
  key: string
  icon: "heart" | "fire" | "apps" | "storage"
  type: "recommend" | "seckill" | "category"
  category?: string
}

interface QuickEntry {
  title: string
  desc?: string
  key: string
}

const router = useRouter()
const store = userStorei()
const searchKeyword = ref("")
const goodsList = ref<goodsIndexType[]>([])
const bannerGoods = ref<goodsIndexType[]>([])
const couponList = ref<acceptableCouponType[]>([])
const loading = ref(false)
const bannerLoading = ref(false)
const couponLoading = ref(false)
const categoryTabs = ref<FeatureTab[]>([])
const activeFeatureKey = ref("recommend")
const activeBannerIndex = ref(0)
let bannerTimer: number | undefined
const userSummary = ref({
  carNum: 0,
  couponCount: 0,
  msgNum: 0,
  obligation: 0,
  pendingShipment: 0,
  pendingComment: 0,
})

const featureTabs = computed<FeatureTab[]>(() => [
  {title: "猜你喜欢", key: "recommend", icon: "heart", type: "recommend"},
  {title: "秒杀专区", key: "seckill", icon: "fire", type: "seckill"},
  ...categoryTabs.value,
])

const featureDescription = computed(() => {
  const active = featureTabs.value.find((item) => item.key === activeFeatureKey.value)
  if (!active || active.type === "recommend") {
    return "当前展示首页推荐商品列表，切换分类后会在这里直接刷新对应商品。"
  }
  return `当前展示“${active.title}”分类商品列表，点击秒杀专区会单独跳转到秒杀页面。`
})

const goodsSectionTitle = computed(() => {
  const active = featureTabs.value.find((item) => item.key === activeFeatureKey.value)
  return active?.title || "猜你喜欢"
})

const goodsEmptyText = computed(() => `暂无${goodsSectionTitle.value}商品`)
const bannerList = computed(() => bannerGoods.value.filter((item) => Boolean(item.cover)).slice(0, 5))

const categoryIcons: Array<FeatureTab["icon"]> = [
  "apps",
  "storage",
  "apps",
  "storage",
]

const quickEntries = computed<QuickEntry[]>(() => [
  {
    title: "购物车",
    desc: userSummary.value.carNum > 0 ? String(userSummary.value.carNum) : undefined,
    key: "cart",
  },
  {
    title: "消息通知",
    desc: userSummary.value.msgNum > 0 ? String(userSummary.value.msgNum) : undefined,
    key: "message",
  },
  {title: "我的收藏", key: "collect"},
  {title: "我的地址", key: "addr"},
])

function formatPrice(price?: number | null): string {
  if (price === null || price === undefined) {
    return "0.00"
  }
  return (price / 100).toFixed(price % 100 === 0 ? 0 : 2)
}

function couponTypeText(type: number): string {
  const map: Record<number, string> = {
    1: "通用优惠券",
    2: "新用户优惠券",
    3: "商品优惠券",
    4: "门类优惠券",
    5: "满减优惠券",
  }
  return map[type] || `类型 ${type}`
}

function couponExpireText(item: acceptableCouponType): string {
  if (!item.createdAt || !item.validity) {
    return "有效期以到账为准"
  }
  return `${dayjs(item.createdAt).add(item.validity, "hour").format("YYYY-MM-DD HH:mm")} 到期`
}

const couponDisplayList = computed(() => couponList.value.slice(0, 4))
const featuredGoods = computed(() => goodsList.value.slice(0, 10))
const userDisplayName = computed(() => store.userInfo.nickName || store.userInfo.userName || "佩奇")
const activeBanner = computed(() => bannerList.value[activeBannerIndex.value] || null)

function openGoodsLink(item: goodsIndexType) {
  goGoodsDetail(item.id)
}

async function loadBannerGoods() {
  bannerLoading.value = true
  try {
    const res = await goodsIndexListApi({
      page: 1,
      limit: 5,
    })
    if (res.code) {
      Message.error(res.msg)
      return
    }
    bannerGoods.value = res.data.list || []
  } catch (error) {
    console.error(error)
    Message.error("轮播商品加载失败")
  } finally {
    bannerLoading.value = false
  }
}

async function loadUserSummary() {
  if (!store.isLogin) {
    userSummary.value = {
      carNum: 0,
      couponCount: 0,
      msgNum: 0,
      obligation: 0,
      pendingShipment: 0,
      pendingComment: 0,
    }
    return
  }

  try {
    const [userRes, couponRes] = await Promise.all([
      dataUserStatisticApi(),
      userCouponListApi({page: 1, limit: 1}),
    ])

    if (userRes.code) {
      Message.warning(userRes.msg)
    }
    if (couponRes.code) {
      Message.warning(couponRes.msg)
    }

    userSummary.value = {
      carNum: userRes.code ? 0 : (userRes.data?.carNum || 0),
      couponCount: couponRes.code ? 0 : (couponRes.data?.count || 0),
      msgNum: userRes.code ? 0 : (userRes.data?.msgNum || 0),
      obligation: userRes.code ? 0 : (userRes.data?.obligation || 0),
      pendingShipment: userRes.code ? 0 : (userRes.data?.pendingShipment || 0),
      pendingComment: userRes.code ? 0 : (userRes.data?.pendingComment || 0),
    }
  } catch (error) {
    console.error(error)
    Message.error("用户数据加载失败")
    userSummary.value = {
      carNum: 0,
      couponCount: 0,
      msgNum: 0,
      obligation: 0,
      pendingShipment: 0,
      pendingComment: 0,
    }
  }
}

function stopBannerTimer() {
  if (bannerTimer) {
    window.clearInterval(bannerTimer)
    bannerTimer = undefined
  }
}

function startBannerTimer() {
  stopBannerTimer()
  if (bannerList.value.length <= 1) {
    return
  }
  bannerTimer = window.setInterval(() => {
    activeBannerIndex.value = (activeBannerIndex.value + 1) % bannerList.value.length
  }, 3500)
}

function switchBanner(index: number) {
  if (!bannerList.value.length) {
    return
  }
  activeBannerIndex.value = index % bannerList.value.length
}

function prevBanner() {
  if (!bannerList.value.length) {
    return
  }
  activeBannerIndex.value = (activeBannerIndex.value - 1 + bannerList.value.length) % bannerList.value.length
}

function nextBanner() {
  if (!bannerList.value.length) {
    return
  }
  activeBannerIndex.value = (activeBannerIndex.value + 1) % bannerList.value.length
}

function handleSearch(key?: string) {
  const value = (key ?? searchKeyword.value).trim()
  router.push({
    name: "web_search",
    query: value ? {key: value} : undefined,
  })
}

async function loadGoods(category?: string) {
  loading.value = true
  try {
    const res = await goodsIndexListApi({
      page: 1,
      limit: 10,
      category: category || undefined,
    })
    if (res.code) {
      Message.error(res.msg)
      return
    }
    goodsList.value = res.data.list || []
  } catch (error) {
    console.error(error)
    Message.error("商品加载失败")
  } finally {
    loading.value = false
  }
}

async function loadCategories() {
  try {
    const res = await goodsCategoryListApi()
    if (res.code) {
      Message.warning(res.msg)
      categoryTabs.value = []
      return
    }
    categoryTabs.value = (res.data || []).map((item, index) => ({
      title: item.label,
      key: `category-${item.value}`,
      icon: categoryIcons[index % categoryIcons.length],
      type: "category",
      category: String(item.value),
    }))
  } catch (error) {
    console.error(error)
    Message.warning("商品分类加载失败")
    categoryTabs.value = []
  }
}

async function loadCoupons() {
  couponLoading.value = true
  try {
    const res = await couponAcceptableListApi({page: 1, limit: 4})
    if (res.code) {
      Message.warning(res.msg)
      couponList.value = []
      return
    }
    couponList.value = res.data.list || []
  } catch (error) {
    console.error(error)
    Message.error("优惠券加载失败")
  } finally {
    couponLoading.value = false
  }
}

async function receiveCoupon(item: acceptableCouponType) {
  if (!store.isLogin) {
    Message.warning("请先登录后再领取优惠券")
    store.openLoginModal("/")
    return
  }
  const res = await couponReceiveApi({couponID: item.id})
  if (res.code) {
    Message.error(res.msg)
    return
  }
  Message.success("优惠券领取成功")
  await loadCoupons()
}

async function selectFeature(item: FeatureTab) {
  if (item.type === "seckill") {
    router.push({name: "web_sec_kill"})
    return
  }

  activeFeatureKey.value = item.key
  await loadGoods(item.type === "category" ? item.category : undefined)
}

function refreshFeaturedGoods() {
  const active = featureTabs.value.find((item) => item.key === activeFeatureKey.value)
  void loadGoods(active?.type === "category" ? active.category : undefined)
}

function goGoodsDetail(id: number) {
  router.push({
    name: "web_goods_detail",
    params: {id},
  })
}

function openQuickEntry(key: string) {
  const routeMap: Record<string, () => void> = {
    cart: () => router.push({name: "web_cart"}),
    message: () => router.push({name: "web_user_center_msg"}),
    collect: () => router.push({name: "web_user_center_collect"}),
    addr: () => router.push({name: "web_user_center_addr"}),
  }
  routeMap[key]?.()
}

function openUserShortcut(type: "collect" | "look" | "cart") {
  if (type === "collect") {
    router.push({name: "web_user_center_collect"})
    return
  }
  if (type === "look") {
    router.push({name: "web_user_center_look"})
    return
  }
  router.push({name: "web_cart"})
}

function openLoginModal() {
  store.openLoginModal("/")
}

watch(bannerList, () => {
  activeBannerIndex.value = 0
  startBannerTimer()
}, {immediate: true})

watch(() => store.isLogin, () => {
  void loadUserSummary()
}, {immediate: true})

onBeforeUnmount(() => {
  stopBannerTimer()
})

onMounted(() => {
  loadCategories()
  loadBannerGoods()
  loadGoods()
  loadCoupons()
  void loadUserSummary()
})
</script>

<template>
  <div class="web_home_view">
    <div class="page_shell">
      <section class="home_surface">
        <header class="home_header">
          <div class="header_brand">
            <router-link class="brand_block" to="/">
              <div class="brand_title">枫枫商城</div>
              <div class="brand_subtitle">享受快人一步</div>
            </router-link>
          </div>

          <div class="header_search">
            <a-input
              v-model="searchKeyword"
              allow-clear
              placeholder="搜索你需要的商品"
              @press-enter="handleSearch()"
            />
            <a-button type="primary" @click="handleSearch()">搜索</a-button>
          </div>

          <div class="header_quick_links">
            <button
              v-for="item in quickEntries"
              :key="item.key"
              class="quick_link"
              type="button"
              @click="openQuickEntry(item.key)"
            >
              <span>{{ item.title }}</span>
              <em v-if="item.desc" class="quick_badge">{{ item.desc }}</em>
            </button>
          </div>
        </header>

        <section class="hero_section">
          <div class="hero_main">
            <div class="hero_banner_surface">
              <a-spin :loading="bannerLoading" tip="加载中...">
                <div v-if="activeBanner" class="hero_banner_stage">
                  <transition name="banner_fade" mode="out-in">
                    <article
                      :key="activeBanner.id"
                      class="hero_banner_card"
                      role="button"
                      tabindex="0"
                      @click="goGoodsDetail(activeBanner.id)"
                      @keydown.enter.prevent="goGoodsDetail(activeBanner.id)"
                      @keydown.space.prevent="goGoodsDetail(activeBanner.id)"
                    >
                      <img :src="activeBanner.cover || homeBg" :alt="activeBanner.title">
                    </article>
                  </transition>

                  <button
                    v-if="bannerList.length > 1"
                    type="button"
                    class="hero_banner_arrow hero_banner_arrow_left"
                    aria-label="上一张"
                    @click="prevBanner"
                  >
                    <IconArrowLeft/>
                  </button>
                  <button
                    v-if="bannerList.length > 1"
                    type="button"
                    class="hero_banner_arrow hero_banner_arrow_right"
                    aria-label="下一张"
                    @click="nextBanner"
                  >
                    <IconArrowRight/>
                  </button>

                  <div v-if="bannerList.length > 1" class="hero_banner_dots" aria-label="轮播切换">
                    <button
                      v-for="(item, index) in bannerList"
                      :key="item.id"
                      type="button"
                      class="hero_banner_dot"
                      :class="{active: index === activeBannerIndex}"
                      :aria-label="`切换到 ${item.title}`"
                      @click="switchBanner(index)"
                    ></button>
                  </div>
                </div>

                <div v-else class="hero_banner_empty">
                  <img :src="homeBg" alt="猜你喜欢">
                </div>
              </a-spin>
            </div>
          </div>

          <div class="hero_coupon">
            <div class="panel_head compact">
              <h2>优惠券领取</h2>
              <a-link @click="router.push({name: 'web_user_center_coupon'})">更多</a-link>
            </div>

            <a-spin :loading="couponLoading" tip="加载中...">
              <div v-if="couponDisplayList.length" class="coupon_compact_grid">
                <article
                  v-for="item in couponDisplayList"
                  :key="item.id"
                  class="coupon_compact_card"
                >
                  <div class="coupon_value_wrap">
                    <div class="coupon_symbol">￥</div>
                    <div class="coupon_value">{{ formatPrice(item.couponPrice) }}</div>
                  </div>
                  <div class="coupon_meta">
                    <div class="coupon_name">{{ item.title || couponTypeText(item.type) }}</div>
                    <div class="coupon_deadline">{{ couponExpireText(item) }}</div>
                    <div class="coupon_tip">满 {{ formatPrice(item.threshold) }} 可用</div>
                  </div>
                  <a-button
                    class="coupon_btn"
                    :disabled="item.isReceive"
                    @click="receiveCoupon(item)"
                  >
                    {{ item.isReceive ? "已领取" : "领取" }}
                  </a-button>
                </article>
              </div>
              <a-empty v-else description="暂无可领取优惠券"/>
            </a-spin>
          </div>

          <aside class="hero_user">
            <div class="user_profile">
              <div class="user_avatar">
                <a-avatar :size="44" :image-url="store.userInfo.avatar || '/logo.png'">
                  <IconUser/>
                </a-avatar>
              </div>
              <div class="user_intro">
                <div class="user_greet">上午好<span v-if="store.isLogin">，{{ userDisplayName }}</span></div>
                <div class="user_state">{{ store.isLogin ? "欢迎回来" : "请先登录" }}</div>
              </div>
            </div>

            <a-button
              v-if="!store.isLogin"
              class="login_primary_btn"
              type="primary"
              long
              @click="openLoginModal"
            >
              立即登录
            </a-button>

            <div class="user_stats">
              <div class="user_stat">
                <span>优惠券</span>
                <strong>{{ userSummary.couponCount }}</strong>
              </div>
              <div class="user_stat">
                <span>待付款</span>
                <strong>{{ userSummary.obligation }}</strong>
              </div>
              <div class="user_stat">
                <span>待发货</span>
                <strong>{{ userSummary.pendingShipment }}</strong>
              </div>
              <div class="user_stat">
                <span>待评价</span>
                <strong>{{ userSummary.pendingComment }}</strong>
              </div>
            </div>

            <div class="user_links">
              <button type="button" @click="openUserShortcut('collect')">
                <IconStar/>
                <span>我的收藏</span>
              </button>
              <button type="button" @click="openUserShortcut('look')">
                <IconCalendarClock/>
                <span>我的足迹</span>
              </button>
              <button type="button" @click="openUserShortcut('cart')">
                <IconStorage/>
                <span>购物车</span>
              </button>
            </div>
          </aside>
        </section>

      </section>

      <section class="goods_section">
        <div class="feature_filter_surface">
          <div class="feature_tabs">
            <button
              v-for="item in featureTabs"
              :key="item.key"
              class="feature_tab"
              :class="{active: item.key === activeFeatureKey}"
              type="button"
              @click="selectFeature(item)"
            >
              <IconHeart v-if="item.icon === 'heart'" class="feature_icon"/>
              <IconFire v-else-if="item.icon === 'fire'" class="feature_icon"/>
              <IconApps v-else-if="item.icon === 'apps'" class="feature_icon"/>
              <IconStorage v-else class="feature_icon"/>
              <span>{{ item.title }}</span>
            </button>
          </div>
        </div>

        <div class="panel_head goods_head">
          <div>
            <h2>{{ goodsSectionTitle }}</h2>
          </div>
          <a-link @click="refreshFeaturedGoods">刷新商品</a-link>
        </div>

        <a-spin :loading="loading" tip="加载中...">
          <div v-if="featuredGoods.length" class="goods_grid">
            <article class="goods_card" v-for="item in featuredGoods" :key="item.id" @click="openGoodsLink(item)">
              <div class="goods_cover">
                <img :src="item.cover" :alt="item.title">
              </div>
              <div class="goods_body">
                <div class="goods_title">{{ item.title }}</div>
                <div class="goods_price">￥ {{ formatPrice(item.price) }}</div>
                <div class="goods_meta">{{ item.salesNum }} 人购买</div>
              </div>
            </article>
          </div>
          <a-empty v-else :description="goodsEmptyText"/>
        </a-spin>
      </section>
    </div>
  </div>
</template>

<style scoped lang="less">
.web_home_view {
  color: var(--color-text-1);
  background: #fff;
}

.page_shell {
  width: min(1180px, calc(100% - 48px));
  margin: 0 auto;
  padding: 22px 0 36px;
}

.home_surface {
  background: #fff;
  border-radius: 18px;
  padding: 26px 22px 24px;
  box-shadow: 0 20px 45px rgba(17, 24, 39, .06);
}

.home_header {
  display: grid;
  grid-template-columns: 162px minmax(0, 1fr) auto;
  gap: 20px;
  align-items: center;
}

.brand_block {
  display: inline-block;
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

.header_search {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 86px;
  align-items: center;
  min-height: 46px;
  border-radius: 999px;
  border: 2px solid #ff8fa0;
  overflow: hidden;
  background: #fff;

  :deep(.arco-input-wrapper) {
    height: 42px;
    border: 0;
    box-shadow: none;
    padding-left: 14px;
    background: transparent;
  }

  :deep(.arco-input) {
    font-size: 13px;
  }

  :deep(.arco-btn) {
    height: 42px;
    border-radius: 999px;
    margin: 2px;
    font-weight: 600;
    background: linear-gradient(135deg, #ff7a8f, #ff627a);
  }
}

.header_quick_links {
  display: flex;
  align-items: center;
  gap: 18px;
  justify-content: flex-end;
  flex-wrap: wrap;
}

.quick_link {
  border: 0;
  background: transparent;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 0;
  color: #4b5563;
  font-size: 12px;
  cursor: pointer;
}

.quick_badge {
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  border-radius: 999px;
  display: inline-grid;
  place-items: center;
  color: #fff;
  background: #ff6b7f;
  font-style: normal;
  font-size: 11px;
  font-weight: 600;
}

.hero_section {
  margin-top: 28px;
  display: grid;
  grid-template-columns: 520px 360px minmax(252px, 1fr);
  gap: 12px;
  align-items: stretch;
}

.hero_main,
.hero_coupon,
.hero_user {
  min-width: 0;
}

.hero_main {
  width: 520px;
}

.hero_banner_surface,
.hero_coupon,
.hero_user {
  border: 1px solid #eceef2;
  border-radius: 12px;
  background: #fff;
}

.hero_banner_surface {
  width: 520px;
  aspect-ratio: 16 / 9;
  padding: 14px;
  background: linear-gradient(180deg, #fff8fa, #ffffff 62%);
  overflow: hidden;

  :deep(.arco-spin),
  :deep(.arco-spin-children) {
    width: 100%;
    height: 100%;
  }
}

.hero_banner_stage {
  width: 100%;
  height: 100%;
  position: relative;
}

.hero_banner_card {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  border-radius: 12px;
  cursor: pointer;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
}

.banner_fade-enter-active,
.banner_fade-leave-active {
  transition: opacity .35s ease, transform .35s ease;
}

.banner_fade-enter-from,
.banner_fade-leave-to {
  opacity: 0;
  transform: scale(.985);
}

.hero_banner_dots {
  position: absolute;
  left: 16px;
  right: 16px;
  bottom: 16px;
  display: flex;
  justify-content: center;
  gap: 8px;
  pointer-events: none;
}

.hero_banner_dot {
  width: 8px;
  height: 8px;
  border: 0;
  border-radius: 999px;
  background: rgba(255, 255, 255, .55);
  cursor: pointer;
  pointer-events: auto;
  transition: width .2s ease, background-color .2s ease;

  &.active {
    width: 22px;
    background: #ff5f74;
  }
}

.hero_banner_arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 34px;
  height: 34px;
  border: 0;
  border-radius: 999px;
  display: grid;
  place-items: center;
  color: #fff;
  background: rgba(15, 23, 42, .34);
  backdrop-filter: blur(4px);
  cursor: pointer;
  z-index: 2;
  transition: background-color .18s ease, transform .18s ease, opacity .18s ease;

  :deep(svg) {
    font-size: 16px;
  }

  &:hover {
    background: rgba(15, 23, 42, .48);
  }

  &:active {
    transform: translateY(-50%) scale(.96);
  }
}

.hero_banner_arrow_left {
  left: 12px;
}

.hero_banner_arrow_right {
  right: 12px;
}

.hero_banner_empty {
  height: 100%;
  border-radius: 12px;
  overflow: hidden;
  position: relative;
  background: linear-gradient(135deg, #ffe7eb, #fff6f7);

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
}

.feature_tabs {
  display: flex;
  align-items: center;
  gap: 24px;
  flex-wrap: wrap;
}

.feature_tab {
  border: 0;
  background: transparent;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 0;
  color: #6b7280;
  font-size: 15px;
  cursor: pointer;
  white-space: nowrap;

  &.active {
    color: #ff647c;
    font-weight: 700;
  }
}

.feature_icon {
  font-size: 16px;
  color: #ff647c;
}

.feature_filter_surface {
  margin-bottom: 16px;
  padding: 10px 0;
  border-radius: 0;
  background: #fff;
  display: inline-flex;
  max-width: 100%;
}

.hero_coupon,
.hero_user {
  padding: 16px;
}

.panel_head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;

  h2 {
    margin: 0;
    font-size: 15px;
    font-weight: 700;
  }

  :deep(.arco-link) {
    color: #ff647c;
    font-size: 12px;
    font-weight: 600;
    transition: color .18s ease, transform .18s ease;
  }

  :deep(.arco-link:hover) {
    color: #ff5370;
  }

  :deep(.arco-link:active) {
    color: #ef4f75;
    transform: translateY(1px);
  }
}

.panel_head.compact {
  margin-bottom: 12px;
}

.coupon_compact_grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.coupon_compact_card {
  min-height: 82px;
  padding: 12px;
  border-radius: 10px;
  background: linear-gradient(180deg, #fffafb, #fff);
  border: 1px solid #ffd8de;
  display: grid;
  grid-template-columns: 58px minmax(0, 1fr) auto;
  gap: 10px;
  align-items: center;

  &.placeholder {
    border-style: dashed;
  }
}

.coupon_value_wrap {
  min-width: 0;
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 2px;
  color: #ff5f74;
  line-height: 1;
}

.coupon_symbol {
  font-size: 14px;
  font-weight: 700;
}

.coupon_value {
  font-size: 31px;
  line-height: 1;
  font-weight: 700;
}

.coupon_meta {
  min-width: 0;
  display: grid;
  gap: 4px;
}

.coupon_name {
  color: #374151;
  font-size: 14px;
  font-weight: 600;
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.coupon_deadline,
.coupon_tip {
  font-size: 11px;
  line-height: 1.35;
  color: #9ca3af;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.coupon_btn {
  flex-shrink: 0;
  min-width: 52px;
  height: 28px;
  padding: 0 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
}

.hero_user {
  display: grid;
  grid-template-rows: auto auto auto;
  gap: 14px;
}

.user_profile {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user_avatar {
  width: 48px;
  height: 48px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  border: 1px solid #ffd4db;
  color: #ff6f84;
}

.user_greet {
  font-size: 16px;
  font-weight: 700;
  color: #374151;
}

.user_state {
  margin-top: 4px;
  color: #9ca3af;
  font-size: 12px;
}

.login_primary_btn {
  height: 34px;
  border-radius: 8px;
  font-weight: 600;
  background: linear-gradient(135deg, #ff748a, #ff5c75);
}

.user_stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
}

.user_stat {
  text-align: center;
  padding: 10px 0;
  border-radius: 10px;
  background: #fafafb;

  span {
    display: block;
    color: #6b7280;
    font-size: 11px;
  }

  strong {
    display: block;
    margin-top: 5px;
    color: #ff637a;
    font-size: 24px;
    line-height: 1;
    font-weight: 700;
  }
}

.user_links {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;

  button {
    min-height: 62px;
    border: 1px solid #eceef2;
    border-radius: 10px;
    background: #fff;
    display: grid;
    justify-items: center;
    align-content: center;
    gap: 6px;
    color: #4b5563;
    cursor: pointer;

    span {
      font-size: 11px;
    }
  }
}

.goods_section {
  margin-top: 18px;
  padding: 18px 18px 10px;
  border-radius: 18px;
  background: #fff;
  box-shadow: 0 20px 45px rgba(17, 24, 39, .05);
}

.goods_head {
  margin-bottom: 10px;
}

.goods_grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 12px;
}

.goods_card {
  overflow: hidden;
  border: 1px solid #eceef2;
  border-radius: 8px;
  background: #fff;
  cursor: pointer;
  transition: transform .18s ease, box-shadow .18s ease, border-color .18s ease;

  &:hover {
    transform: translateY(-2px);
    border-color: #ffd2da;
    box-shadow: 0 14px 28px rgba(17, 24, 39, .08);
  }
}

.goods_cover {
  aspect-ratio: 16 / 9;
  background: #f7f8fa;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
}

.goods_body {
  padding: 10px 10px 12px;
}

.goods_title {
  min-height: 34px;
  color: #374151;
  font-size: 12px;
  line-height: 1.45;
  display: -webkit-box;
  overflow: hidden;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.goods_price {
  margin-top: 9px;
  color: #ff637a;
  font-size: 15px;
  font-weight: 700;
}

.goods_meta {
  margin-top: 6px;
  color: #9ca3af;
  font-size: 11px;
}

@media (max-width: 1180px) {
  .hero_section {
    grid-template-columns: 1fr;
  }

  .hero_main,
  .hero_banner_surface {
    width: 100%;
  }

  .goods_grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

@media (max-width: 900px) {
  .page_shell {
    width: calc(100% - 24px);
    padding-top: 12px;
  }

  .home_surface,
  .goods_section {
    border-radius: 14px;
  }

  .home_header {
    grid-template-columns: 1fr;
  }

  .header_quick_links {
    flex-wrap: wrap;
    gap: 12px 16px;
  }

  .hero_banner_surface {
    height: auto;
  }

  .hero_banner_stage,
  .hero_banner_empty {
    height: 100%;
    aspect-ratio: 16 / 9;
  }

  .goods_grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .page_shell {
    width: calc(100% - 16px);
  }

  .home_surface {
    padding: 16px 12px 18px;
  }

  .brand_title {
    font-size: 24px;
  }

  .header_search {
    grid-template-columns: minmax(0, 1fr) 74px;
  }

  .feature_tabs {
    gap: 14px;
    overflow-x: auto;
  }

  .hero_banner_dots {
    left: 14px;
    right: 14px;
    bottom: 12px;
  }

  .coupon_compact_grid,
  .user_stats,
  .user_links,
  .goods_grid {
    grid-template-columns: 1fr;
  }
}
</style>
