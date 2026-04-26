<script setup lang="ts">
import {computed, onBeforeUnmount, onMounted, ref, watch} from "vue";
import {useRoute, useRouter} from "vue-router";
import {Message} from "@arco-design/web-vue";
import {MdPreview} from "md-editor-v3";
import "md-editor-v3/lib/style.css";
import {
  IconCheckCircle,
  IconGift,
  IconHeart,
  IconMinus,
  IconPlus,
  IconStar
} from "@arco-design/web-vue/es/icon";
import {goodsDetailApi, type goodsDetailType} from "@/api/goods_api";
import {commentLevelApi, goodsCommentListApi, type commentLevelType, type goodsCommentListParams, type goodsCommentType} from "@/api/comment_api";
import {carCreateApi} from "@/api/car_api";
import {collectGoodsApi, lookGoodsApi} from "@/api/user_center_api";
import {userStorei} from "@/stores/user_store";
import {dateTimeFormat} from "@/utils/date";
import homeBg from "@/assets/img/home_bg.png";

const route = useRoute()
const router = useRouter()
const store = userStorei()

const loading = ref(false)
const commentLoading = ref(false)
const adding = ref(false)
const detail = ref<goodsDetailType | null>(null)
const comments = ref<goodsCommentType[]>([])
const level = ref<commentLevelType | null>(null)
const buyNum = ref(1)
const currentImage = ref("")
const commentFilter = ref("all")
const collecting = ref(false)
let lookTimer: number | undefined

const commentFilters = [
  {key: "all", label: "全部评论"},
  {key: "great", label: "好评"},
  {key: "middle", label: "中评"},
  {key: "bad", label: "差评"},
  {key: "images", label: "有图"},
]

const goodsID = computed(() => Number(route.params.id))
const markdownId = computed(() => `goods-detail-md-${goodsID.value || "preview"}`)
const commentFilterList = computed(() => {
  const summary = level.value
  const allCount = summary?.allCount ?? detail.value?.commentCount ?? 0
  const greatCount = summary?.greatCount ?? 0
  const middleCount = summary?.middleCount ?? 0
  const badCount = summary?.badCount ?? 0
  const imageCount = summary?.imageCount ?? 0

  return commentFilters.map((item) => {
    const countMap: Record<string, number> = {
      all: allCount,
      great: greatCount,
      middle: middleCount,
      bad: badCount,
      images: imageCount,
    }
    const count = countMap[item.key] ?? 0
    return {
      ...item,
      count,
      countText: count > 99 ? "99+" : String(count),
    }
  })
})
const previewImages = computed(() => {
  const list = detail.value?.images?.filter((item) => Boolean(item)) || []
  return list.length ? list : [homeBg]
})

function formatPrice(price?: number | null): string {
  if (price === null || price === undefined) {
    return "0.00"
  }
  return (price / 100).toFixed(price % 100 === 0 ? 0 : 2)
}

async function loadDetail() {
  const id = goodsID.value
  clearLookTimer()
  if (!id) {
    Message.error("商品不存在")
    router.replace({name: "web_home"})
    return
  }

  loading.value = true
  try {
    const [detailRes, levelRes] = await Promise.all([
      goodsDetailApi(id),
      commentLevelApi({goodsID: id, limit: 1, page: 1}),
    ])

    if (detailRes.code) {
      Message.error(detailRes.msg)
      router.replace({name: "web_home"})
      return
    }
    if (levelRes.code) {
      Message.warning(levelRes.msg)
    }

    detail.value = detailRes.data
    level.value = levelRes.code ? null : levelRes.data
    currentImage.value = detailRes.data.images?.find((item) => Boolean(item)) || detailRes.data.goodsConfigList?.[0]?.subList?.[0]?.image || homeBg
    buyNum.value = 1
    scheduleLookTracking(id)
    await loadComments(commentFilter.value)
  } catch (error) {
    console.error(error)
    Message.error("商品详情加载失败")
  } finally {
    loading.value = false
  }
}

function handleImageError(event: Event) {
  const target = event.target as HTMLImageElement | null
  if (!target || target.dataset.fallbackApplied === "1") {
    return
  }
  target.dataset.fallbackApplied = "1"
  target.src = homeBg
}

