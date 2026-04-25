<script setup lang="ts">
import {computed, onMounted, ref} from "vue";
import dayjs from "dayjs";
import {Message} from "@arco-design/web-vue";
import {
  IconApps,
  IconCalendarClock,
  IconCompass,
  IconFire,
  IconHeart,
  IconLocation,
  IconMessage,
  IconStar,
  IconStorage,
  IconUser
} from "@arco-design/web-vue/es/icon";
import {useRouter} from "vue-router";
import F_footer from "@/components/web/f_footer.vue";
import {goodsIndexListApi, type goodsIndexType} from "@/api/goods_api";
import {couponAcceptableListApi, couponReceiveApi, type acceptableCouponType} from "@/api/coupon_api";
import {userStorei} from "@/stores/user_store";
import homeBg from "@/assets/img/home_bg.png";

interface FeatureTab {
  title: string
  key: string
  icon: "heart" | "fire" | "apps" | "storage"
}

interface QuickEntry {
  title: string
  desc: string
  key: string
}

const router = useRouter()
const store = userStorei()
const searchKeyword = ref("")
const goodsList = ref<goodsIndexType[]>([])
const couponList = ref<acceptableCouponType[]>([])
const loading = ref(false)
const couponLoading = ref(false)

const featureTabs: FeatureTab[] = [
  {title: "猜你喜欢", key: "推荐", icon: "heart"},
  {title: "秒杀专区", key: "秒杀", icon: "fire"},
  {title: "数码产品", key: "数码家电", icon: "apps"},
  {title: "办公文具", key: "办公", icon: "storage"},
]

const quickEntries: QuickEntry[] = [
  {title: "购物车", desc: "12", key: "cart"},
  {title: "消息通知", desc: "3", key: "message"},
  {title: "我的收藏", desc: "", key: "collect"},
  {title: "我的地址", desc: "", key: "addr"},
]

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

const couponSlots = computed(() => Array.from({length: 4}, (_, index) => couponList.value[index] || null))
const heroGoods = computed(() => goodsList.value.slice(0, 4))
const featuredGoods = computed(() => goodsList.value.slice(0, 10))
const userDisplayName = computed(() => store.userInfo.nickName || store.userInfo.userName || "佩奇")

function openGoodsLink(item: goodsIndexType) {
  goGoodsDetail(item.id)
}

