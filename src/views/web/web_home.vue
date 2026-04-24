<script setup lang="ts">
import {computed, onMounted, ref} from "vue";
import {Message} from "@arco-design/web-vue";
import {useRouter} from "vue-router";
import F_footer from "@/components/web/f_footer.vue";
import {goodsIndexListApi, type goodsIndexType} from "@/api/goods_api";
import {couponAcceptableListApi, couponReceiveApi, type acceptableCouponType} from "@/api/coupon_api";
import {userStorei} from "@/stores/user_store";
import homeBg from "@/assets/img/home_bg.png";

interface CategoryItem {
  title: string
  desc: string
  key: string
  color: string
}

interface SpeedItem {
  title: string
  price: string
  originPrice: string
  desc: string
  status: string
}

const router = useRouter()
const store = userStorei()
const searchKeyword = ref("")
const goodsList = ref<goodsIndexType[]>([])
const couponList = ref<acceptableCouponType[]>([])
const loading = ref(false)
const couponLoading = ref(false)
const featureTabs = [
  {title: "猜你喜欢", key: "推荐"},
  {title: "秒杀专区", key: "秒杀"},
  {title: "数码产品", key: "数码家电"},
  {title: "办公文具", key: "办公"},
]

const categories: CategoryItem[] = [
  {title: "数码家电", desc: "手机、电脑、智能设备", key: "数码家电", color: "linear-gradient(135deg, #ff8c7f, #ff5d72)"},
  {title: "品质生活", desc: "家居、清洁、日用好物", key: "品质生活", color: "linear-gradient(135deg, #8ec5ff, #6a8bff)"},
  {title: "服饰运动", desc: "潮流穿搭、户外装备", key: "服饰运动", color: "linear-gradient(135deg, #6dd5a3, #35b06f)"},
  {title: "食品生鲜", desc: "零食饮品、产地直采", key: "食品生鲜", color: "linear-gradient(135deg, #f8bf6b, #f67c48)"},
]

function formatPrice(price?: number | null): string {
  if (price === null || price === undefined) {
    return "0.00"
  }
  return (price / 100).toFixed(price % 100 === 0 ? 0 : 2)
}

function couponTypeText(type: number): string {
  const map: Record<number, string> = {
    1: "节日券",
    2: "新用户券",
    3: "新商品券",
    4: "商品券",
    5: "普通券",
  }
  return map[type] || `类型 ${type}`
}

const couponSlots = computed(() => {
  const slots = Array.from({length: 4}, (_, index) => couponList.value[index] || null)
  return slots
})
const featuredGoods = computed(() => goodsList.value.slice(0, 10))

function openGoodsLink(item: goodsIndexType) {
  goGoodsDetail(item.id)
}