function clearLookTimer() {
  if (lookTimer) {
    window.clearTimeout(lookTimer)
    lookTimer = undefined
  }
}

function scheduleLookTracking(id: number) {
  clearLookTimer()
  if (!store.isLogin || !id) {
    return
  }

  lookTimer = window.setTimeout(async () => {
    try {
      const res = await lookGoodsApi({goodsID: id})
      if (res.code) {
        Message.warning(res.msg)
        return
      }
      if (detail.value?.id === id) {
        detail.value.lookCount += 1
      }
    } catch (error) {
      console.error(error)
    }
  }, 5000)
}

async function collectGoods() {
  if (!detail.value) return
  if (!store.isLogin) {
    Message.warning("请先登录后再收藏商品")
    store.openLoginModal(`/goods/${detail.value.id}`)
    return
  }
  if (detail.value.isCollect) {
    Message.info("当前商品已收藏")
    return
  }

  collecting.value = true
  try {
    const res = await collectGoodsApi({goodsID: detail.value.id})
    if (res.code) {
      Message.error(res.msg)
      return
    }
    Message.success("已收藏商品")
    detail.value.isCollect = true
  } catch (error) {
    console.error(error)
    Message.error("收藏失败")
  } finally {
    collecting.value = false
  }
}

function buildCommentParams(filter: string): goodsCommentListParams {
  const params: goodsCommentListParams = {
    goodsID: goodsID.value,
    limit: 8,
    page: 1,
  }
  if (filter === "great") params.commentType = 1
  if (filter === "middle") params.commentType = 2
  if (filter === "bad") params.commentType = 3
  if (filter === "images") params.isImages = true
  return params
}

async function loadComments(filter = commentFilter.value) {
  commentLoading.value = true
  try {
    const res = await goodsCommentListApi(buildCommentParams(filter))
    if (res.code) {
      Message.warning(res.msg)
      comments.value = []
      return
    }
    comments.value = res.data.list || []
  } catch (error) {
    console.error(error)
    Message.error("评论加载失败")
    comments.value = []
  } finally {
    commentLoading.value = false
  }
}

async function changeCommentFilter(filter: string) {
  if (commentFilter.value === filter) return
  commentFilter.value = filter
  await loadComments(filter)
}

async function addToCart() {
  if (!detail.value) return
  if (!store.isLogin) {
    Message.warning("请先登录后再加入购物车")
    store.openLoginModal(`/goods/${detail.value.id}`)
    return
  }

  adding.value = true
  try {
    const res = await carCreateApi({goodsID: detail.value.id, num: buyNum.value})
    if (res.code) {
      Message.error(res.msg)
      return
    }
    Message.success("已加入购物车")
  } catch (error) {
    console.error(error)
    Message.error("加入购物车失败")
  } finally {
    adding.value = false
  }
}

function decreaseBuyNum() {
  buyNum.value = Math.max(1, buyNum.value - 1)
}

function increaseBuyNum() {
  const max = detail.value?.inventory || 99
  buyNum.value = Math.min(max, buyNum.value + 1)
}

function goCart() {
  router.push({name: "web_cart"})
}

watch(goodsID, () => {
  loadDetail()
}, {immediate: true})

onMounted(() => {
  if (detail.value?.images?.length && !currentImage.value) {
    currentImage.value = detail.value.images.find((item) => Boolean(item)) || homeBg
  }
})

watch(() => store.isLogin, () => {
  if (detail.value?.id) {
    scheduleLookTracking(detail.value.id)
  }
})

watch(() => goodsID.value, () => {
  clearLookTimer()
})

onBeforeUnmount(() => {
  clearLookTimer()
})
</script>

