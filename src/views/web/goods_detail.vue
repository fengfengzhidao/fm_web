<script setup lang="ts">
import {computed, onBeforeUnmount, onMounted, ref, watch} from "vue";
import {useRoute, useRouter} from "vue-router";
import {Message} from "@arco-design/web-vue";
import {
  IconCheckCircle,
  IconGift,
  IconHeart,
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
              <p class="summary">{{ detail.abstract }}</p>

              <div class="price_box">
                <div class="price">￥ {{ formatPrice(detail.price) }}</div>
                <div class="meta_row">
                  <span>销量 {{ detail.salesNum }}</span>
                  <span>浏览 {{ detail.lookCount }}</span>
                  <span>评论 {{ detail.commentCount }}</span>
                </div>
              </div>

              <div class="info_grid">
                <div class="info_card">
                  <span>分类</span>
                  <strong>{{ detail.category }}</strong>
                </div>
                <div class="info_card">
                  <span>库存</span>
                  <strong>{{ detail.inventory === null || detail.inventory === undefined ? "不限库存" : detail.inventory }}</strong>
                </div>
                <div class="info_card">
                  <span>收藏</span>
                  <strong>{{ detail.isCollect ? "已收藏" : "未收藏" }}</strong>
                </div>
                <div class="info_card">
                  <span>优惠</span>
                  <strong>{{ detail.isGoodCoupon ? "可领取" : "暂无" }}</strong>
                </div>
              </div>

              <div v-if="detail.goodsDetailCoupon" class="coupon_box">
                <div class="coupon_title"><IconGift/> 商品优惠券</div>
                <div class="coupon_desc">
                  满 {{ formatPrice(detail.goodsDetailCoupon.threshold) }} 减 {{ formatPrice(detail.goodsDetailCoupon.couponPrice) }}
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
                <a-input-number v-model="buyNum" :min="1" :max="detail.inventory || 99" />
                <a-button type="primary" size="large" :loading="adding" @click="addToCart">加入购物车</a-button>
                <a-button
                  size="large"
                  class="collect_action_btn"
                  :loading="collecting"
                  :disabled="detail.isCollect"
                  @click="collectGoods"
                >
                  <IconHeart/>
                  <span>{{ detail.isCollect ? "已收藏" : "收藏商品" }}</span>
                </a-button>
                <a-button size="large" @click="goCart">去购物车</a-button>
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
            <div class="section_title">评论概览</div>
          </div>
        </div>

        <div class="level_grid">
          <div class="level_card">
            <strong>{{ level?.allCount ?? detail.commentCount }}</strong>
            <span>全部评论</span>
          </div>
          <div class="level_card">
            <strong>{{ level?.greatCount ?? 0 }}</strong>
            <span>好评</span>
          </div>
          <div class="level_card">
            <strong>{{ level?.middleCount ?? 0 }}</strong>
            <span>中评</span>
          </div>
          <div class="level_card">
            <strong>{{ level?.badCount ?? 0 }}</strong>
            <span>差评</span>
          </div>
          <div class="level_card">
            <strong>{{ level?.imageCount ?? 0 }}</strong>
            <span>有图</span>
          </div>
        </div>

        <div class="comment_filter_row">
          <button
            v-for="item in commentFilters"
            :key="item.key"
            class="comment_filter"
            :class="{active: commentFilter === item.key}"
            @click="changeCommentFilter(item.key)"
          >
            {{ item.label }}
          </button>
        </div>

        <a-spin :loading="commentLoading">
          <div v-if="comments.length" class="comment_list">
            <article class="comment_card" v-for="item in comments" :key="item.createdAt + item.userNickname">
              <a-avatar :size="42" :image-url="item.userAvatar || '/logo.png'"/>
              <div class="comment_body">
                <div class="comment_head">
                  <strong>{{ item.userNickname }}</strong>
                  <span>{{ dateTimeFormat(item.createdAt) }}</span>
                </div>
                <div class="comment_content">{{ item.content }}</div>
                <div class="comment_meta">
                  <IconStar/>
                  <span>满意度 {{ item.level }} 星</span>
                </div>
              </div>
            </article>
          </div>
          <div v-else class="empty_card large">暂无评论</div>
        </a-spin>
      </section>
    </div>
  </div>
</template>

<style scoped lang="less">
.goods_detail_view {
  min-height: 100vh;
  color: var(--color-text-1);
  background: #fff;
}

.page_shell {
  width: min(1180px, calc(100% - 48px));
  margin: 0 auto;
  padding: 0 0 36px;
}

.hero_surface,
.comment_surface {
  border-radius: 18px;
}

.hero_surface {
  padding: 0;
}

.comment_surface {
  background: #fff;
  box-shadow: 0 20px 45px rgba(17, 24, 39, .05);
}

.detail_grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, .96fr);
  gap: 22px;
}

.gallery_panel,
.summary_panel {
  border-radius: 16px;
  border: 1px solid #eceef2;
  background: #fff;
}