async function loadGoods() {
  loading.value = true
  try {
    const res = await goodsIndexListApi({page: 1, limit: 8})
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

function goCategory(key: string) {
  router.push({
    name: "web_search",
    query: {key},
  })
}

function goGoodsDetail(id: number) {
  router.push({
    name: "web_goods_detail",
    params: {id},
  })
}

function goUserCenter(name: "web_user_center_order" | "web_user_center_collect" | "web_user_center_look" | "web_user_center_addr" | "web_user_center_coupon" | "web_user_center_msg") {
  router.push({name})
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
      <header class="home_header">
        <router-link class="brand_block" to="/">
          <div class="brand_text">
            <div class="brand_title">枫枫商城</div>
            <div class="brand_subtitle">与爱众人一步</div>
          </div>
        </router-link>

        <div class="search_wrap">
          <a-input
            v-model="searchKeyword"
            allow-clear
            placeholder="搜索你需要的商品"
            @press-enter="handleSearch()"
          />
          <a-button type="primary" @click="handleSearch()">搜索</a-button>
        </div>

        <div class="header_links">
          <router-link class="header_link" :to="{name: 'web_cart'}">
            <icon-shopping-cart/>
            <span>购物车</span>
            <em class="header_badge">12</em>
          </router-link>
          <router-link class="header_link" :to="{name: 'web_user_center_msg'}">
            <icon-message/>
            <span>消息通知</span>
            <em class="header_badge">3</em>
          </router-link>
          <router-link class="header_link" :to="{name: 'web_user_center_collect'}">
            <icon-star/>
            <span>我的收藏</span>
          </router-link>
          <router-link class="header_link" :to="{name: 'web_user_center_addr'}">
            <icon-compass/>
            <span>我的地址</span>
          </router-link>
        </div>
      </header>

      <section class="hero_section">
        <div class="hero_banner">
          <img :src="homeBg" alt="枫枫商城推荐商品"></img>
        </div>

        <div class="hero_coupon">
          <div class="panel_head">
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
                  <div class="coupon_value">￥{{ formatPrice(item.couponPrice) }}</div>
                  <div class="coupon_meta">
                    <div class="coupon_name">{{ item.title || couponTypeText(item.type) }}</div>
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
                  <div class="coupon_value placeholder_value">￥?</div>
                  <div class="coupon_meta">
                    <div class="coupon_name">更多优惠</div>
                    <div class="coupon_tip">持续更新中</div>
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
            <a-avatar :size="44" :image-url="store.userInfo.avatar || '/logo.png'"/>
            <div>
              <div class="user_greet">{{ store.isLogin ? `上午好，${store.userInfo.nickName || store.userInfo.userName}` : "上午好" }}</div>
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
              <strong>7</strong>
              <span>优惠券</span>
            </div>
            <div class="user_stat">
              <strong>2</strong>
              <span>待付款</span>
            </div>
            <div class="user_stat">
              <strong>3</strong>
              <span>待发货</span>
            </div>
            <div class="user_stat">
              <strong>4</strong>
              <span>待评价</span>
            </div>
          </div>

          <div class="user_links">
            <button type="button" @click="goUserCenter('web_user_center_collect')">
              <icon-star/>
              <span>我的收藏</span>
            </button>
            <button type="button" @click="router.push({name: 'web_cart'})">
              <icon-shopping-cart/>
              <span>购物车</span>
            </button>
            <button type="button" @click="goUserCenter('web_user_center_look')">
              <icon-clock-circle/>
              <span>我的足迹</span>
            </button>
          </div>
        </aside>
      </section>

      <section class="feature_tabs">
        <button
          v-for="item in featureTabs"
          :key="item.key"
          class="feature_tab"
          :class="{active: item.key === '推荐'}"
          type="button"
          @click="item.key === '秒杀' ? router.push({name: 'web_sec_kill'}) : handleSearch(item.key)"
        >
          <icon-heart class="feature_icon"/>
          <span>{{ item.title }}</span>
        </button>
      </section>

      <section class="goods_section">
        <div class="panel_head">
          <div>
            <h2>猜你喜欢</h2>
            <p>使用 goodsIndexListApi 拉取推荐商品</p>
          </div>
          <a-link @click="loadGoods">刷新商品</a-link>
        </div>

        <a-spin :loading="loading" tip="加载中...">
          <div v-if="featuredGoods.length" class="goods_grid">
            <article class="goods_card" v-for="item in featuredGoods" :key="item.id" @click="openGoodsLink(item)">
              <div class="goods_cover">
                <img :src="item.cover" :alt="item.title"></img>
              </div>
              <div class="goods_body">
                <div class="goods_title">{{ item.title }}</div>
                <div class="goods_price">￥{{ formatPrice(item.price) }}</div>
                <div class="goods_meta">销量 {{ item.salesNum }}</div>
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
  background: #f4f5f7;
}

.page_shell {
  width: min(1240px, calc(100% - 32px));
  margin: 0 auto;
  padding: 0 0 28px;
}

.home_header {
  padding: 24px 30px;
  border-radius: 0 0 8px 8px;
  background: #fff;
  display: grid;
  grid-template-columns: 180px minmax(0, 1fr) auto;
  gap: 24px;
  align-items: center;
}

.brand_block {
  text-decoration: none;
  color: inherit;
}

.brand_title {
  font-size: 28px;
  line-height: 1.1;
  color: #ff5d72;
  font-weight: 700;
}

.brand_subtitle {
  margin-top: 6px;
  color: #ff5d72;
  font-size: 13px;
  letter-spacing: .08em;
}

.search_wrap {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 84px;
  gap: 0;
  align-items: center;
  border: 1px solid rgba(255, 93, 114, .38);
  border-radius: 14px;
  overflow: hidden;

  :deep(.arco-input-wrapper) {
    border: 0;
    box-shadow: none;
    height: 38px;
  }

  :deep(.arco-btn) {
    height: 38px;
    border-radius: 0;
  }
}

.header_links {
  display: flex;
  align-items: center;
  gap: 18px;
  white-space: nowrap;
}

.header_link {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: var(--color-text-1);
  text-decoration: none;
  font-size: 13px;

  .header_badge {
    min-width: 16px;
    height: 16px;
    padding: 0 4px;
    border-radius: 999px;
    display: inline-grid;
    place-items: center;
    background: #ff5d72;
    color: #fff;
    font-size: 11px;
    font-style: normal;
  }
}

.hero_section {
  margin-top: 28px;
  display: grid;
  grid-template-columns: 1.5fr 1.1fr .9fr;
  gap: 12px;
  align-items: stretch;
}

.hero_banner,
.hero_coupon,
.hero_user,
.feature_tabs,
.goods_section {
  background: #fff;
}

  .hero_banner {
    border-radius: 8px;
    overflow: hidden;
    min-height: 222px;
    background: linear-gradient(135deg, #f8f2ff, #ffe6ea);

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: center center;
      display: block;
    }
  }

.hero_coupon,
.hero_user {
  border-radius: 8px;
  padding: 14px 14px 12px;
  border: 1px solid rgba(226, 232, 240, .88);
}

.panel_head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 12px;

  h2 {
    margin: 0;
    font-size: 14px;
    font-weight: 700;
  }

  p {
    margin: 4px 0 0;
    color: var(--color-text-2);
    font-size: 12px;
  }
}

.coupon_compact_grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  align-content: start;
}

