<script setup lang="ts">
import {onMounted, ref} from "vue";
import {Message} from "@arco-design/web-vue";
import {useRouter} from "vue-router";
import F_nav from "@/components/web/f_nav.vue";
import F_main from "@/components/web/f_main.vue";
import F_footer from "@/components/web/f_footer.vue";
import {goodsIndexListApi, type goodsIndexType} from "@/api/goods_api";
import {userStorei} from "@/stores/user_store";

interface CategoryItem {
  title: string
  desc: string
  key: string
  color: string
}

interface CouponItem {
  title: string
  price: string
  threshold: string
  tag: string
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
const loading = ref(false)

const categories: CategoryItem[] = [
  {title: "数码家电", desc: "手机、电脑、智能设备", key: "数码家电", color: "linear-gradient(135deg, #ff8c7f, #ff5d72)"},
  {title: "品质生活", desc: "家居、清洁、日用好物", key: "品质生活", color: "linear-gradient(135deg, #8ec5ff, #6a8bff)"},
  {title: "服饰运动", desc: "潮流穿搭、户外装备", key: "服饰运动", color: "linear-gradient(135deg, #6dd5a3, #35b06f)"},
  {title: "食品生鲜", desc: "零食饮品、产地直采", key: "食品生鲜", color: "linear-gradient(135deg, #f8bf6b, #f67c48)"},
]

const coupons: CouponItem[] = [
  {title: "无门槛优惠券", price: "￥1", threshold: "全场通用", tag: "领券立减"},
  {title: "满减优惠券", price: "￥3", threshold: "满5可用", tag: "爆款推荐"},
  {title: "门类优惠券", price: "￥5", threshold: "IT门类可用", tag: "数码好物"},
  {title: "专属红包", price: "￥4", threshold: "图书门类可用", tag: "限时领取"},
]

const speedItems: SpeedItem[] = [
  {title: "最佳产品管理书籍在此，获取职场上升秘籍", price: "￥1.2", originPrice: "￥4.2", desc: "14:00:00 开启", status: "秒杀价"},
  {title: "产品经理必备干货-实用高效沟通话术", price: "￥55.8", originPrice: "￥4.2", desc: "32人购买", status: "热卖"},
  {title: "自动闭合紧口收纳包", price: "￥4.2", originPrice: "￥4.2", desc: "32人购买", status: "推荐"},
  {title: "来学习！10条你绝对不能打破的交互设计规则", price: "￥4.2", originPrice: "￥4.2", desc: "32人购买", status: "精选"},
]

function formatPrice(price?: number | null): string {
  if (price === null || price === undefined) {
    return "0.00"
  }
  return (price / 100).toFixed(price % 100 === 0 ? 0 : 2)
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

onMounted(loadGoods)
</script>

<template>
  <div class="web_home_view">
    <f_nav no-scroll/>
    <f_main>
      <section class="home_hero">
        <div class="hero_copy">
          <div class="eyebrow">FENGFENG MALL</div>
          <h1>枫枫商城</h1>
          <p>
            先把用户最常走的链路做出来：首页找商品、搜索商品、进入个人中心，再逐步补齐商品详情、购物车和下单。
          </p>

          <div class="search_box">
            <a-input
              v-model="searchKeyword"
              size="large"
              allow-clear
              placeholder="搜索商品名称、分类或关键词"
              @press-enter="handleSearch()"
            />
            <a-button type="primary" size="large" @click="handleSearch()">
              搜索
            </a-button>
          </div>

          <div class="hot_keys">
            <span>热门搜索：</span>
            <a-link @click="handleSearch('数码家电')">数码家电</a-link>
            <a-link @click="handleSearch('秒杀')">秒杀</a-link>
            <a-link @click="handleSearch('优惠券')">优惠券</a-link>
            <a-link @click="handleSearch('家居')">家居</a-link>
          </div>
        </div>

        <div class="hero_panel">
          <div class="panel_head">
            <div>
              <div class="panel_label">今日状态</div>
              <div class="panel_title">{{ store.isLogin ? `上午好，${store.userInfo.nickName || store.userInfo.userName}` : "欢迎来到枫枫商城" }}</div>
            </div>
            <a-avatar :size="52" :image-url="store.userInfo.avatar || '/logo.png'"/>
          </div>

          <div class="panel_stats">
            <div class="stat_item">
              <strong>12</strong>
              <span>收藏</span>
            </div>
            <div class="stat_item">
              <strong>3</strong>
              <span>待付款</span>
            </div>
            <div class="stat_item">
              <strong>4</strong>
              <span>待评价</span>
            </div>
          </div>

          <div class="panel_actions">
            <a-button type="primary" long @click="store.isLogin ? router.push({name: 'web_search'}) : router.push({name: 'login'})">
              {{ store.isLogin ? "继续逛逛" : "立即登录" }}
            </a-button>
            <a-button long @click="store.isLogin ? Message.info('用户中心将放在下一阶段开发') : router.push({name: 'login'})">
              查看个人中心
            </a-button>
          </div>

          <div class="panel_note">
            用户后台后续会补齐订单、收藏、足迹、地址和优惠券页面，现在首页先把入口和视觉节奏做稳。
          </div>
        </div>
      </section>

      <section class="home_section">
        <div class="section_head">
          <div>
            <h2>分类列表</h2>
            <span>对应原型里的前台分类入口</span>
          </div>
          <a-link @click="handleSearch()">查看更多</a-link>
        </div>

        <div class="category_grid">
          <button
            v-for="item in categories"
            :key="item.key"
            class="category_card"
            :style="{background: item.color}"
            @click="goCategory(item.key)"
          >
            <div class="category_title">{{ item.title }}</div>
            <div class="category_desc">{{ item.desc }}</div>
          </button>
        </div>
      </section>

      <section class="home_section coupon_section">
        <div class="section_head">
          <div>
            <h2>优惠券领取</h2>
            <span>先做成原型里的视觉入口，后续再接领取接口</span>
          </div>
          <a-link @click="handleSearch('优惠券')">更多优惠券</a-link>
        </div>

        <div class="coupon_grid">
          <article class="coupon_card" v-for="item in coupons" :key="item.title">
            <div class="coupon_price">{{ item.price }}</div>
            <div class="coupon_body">
              <h3>{{ item.title }}</h3>
              <p>{{ item.threshold }}</p>
            </div>
            <div class="coupon_tag">{{ item.tag }}</div>
          </article>
        </div>
      </section>

      <section class="home_section">
          <div class="section_head">
            <div>
              <h2>秒杀专区</h2>
              <span>已经接入秒杀专区页面，点击即可进入抢购链路</span>
            </div>
          <a-link @click="router.push({name: 'web_sec_kill'})">查看秒杀</a-link>
          </div>

        <div class="speed_grid">
          <article class="speed_card" v-for="item in speedItems" :key="item.title">
            <div class="speed_tag">{{ item.status }}</div>
            <h3>{{ item.title }}</h3>
            <div class="speed_price">
              <strong>{{ item.price }}</strong>
              <span>{{ item.originPrice }}</span>
            </div>
            <div class="speed_meta">{{ item.desc }}</div>
          </article>
        </div>
      </section>

      <section class="home_section">
        <div class="section_head">
          <div>
            <h2>猜你喜欢</h2>
            <span>使用 goodsIndexListApi 拉取推荐商品</span>
          </div>
          <a-link @click="loadGoods">刷新商品</a-link>
        </div>

        <a-spin :loading="loading" tip="加载中...">
          <div v-if="goodsList.length" class="goods_grid">
            <article class="goods_card" v-for="item in goodsList" :key="item.id" @click="goGoodsDetail(item.id)">
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
    </f_main>
    <f_footer/>
  </div>
</template>

<style scoped lang="less">
.web_home_view {
  color: var(--color-text-1);
}

.home_hero {
  padding: 92px max(20px, calc((100% - 1200px) / 2)) 72px;
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(320px, .8fr);
  gap: 28px;
  align-items: stretch;
  background:
      linear-gradient(135deg, rgba(255, 247, 247, .94), rgba(255, 255, 255, .96)),
      url("@/assets/img/home_bg.png") center / cover no-repeat;
}

.hero_copy,
.hero_panel,
.home_section {
  border-radius: 24px;
}

.hero_copy {
  padding: 34px;
  background: rgba(255, 255, 255, .72);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 105, 123, .12);
  box-shadow: 0 30px 80px rgba(255, 120, 120, .08);
}

.eyebrow {
  color: #ff5d72;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: .08em;
}

.hero_copy h1 {
  margin: 14px 0 12px;
  font-size: 58px;
  line-height: 1.05;
  letter-spacing: -0.03em;
}

.hero_copy p {
  max-width: 620px;
  margin: 0;
  color: var(--color-text-2);
  font-size: 17px;
  line-height: 1.85;
}

.search_box {
  margin-top: 28px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 12px;

  :deep(.arco-input-wrapper) {
    height: 56px;
    border-radius: 18px;
    border-color: rgba(255, 93, 114, .26);
    box-shadow: 0 14px 34px rgba(255, 93, 114, .08);
  }

  :deep(.arco-btn) {
    height: 56px;
    min-width: 120px;
    border-radius: 18px;
  }
}

.hot_keys {
  margin-top: 18px;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  color: var(--color-text-2);
}

.hero_panel {
  padding: 28px;
  background:
      radial-gradient(circle at top right, rgba(255, 93, 114, .12), transparent 42%),
      var(--color-bg-1);
  border: 1px solid var(--color-border-2);
  box-shadow: 0 18px 60px rgba(15, 23, 42, .08);
}

.panel_head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.panel_label {
  color: var(--color-text-2);
  font-size: 14px;
}

.panel_title {
  margin-top: 6px;
  font-size: 22px;
  font-weight: 800;
}

.panel_stats {
  margin-top: 24px;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.stat_item {
  padding: 18px 14px;
  border-radius: 18px;
  background: var(--color-fill-1);
  text-align: center;

  strong {
    display: block;
    font-size: 26px;
    color: #ff5d72;
  }

  span {
    color: var(--color-text-2);
  }
}

.panel_actions {
  margin-top: 24px;
  display: grid;
  gap: 12px;
}

.panel_note {
  margin-top: 22px;
  padding: 16px;
  border-radius: 18px;
  background: rgba(255, 93, 114, .08);
  color: var(--color-text-2);
  line-height: 1.75;
}

.home_section {
  margin: 24px max(20px, calc((100% - 1200px) / 2));
  padding: 28px;
  background: var(--color-bg-1);
  border: 1px solid var(--color-border-2);
  box-shadow: 0 10px 40px rgba(15, 23, 42, .04);
}

.coupon_section {
  background: linear-gradient(180deg, rgba(255, 250, 251, 1), rgba(255, 255, 255, 1));
}

.section_head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 22px;

  h2 {
    margin: 0;
    font-size: 28px;
  }

  span {
    display: block;
    margin-top: 8px;
    color: var(--color-text-2);
  }
}

.category_grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}