<template>
  <div class="goods_detail_view">
    <div class="page_shell">
      <section class="hero_surface">
        <a-spin :loading="loading" tip="加载中...">
          <div v-if="detail" class="detail_grid">
            <div class="gallery_panel">
              <div class="main_cover">
                <img :src="currentImage || previewImages[0]" :alt="detail.title" @error="handleImageError">
              </div>

              <div v-if="previewImages.length > 1" class="thumb_list">
                <button
                  v-for="(img, index) in previewImages"
                  :key="img + index"
                  class="thumb_item"
                  :class="{active: currentImage === img}"
                  @click="currentImage = img"
                >
                  <img :src="img" :alt="detail.title" @error="handleImageError">
                </button>
              </div>
            </div>

            <div class="summary_panel">
              <div class="eyebrow">GOODS DETAIL</div>
              <h1>{{ detail.title }}</h1>
              <p class="summary">商品介绍支持图文详情展示，完整内容见下方“商品介绍”。</p>

              <div class="price_box">
                <div class="price_main">
                  <div class="price">￥{{ formatPrice(detail.price) }}</div>
                  <button
                    type="button"
                    class="collect_inline_btn"
                    :class="{active: detail.isCollect}"
                    :disabled="detail.isCollect || collecting"
                    @click="collectGoods"
                  >
                    <IconStar/>
                    <span>{{ detail.isCollect ? "已收藏" : "收藏商品" }}</span>
                  </button>
                </div>
                <div class="meta_row">
                  <span>累计评价 <strong>{{ commentFilterList[0]?.countText || detail.commentCount }}</strong></span>
                  <span>已售 <strong>{{ detail.salesNum > 999 ? `${Math.floor(detail.salesNum / 100) / 10}k+` : `${detail.salesNum}+` }}</strong></span>
                </div>
              </div>

              <div class="detail_rows">
                <div class="detail_row">
                  <span class="detail_label">商品分类</span>
                  <span class="detail_value">{{ detail.category }}</span>
                </div>
                <div class="detail_row">
                  <span class="detail_label">库存情况</span>
                  <span class="detail_value">{{ detail.inventory === null || detail.inventory === undefined ? "不限库存" : `${detail.inventory}件` }}</span>
                </div>
                <div v-if="detail.goodsDetailCoupon" class="detail_row detail_row_coupon">
                  <span class="detail_label">优惠信息</span>
                  <div class="detail_value coupon_inline">
                    <div class="coupon_title"><IconGift/> 商品优惠券</div>
                    <div class="coupon_desc">
                      满 {{ formatPrice(detail.goodsDetailCoupon.threshold) }} 减 {{ formatPrice(detail.goodsDetailCoupon.couponPrice) }}
                    </div>
                  </div>
                </div>
                <div v-else-if="detail.isGoodCoupon" class="detail_row">
                  <span class="detail_label">优惠信息</span>
                  <span class="detail_value">当前商品可领取优惠券</span>
                </div>
              </div>

              <div v-if="detail.goodsConfigList?.length" class="config_box">
                <div class="config_group" v-for="group in detail.goodsConfigList" :key="group.title">
                  <div class="config_title">{{ group.title }}</div>
                  <div class="config_items">
                    <div class="config_item" v-for="item in group.subList" :key="item.title">
                      <img :src="item.image" :alt="item.title">
                      <span>{{ item.title }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div class="buy_box">
                <div class="buy_row">
                  <span class="detail_label">购买数量</span>
                  <div class="qty_stepper">
                    <button type="button" class="qty_btn" @click="decreaseBuyNum">
                      <IconMinus/>
                    </button>
                    <span class="qty_value">{{ buyNum }}</span>
                    <button type="button" class="qty_btn" @click="increaseBuyNum">
                      <IconPlus/>
                    </button>
                  </div>
                </div>

                <div class="action_row">
                  <a-button size="large" class="ghost_action_btn" @click="goCart">去购物车</a-button>
                  <a-button type="primary" size="large" class="cart_action_btn" :loading="adding" @click="addToCart">加入购物车</a-button>
                </div>
              </div>

              <div class="buy_hint">
                <span><IconCheckCircle/> 正品保障</span>
                <span><IconHeart/> 支持加入购物车后统一结算</span>
              </div>
            </div>
          </div>

          <div v-else class="empty_state">
            <div class="empty_title">未找到商品</div>
            <div class="empty_desc">商品可能已下架或不存在，返回首页继续浏览其它商品。</div>
            <a-button type="primary" @click="router.push({name: 'web_home'})">返回首页</a-button>
          </div>
        </a-spin>
      </section>

      <section v-if="detail" class="comment_surface">
        <div class="section_head">
          <div>
            <div class="section_title">用户评价</div>
          </div>
        </div>

        <div class="comment_filter_panel">
          <button
            v-for="item in commentFilterList"
            :key="item.key"
            class="comment_filter"
            :class="{active: commentFilter === item.key}"
            @click="changeCommentFilter(item.key)"
          >
            <span>{{ item.label }}</span>
            <span class="filter_count">({{ item.countText }})</span>
          </button>

          <button type="button" class="comment_sort_btn">
            默认排序
            <icon-down/>
          </button>
        </div>

        <a-spin :loading="commentLoading">
          <div v-if="comments.length" class="comment_list">
            <article class="comment_card" v-for="item in comments" :key="item.createdAt + item.userNickname">
              <a-avatar :size="40" :image-url="item.userAvatar || '/logo.png'"/>
              <div class="comment_body">
                <div class="comment_head">
                  <strong>{{ item.userNickname }}</strong>
                  <div class="comment_rate_row">
                    <a-rate :model-value="item.level" readonly allow-half/>
                  </div>
                </div>
                <div class="comment_time">{{ dateTimeFormat(item.createdAt) }}</div>
                <div class="comment_content">{{ item.content }}</div>
                <a-image-preview-group v-if="item.images?.length" infinite>
                  <div class="comment_image_list">
                    <a-image
                      v-for="(img, index) in item.images"
                      :key="img + index"
                      :src="img"
                      :width="108"
                      :height="108"
                      fit="cover"
                    />
                  </div>
                </a-image-preview-group>
                <div class="comment_goods_line">
                  购买商品：{{ detail.title }}
                </div>
              </div>
            </article>
          </div>
          <div v-else class="empty_card large">暂无评论</div>
        </a-spin>
      </section>

      <section v-if="detail" class="intro_surface">
        <div class="section_head">
          <div class="section_title">商品介绍</div>
        </div>

        <div class="intro_markdown">
          <MdPreview
            :editor-id="markdownId"
            :model-value="detail.abstract || '暂无商品介绍'"
            preview-theme="default"
            code-theme="atom"
          />
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped lang="less">
.goods_detail_view {
  min-height: 100vh;
  color: var(--color-text-1);
  background: var(--web-page-bg);
}

.page_shell {
  width: min(1180px, calc(100% - 48px));
  margin: 0 auto;
  padding: 0 0 36px;
}

.hero_surface,
.comment_surface,
.intro_surface {
  border-radius: 18px;
}

.hero_surface {
  padding: 0;

  :deep(.arco-spin) {
    width: 100%;
  }
}

.comment_surface {
  background: var(--web-page-bg);
  box-shadow: none;
}

.intro_surface {
  margin-top: 18px;
}

.detail_grid {
  display: grid;
  grid-template-columns: minmax(0, .92fr) minmax(0, 1.08fr);
  gap: 22px;
}

.gallery_panel,
.summary_panel {
  border-radius: 16px;
  border: 1px solid var(--web-border);
  background: var(--web-surface);
}

.gallery_panel {
  padding: 16px;
}

.main_cover {
  aspect-ratio: 16 / 9;
  border-radius: 14px;
  overflow: hidden;
  background: var(--web-soft-bg);

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
}

.thumb_list {
  margin-top: 12px;
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 10px;
}

.thumb_item {
  padding: 0;
  border: 0;
  border-radius: 12px;
  overflow: hidden;
  background: transparent;
  opacity: .72;
  cursor: pointer;

  &.active {
    opacity: 1;
    box-shadow: 0 0 0 2px #ffccd5;
  }

  img {
    width: 100%;
    aspect-ratio: 16 / 9;
    object-fit: cover;
    display: block;
  }
}

.summary_panel {
  padding: 18px 18px 20px;
}

.eyebrow {
  color: #ff647c;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: .12em;
}

.summary_panel h1 {
  margin: 8px 0 10px;
  font-size: 26px;
  line-height: 1.35;
  color: var(--web-text);
}

.summary {
  margin: 0;
  color: var(--web-text-soft);
  font-size: 13px;
  line-height: 1.7;
}

.price_box {
  margin-top: 18px;
  padding: 16px 20px;
  border-radius: 12px;
  background: var(--web-soft-grad);
}

.price_main {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.price {
  color: #ff637a;
  font-size: 40px;
  font-weight: 700;
  line-height: 1;
}

.collect_inline_btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: 0;
  background: transparent;
  color: #666;
  font-size: 14px;
  cursor: pointer;

  &.active,
  &:disabled {
    color: #ff637a;
    cursor: default;
  }
}

.meta_row {
  margin-top: 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
  color: var(--web-text-soft);
  font-size: 14px;

  strong {
    color: #ff637a;
    font-weight: 600;
  }
}

.detail_rows {
  margin-top: 18px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.detail_row {
  display: grid;
  grid-template-columns: 72px minmax(0, 1fr);
  align-items: center;
  gap: 12px;
}

.detail_label {
  color: var(--web-text-soft);
  font-size: 15px;
  line-height: 1.4;
}

.detail_value {
  color: var(--web-text);
  font-size: 15px;
  line-height: 1.6;
}

.config_box {
  margin-top: 18px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.coupon_inline {
  padding: 12px 14px;
  border-radius: 12px;
  background: var(--web-soft-bg);
  border: 1px solid var(--web-border);
}

.coupon_title,
.config_title {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--web-text);
  font-weight: 700;
}

.coupon_desc {
  margin-top: 6px;
  color: var(--web-text-soft);
  font-size: 13px;
}

.config_group + .config_group {
  margin-top: 0;
}

.config_group {
  display: grid;
  grid-template-columns: 72px minmax(0, 1fr);
  gap: 12px;
}

.config_items {
  margin-top: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(126px, 126px));
  gap: 12px;
}

.config_item {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 52px;
  padding: 8px;
  border-radius: 12px;
  background: var(--web-surface);
  border: 1px solid var(--web-border);

  img {
    width: 44px;
    height: 44px;
    flex: 0 0 44px;
    border-radius: 8px;
    object-fit: cover;
  }

  span {
    padding: 0;
    color: var(--web-text-soft);
    font-size: 13px;
    line-height: 1.4;
    text-align: left;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

.buy_box {
  margin-top: 22px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.buy_row {
  display: grid;
  grid-template-columns: 72px minmax(0, 1fr);
  align-items: center;
  gap: 12px;
}

.qty_stepper {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.qty_btn {
  width: 28px;
  height: 28px;
  border-radius: 4px;
  border: 1px solid var(--web-border-strong);
  background: var(--web-surface);
  color: var(--web-text-soft);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.qty_value {
  min-width: 24px;
  color: var(--web-text);
  font-size: 15px;
  text-align: center;
}

.action_row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  padding-top: 116px;
  align-items: center;
}

.ghost_action_btn,
.cart_action_btn {
  min-width: 124px;
  height: 44px;
  border-radius: 4px;
  font-size: 15px;
  font-weight: 600;
}

.ghost_action_btn {
  border-color: #ff6b81;
  background: #ff6b81;
  color: #fff;
}

.cart_action_btn {
  border-color: #ffab12;
  background: #ffab12;
  color: #fff;
}

.buy_hint {
  margin-top: 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  color: var(--web-text-soft);
  font-size: 12px;

  span {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
}

.comment_surface {
  margin-top: 18px;
  padding: 0;
}

.intro_markdown {
  padding: 22px 24px;
  border-radius: 16px;
  border: 1px solid var(--web-border);
  background: var(--web-surface);
}

.intro_markdown :deep(.md-editor-preview-wrapper) {
  padding: 0;
  background: transparent;
}

.intro_markdown :deep(.md-editor-preview) {
  color: var(--web-text);
  font-family: inherit;
}

.intro_markdown :deep(h1),
.intro_markdown :deep(h2),
.intro_markdown :deep(h3),
.intro_markdown :deep(h4),
.intro_markdown :deep(h5),
.intro_markdown :deep(h6) {
  color: var(--web-text);
}

.intro_markdown :deep(p),
.intro_markdown :deep(li),
.intro_markdown :deep(blockquote) {
  color: var(--web-text-soft);
  line-height: 1.9;
}

.intro_markdown :deep(img) {
  border-radius: 12px;
}

.section_head {
  margin-bottom: 16px;
}

.section_title {
  color: var(--web-text);
  font-size: 24px;
  font-weight: 700;
  line-height: 1.1;
}

.comment_filter_panel {
  margin-bottom: 18px;
  padding: 18px 22px;
  border-radius: 8px;
  background: var(--web-surface);
  border: 1px solid var(--web-border);
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 24px;
}

.comment_filter {
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
  color: var(--web-text-soft);
  font-size: 15px;
  line-height: 1.5;
  display: inline-flex;
  align-items: baseline;
  gap: 4px;

  &.active {
    color: var(--web-text);
    font-weight: 700;
  }
}

.filter_count {
  color: inherit;
}

.comment_sort_btn {
  margin-left: auto;
  border: 0;
  background: transparent;
  color: var(--web-text-soft);
  font-size: 15px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
}

.comment_list {
  display: grid;
  gap: 0;
}

.comment_card {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 14px;
  padding: 22px 18px;
  border-bottom: 1px solid var(--web-border);
}

.comment_body {
  min-width: 0;
}

.comment_head {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;

  strong {
    color: var(--web-text);
    font-size: 15px;
    font-weight: 600;
  }
}

.comment_rate_row :deep(.arco-rate) {
  font-size: 16px;
  line-height: 1;
}

.comment_rate_row :deep(.arco-rate-character-full),
.comment_rate_row :deep(.arco-rate-character-half) {
  color: #f7ba2a;
}

.comment_time {
  margin-top: 6px;
  color: var(--web-text-muted);
  font-size: 13px;
}

.comment_content {
  margin-top: 10px;
  color: var(--web-text);
  font-size: 14px;
  line-height: 1.8;
}

.comment_image_list {
  margin-top: 14px;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.comment_image_list :deep(.arco-image) {
  border-radius: 4px;
  overflow: hidden;
}

.comment_goods_line {
  margin-top: 10px;
  color: var(--web-text-muted);
  font-size: 13px;
}

.empty_state,
.empty_card {
  border-radius: 14px;
  border: 1px dashed var(--web-border);
  background: var(--web-soft-grad);
  color: var(--web-text-muted);
  font-size: 13px;
  line-height: 1.8;
  text-align: center;
}

.empty_state {
  margin-top: 24px;
  min-height: 260px;
  display: grid;
  justify-items: center;
  align-content: center;
  gap: 10px;
  padding: 28px;
}

.empty_card {
  padding: 18px;

  &.large {
    margin-top: 12px;
  }
}

.empty_title {
  color: var(--web-text);
  font-size: 24px;
  font-weight: 700;
}

.empty_desc {
  max-width: 420px;
}

@media (max-width: 1100px) {
  .detail_grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 900px) {
  .page_shell {
    width: calc(100% - 24px);
    padding-top: 12px;
  }

  .hero_surface,
  .comment_surface,
  .intro_surface {
    border-radius: 14px;
  }

}

@media (max-width: 640px) {
  .page_shell {
    width: calc(100% - 16px);
  }

  .hero_surface {
    padding: 0;
  }

  .comment_surface,
  .intro_surface,
  .gallery_panel,
  .summary_panel {
    padding-left: 0;
    padding-right: 0;
  }

  .summary_panel h1,
  .section_title,
  .price,
  .empty_title {
    font-size: 24px;
  }

  .thumb_list,
  .config_items,
  .detail_row,
  .config_group,
  .buy_row {
    grid-template-columns: 1fr;
  }

  .thumb_list {
    display: grid;
  }

  .action_row {
    padding-top: 24px;
  }

  .ghost_action_btn,
  .cart_action_btn {
    min-width: calc(50% - 1px);
    flex: 1;
  }

  .comment_head {
    flex-direction: column;
    align-items: flex-start;
  }

  .comment_filter_panel {
    gap: 14px;
    padding: 16px;
  }

  .comment_sort_btn {
    margin-left: 0;
    width: 100%;
    justify-content: flex-start;
  }
}
</style>