.coupon_compact_card {
  padding: 10px 10px 10px 12px;
  border-radius: 6px;
  background: #fff5f6;
  display: grid;
  grid-template-columns: 48px minmax(0, 1fr) auto;
  align-items: center;
  gap: 8px;
  border: 1px solid rgba(255, 93, 114, .14);

  &.placeholder {
    background: linear-gradient(180deg, #fff8f9, #fff);
    border-style: dashed;
  }
}

.coupon_value {
  color: #ff5d72;
  font-size: 18px;
  font-weight: 800;
}

.placeholder_value {
  color: rgba(255, 93, 114, .5);
}

.coupon_name {
  font-size: 12px;
  font-weight: 600;
  line-height: 1.35;
}

.coupon_tip {
  margin-top: 3px;
  font-size: 11px;
  color: var(--color-text-2);
}

.coupon_btn {
  min-width: 44px;
  height: 26px;
  padding: 0 8px;
  border-radius: 4px;
  font-size: 12px;
}

.placeholder_btn {
  color: #ff5d72;
  background: #fff;
  border: 1px solid rgba(255, 93, 114, .22);
}

.hero_user {
  display: grid;
  grid-template-rows: auto auto auto;
  gap: 12px;
}

.user_profile {
  display: flex;
  align-items: center;
  gap: 10px;
}

.user_greet {
  font-size: 14px;
  font-weight: 700;
}

.user_state {
  margin-top: 4px;
  font-size: 12px;
  color: var(--color-text-3);
}

.user_stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
}

.user_stat {
  text-align: center;
  padding: 8px 0;
  border-radius: 6px;
  background: #fafafa;

  strong {
    display: block;
    font-size: 18px;
    font-weight: 800;
    color: #ff5d72;
  }

  span {
    display: block;
    margin-top: 4px;
    font-size: 11px;
    color: var(--color-text-2);
  }
}

.user_links {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;

  button {
    border: 0;
    border-radius: 6px;
    background: #fff;
    display: grid;
    justify-items: center;
    gap: 6px;
    padding: 10px 0 8px;
    color: var(--color-text-1);
    cursor: pointer;
    box-shadow: inset 0 0 0 1px rgba(226, 232, 240, .9);

    span {
      font-size: 12px;
    }
  }
}

.login_primary_btn {
  margin: 2px 0 2px;
  height: 36px;
  border-radius: 6px;
  font-weight: 700;
}

.feature_tabs {
  margin-top: 14px;
  padding: 0 0 8px;
  display: flex;
  align-items: center;
  gap: 18px;
  background: transparent;
}

.feature_tab {
  border: 0;
  background: transparent;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--color-text-2);
  cursor: pointer;
  padding: 0;
  font-size: 13px;

  &.active {
    color: #ff5d72;
    font-weight: 700;
  }
}

.feature_icon {
  color: #ff5d72;
}

.goods_section {
  margin-top: 12px;
  padding: 18px 0 4px;
}

.goods_grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 12px;
}

.goods_card {
  overflow: hidden;
  border-radius: 4px;
  border: 1px solid rgba(226, 232, 240, .95);
  background: #fff;
  transition: transform .18s ease, box-shadow .18s ease;

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 10px 24px rgba(15, 23, 42, .08);
  }
}

.goods_cover {
  aspect-ratio: 1;
  background: #f8fafc;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
}

.goods_body {
  padding: 10px 8px 12px;
}

.goods_title {
  min-height: 36px;
  font-size: 12px;
  line-height: 1.45;
  color: #333;
}

.goods_price {
  margin-top: 8px;
  color: #ff5d72;
  font-size: 16px;
  font-weight: 700;
}

.goods_meta {
  margin-top: 6px;
  color: var(--color-text-3);
  font-size: 11px;
}

@media (max-width: 960px) {
  .hero_section,
  .goods_grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .hero_user {
    grid-column: 1 / -1;
  }

  .hero_banner {
    min-height: 260px;
  }
}

@media (max-width: 900px) {
  .home_header {
    grid-template-columns: 1fr;
  }

  .header_links {
    flex-wrap: wrap;
  }

  .hero_section {
    grid-template-columns: 1fr;
  }

  .coupon_compact_grid,
  .user_stats,
  .user_links {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 768px) {
  .page_shell {
    width: calc(100% - 20px);
    padding-top: 6px;
  }

  .home_header {
    padding: 18px 16px;
  }

  .search_wrap {
    grid-template-columns: 1fr 74px;
  }

  .header_links {
    gap: 10px 14px;
  }

  .hero_section {
    margin-top: 16px;
  }

  .hero_user,
  .hero_coupon {
    padding: 12px;
  }

  .feature_tabs {
    gap: 12px;
    overflow-x: auto;
    padding-bottom: 4px;
  }

  .goods_grid {
    grid-template-columns: 1fr;
  }
}
</style>