.category_card {
  min-height: 170px;
  padding: 22px;
  border: 0;
  border-radius: 22px;
  text-align: left;
  color: #fff;
  cursor: pointer;
  box-shadow: 0 20px 40px rgba(15, 23, 42, .08);
  transition: transform .18s ease, box-shadow .18s ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 24px 48px rgba(15, 23, 42, .12);
  }
}

.category_title {
  font-size: 22px;
  font-weight: 800;
}

.category_desc {
  margin-top: 14px;
  line-height: 1.7;
  color: rgba(255, 255, 255, .88);
}

.coupon_grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}

.coupon_card {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 16px 14px;
  align-items: center;
  padding: 20px;
  border-radius: 22px;
  border: 1px solid rgba(255, 93, 114, .12);
  background:
      linear-gradient(135deg, rgba(255, 93, 114, .09), rgba(255, 93, 114, .02)),
      #fff;
}

.coupon_price {
  grid-row: span 2;
  width: 74px;
  height: 74px;
  border-radius: 20px;
  display: grid;
  place-items: center;
  font-size: 20px;
  font-weight: 800;
  color: #fff;
  background: linear-gradient(135deg, #ff7c8d, #ff5d72);
}

.coupon_body {
  h3 {
    margin: 0;
    font-size: 18px;
  }

  p {
    margin: 8px 0 0;
    color: var(--color-text-2);
  }
}

.coupon_tag {
  grid-column: 2;
  justify-self: start;
  padding: 6px 12px;
  border-radius: 999px;
  background: rgba(255, 93, 114, .12);
  color: #ff5d72;
  font-size: 13px;
  font-weight: 600;
}

.speed_grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}