.gallery_panel {
  padding: 16px;
}

.main_cover {
  aspect-ratio: 16 / 9;
  border-radius: 14px;
  overflow: hidden;
  background: #f7f8fa;

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
  padding: 22px 20px;
}

.eyebrow {
  color: #ff647c;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: .12em;
}

.summary_panel h1 {
  margin: 10px 0;
  font-size: 34px;
  line-height: 1.2;
  color: #111827;
}

.summary {
  margin: 0;
  color: #6b7280;
  font-size: 14px;
  line-height: 1.8;
}

.price_box {
  margin-top: 18px;
  padding: 18px;
  border-radius: 14px;
  background: linear-gradient(135deg, rgba(255, 93, 114, .1), rgba(255, 93, 114, .04));
}

.price {
  color: #ff637a;
  font-size: 30px;
  font-weight: 700;
}

.meta_row {
  margin-top: 10px;
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  color: #6b7280;
  font-size: 12px;
}

.info_grid {
  margin-top: 18px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.info_card {
  padding: 14px;
  border-radius: 14px;
  background: #fafafb;
  border: 1px solid #eceef2;

  span {
    display: block;
    color: #9ca3af;
    font-size: 12px;
  }

  strong {
    display: block;
    margin-top: 8px;
    color: #111827;
    font-size: 15px;
  }
}

.coupon_box,
.config_box {
  margin-top: 18px;
  padding: 16px;
  border-radius: 14px;
  background: #fffafb;
  border: 1px solid #f4d8df;
}

.coupon_title,
.config_title {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #111827;
  font-weight: 700;
}

.coupon_desc {
  margin-top: 10px;
  color: #6b7280;
  font-size: 13px;
}

.config_group + .config_group {
  margin-top: 16px;
}

.config_items {
  margin-top: 12px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(112px, 112px));
  gap: 12px;
}

.config_item {
  border-radius: 12px;
  background: #fff;
  border: 1px solid #eceef2;
  overflow: hidden;

  img {
    width: 100%;
    height: 96px;
    object-fit: cover;
    display: block;
  }

  span {
    display: block;
    padding: 8px 10px 10px;
    color: #4b5563;
    font-size: 12px;
    line-height: 1.4;
    text-align: center;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

.buy_box {
  margin-top: 22px;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
}

.collect_action_btn {
  border-color: #ffd0d9;
  color: #ff647c;
  background: #fff7f9;

  &:hover {
    border-color: #ffb7c4;
    background: #fff0f4;
  }

  :deep(.arco-icon) {
    margin-right: 6px;
  }
}

.buy_hint {
  margin-top: 14px;
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  color: #6b7280;
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

.section_head {
  margin-bottom: 14px;
}

.section_title {
  color: #111827;
  font-size: 30px;
  font-weight: 700;
  line-height: 1.1;
}

.section_desc {
  margin-top: 8px;
  color: #9ca3af;
  font-size: 13px;
}

.level_grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 12px;
}

.level_card {
  padding: 16px;
  border-radius: 14px;
  background: #fafafb;
  text-align: center;

  strong {
    display: block;
    font-size: 24px;
    color: #ff637a;
  }

  span {
    margin-top: 8px;
    display: block;
    color: #6b7280;
    font-size: 12px;
  }
}

.comment_filter_row {
  margin: 18px 0 16px;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.comment_filter {
  border: 1px solid #eceef2;
  background: #fafafb;
  border-radius: 999px;
  padding: 8px 14px;
  cursor: pointer;
  color: #6b7280;
  font-size: 12px;

  &.active {
    color: #ff637a;
    border-color: #ffccd5;
    background: #fff4f6;
  }
}

.comment_list {
  display: grid;
  gap: 12px;
}

.comment_card {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 14px;
  padding: 16px;
  border-radius: 14px;
  border: 1px solid #eceef2;
}

.comment_body {
  min-width: 0;
}

.comment_head {
  display: flex;
  justify-content: space-between;
  gap: 12px;

  strong {
    color: #111827;
  }

  span {
    color: #9ca3af;
    font-size: 12px;
  }
}

.comment_content {
  margin-top: 10px;
  color: #4b5563;
  line-height: 1.8;
}

.comment_meta {
  margin-top: 8px;
  color: #ff637a;
  font-size: 12px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.empty_state,
.empty_card {
  border-radius: 14px;
  border: 1px dashed #f0d7dd;
  background: linear-gradient(180deg, #fffafb, #fff);
  color: #9ca3af;
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
  color: #111827;
  font-size: 24px;
  font-weight: 700;
}

.empty_desc {
  max-width: 420px;
}

@media (max-width: 1100px) {
  .detail_grid,
  .level_grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

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
  .comment_surface {
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
  .level_grid,
  .config_items,
  .info_grid {
    grid-template-columns: 1fr;
    gap: 10px;
    flex-wrap: wrap;
  }

  .thumb_list {
    display: grid;
  }

  .comment_head {
    flex-direction: column;
  }
}
</style>