async function loadGoods() {
  loading.value = true
  try {
    const res = await goodsIndexListApi({page: 1, limit: 10})
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

function handleSearch(key?: string) {
  const value = (key ?? searchKeyword.value).trim()
  router.push({
    name: "web_search",
    query: value ? {key: value} : undefined,
  })
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

onMounted(() => {
  loadGoods()
  loadCoupons()
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
            <div class="hero_showcase">
              <div class="hero_primary">
                <img
                  :src="heroGoods[0]?.cover || homeBg"
                  :alt="heroGoods[0]?.title || '枫枫商城推荐'"
                >
                <div class="hero_primary_glow"></div>
              </div>
              <div class="hero_secondary">
                <article
                  v-for="(item, index) in heroGoods.slice(1)"
                  :key="item.id"
                  class="hero_side_card"
                  :class="`card-${index + 1}`"
                  @click="openGoodsLink(item)"
                >
                  <img :src="item.cover" :alt="item.title">
                </article>
                <article
                  v-if="heroGoods.length < 4"
                  class="hero_side_card placeholder"
                >
                  <img :src="homeBg" alt="更多推荐">
                </article>
              </div>
            </div>

            <div class="feature_tabs">
              <button
                v-for="item in featureTabs"
                :key="item.key"
                class="feature_tab"
                :class="{active: item.key === '推荐'}"
                type="button"
                @click="item.key === '秒杀' ? router.push({name: 'web_sec_kill'}) : handleSearch(item.key)"
              >
                <IconHeart v-if="item.icon === 'heart'" class="feature_icon"/>
                <IconFire v-else-if="item.icon === 'fire'" class="feature_icon"/>
                <IconApps v-else-if="item.icon === 'apps'" class="feature_icon"/>
                <IconStorage v-else class="feature_icon"/>
                <span>{{ item.title }}</span>
              </button>
            </div>
          </div>

          <div class="hero_coupon">
            <div class="panel_head compact">
              <h2>优惠券领取</h2>
              <a-link @click="router.push({name: 'web_user_center_coupon'})">更多</a-link>
            </div>

            <a-spin :loading="couponLoading" tip="加载中...">
              <div class="coupon_compact_grid">
                <article
                  v-for="(item, index) in couponSlots"
                  :key="item?.id ?? `coupon-placeholder-${index}`"
                  class="coupon_compact_card"
                  :class="{placeholder: !item}"
                >
                  <template v-if="item">
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
                  </template>
                  <template v-else>
                    <div class="coupon_value_wrap">
                      <div class="coupon_symbol">￥</div>
                      <div class="coupon_value placeholder_value">1</div>
                    </div>
                    <div class="coupon_meta">
                      <div class="coupon_name">无门槛优惠券</div>
                      <div class="coupon_deadline">持续更新中</div>
                      <div class="coupon_tip">全场通用</div>
                    </div>
                    <a-button class="coupon_btn placeholder_btn" @click="router.push({name: 'web_user_center_coupon'})">
                      查看
                    </a-button>
                  </template>
                </article>
              </div>
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
                <strong>7</strong>
              </div>
              <div class="user_stat">
                <span>待付款</span>
                <strong>2</strong>
              </div>
              <div class="user_stat">
                <span>待发货</span>
                <strong>3</strong>
              </div>
              <div class="user_stat">
                <span>待评价</span>
                <strong>4</strong>
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

            <div class="user_address">
              <IconLocation/>
              <span>收货地址</span>
            </div>
          </aside>
        </section>
      </section>

      <section class="goods_section">
        <div class="panel_head goods_head">
          <div>
            <h2>猜你喜欢</h2>
          </div>
          <a-link @click="loadGoods">刷新商品</a-link>
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
          <a-empty v-else description="暂无推荐商品"/>
        </a-spin>
      </section>
    </div>
    <f_footer/>
  </div>
</template>

<style scoped lang="less">
.web_home_view {
  color: var(--color-text-1);
  background:
    linear-gradient(180deg, #f5f5f6 0, #f5f5f6 520px, #f2f3f5 520px, #f2f3f5 100%);
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
  grid-template-columns: minmax(0, 2.05fr) minmax(280px, 1.28fr) minmax(240px, .9fr);
  gap: 12px;
  align-items: stretch;
}

.hero_main,
.hero_coupon,
.hero_user {
  min-width: 0;
}

.hero_showcase,
.hero_coupon,
.hero_user {
  border: 1px solid #eceef2;
  border-radius: 12px;
  background: #fff;
}

.hero_showcase {
  height: 300px;
  padding: 14px;
  display: grid;
  grid-template-columns: minmax(0, 1.6fr) 170px;
  gap: 12px;
  background: linear-gradient(180deg, #fff8fa, #ffffff 62%);
  overflow: hidden;
}

.hero_primary,
.hero_side_card {
  position: relative;
  height: 100%;
  overflow: hidden;
  border-radius: 12px;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
}

.hero_primary {
  min-height: 0;
  background: linear-gradient(135deg, #ffe7eb, #fff6f7);
}

.hero_primary_glow {
  position: absolute;
  inset: auto -40px -55px auto;
  width: 180px;
  height: 180px;
  border-radius: 999px;
  background: radial-gradient(circle, rgba(255, 107, 127, .16), rgba(255, 107, 127, 0));
}

.hero_secondary {
  display: grid;
  grid-template-rows: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.hero_side_card {
  cursor: pointer;
  background: #f7f8fa;

  &.placeholder {
    cursor: default;
  }
}

.feature_tabs {
  display: flex;
  align-items: center;
  gap: 22px;
  padding: 16px 4px 0;
}

.feature_tab {
  border: 0;
  background: transparent;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 0;
  color: #6b7280;
  font-size: 12px;
  cursor: pointer;

  &.active {
    color: #ff647c;
    font-weight: 600;
  }
}

.feature_icon {
  font-size: 14px;
  color: #ff647c;
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
  min-height: 84px;
  padding: 10px 10px 10px 12px;
  border-radius: 10px;
  background: linear-gradient(180deg, #fffafb, #fff);
  border: 1px solid #ffd8de;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  grid-template-areas:
    "value button"
    "meta button";
  gap: 8px;
  align-items: start;

  &.placeholder {
    border-style: dashed;
  }
}

.coupon_value_wrap {
  grid-area: value;
  display: flex;
  align-items: flex-start;
  gap: 1px;
  color: #ff5f74;
}

.coupon_symbol {
  padding-top: 5px;
  font-size: 16px;
  font-weight: 700;
}

.coupon_value {
  font-size: 28px;
  line-height: 1;
  font-weight: 700;
}

.placeholder_value {
  opacity: .65;
}

.coupon_meta {
  grid-area: meta;
  min-width: 0;
}

.coupon_name {
  color: #374151;
  font-size: 12px;
  font-weight: 600;
  line-height: 1.4;
}

.coupon_deadline,
.coupon_tip {
  margin-top: 2px;
  font-size: 11px;
  line-height: 1.35;
  color: #9ca3af;
}

.coupon_btn {
  grid-area: button;
  align-self: center;
  min-width: 46px;
  height: 24px;
  padding: 0 8px;
  border-radius: 999px;
  font-size: 11px;
}

.placeholder_btn {
  color: #ff6076;
  background: #fff;
  border: 1px solid #ffc6d0;
}

.hero_user {
  display: grid;
  grid-template-rows: auto auto auto auto;
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

.user_address {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #6b7280;
  font-size: 12px;
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
  aspect-ratio: 1;
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

  .hero_showcase {
    grid-template-columns: minmax(0, 1.5fr) 180px;
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

  .hero_showcase {
    height: auto;
    grid-template-columns: 1fr;
  }

  .hero_primary {
    min-height: 220px;
  }

  .hero_secondary {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    grid-template-rows: none;
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

  .coupon_compact_grid,
  .user_stats,
  .user_links,
  .goods_grid {
    grid-template-columns: 1fr;
  }

  .hero_secondary {
    grid-template-columns: 1fr;
  }
}
</style>