.speed_card {
  padding: 20px;
  border-radius: 22px;
  background: var(--color-fill-1);
  border: 1px solid var(--color-border-2);

  h3 {
    margin: 14px 0;
    min-height: 78px;
    font-size: 17px;
    line-height: 1.5;
  }
}

.speed_tag {
  display: inline-flex;
  align-items: center;
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(255, 93, 114, .12);
  color: #ff5d72;
  font-size: 12px;
  font-weight: 700;
}

.speed_price {
  display: flex;
  align-items: baseline;
  gap: 10px;

  strong {
    color: #e11d48;
    font-size: 24px;
  }

  span {
    color: var(--color-text-2);
    text-decoration: line-through;
  }
}

.speed_meta {
  margin-top: 8px;
  color: var(--color-text-2);
}

.goods_grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}

.goods_card {
  overflow: hidden;
  border-radius: 22px;
  border: 1px solid var(--color-border-2);
  background: var(--color-bg-1);
  transition: transform .18s ease, box-shadow .18s ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 18px 42px rgba(15, 23, 42, .08);
  }
}

.goods_cover {
  aspect-ratio: 1;
  background: var(--color-fill-1);

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
}

.goods_body {
  padding: 16px;
}

.goods_title {
  font-size: 16px;
  line-height: 1.5;
  min-height: 48px;
}

.goods_price {
  margin-top: 10px;
  color: #e11d48;
  font-size: 20px;
  font-weight: 800;
}

.goods_meta {
  margin-top: 8px;
  color: var(--color-text-2);
}

@media (max-width: 1100px) {
  .home_hero,
  .category_grid,
  .coupon_grid,
  .speed_grid,
  .goods_grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .home_hero {
    grid-template-columns: 1fr;
    padding-top: 76px;
  }

  .hero_copy h1 {
    font-size: 42px;
  }

  .search_box {
    grid-template-columns: 1fr;
  }

  .panel_stats {
    grid-template-columns: 1fr;
  }

  .home_section {
    margin-left: 16px;
    margin-right: 16px;
    padding: 20px;
  }

  .category_grid,
  .coupon_grid,
  .speed_grid,
  .goods_grid {
    grid-template-columns: 1fr;
  }

  .section_head {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
