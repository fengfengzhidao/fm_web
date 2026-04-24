<script setup lang="ts">
import {computed, onMounted, ref, watch} from "vue";
import {useRoute, useRouter} from "vue-router";
import {Message} from "@arco-design/web-vue";
import F_nav from "@/components/web/f_nav.vue";
import F_main from "@/components/web/f_main.vue";
import F_footer from "@/components/web/f_footer.vue";
import {goodsDetailApi, type goodsDetailType} from "@/api/goods_api";
import {commentLevelApi, goodsCommentListApi, type commentLevelType, type goodsCommentListParams, type goodsCommentType} from "@/api/comment_api";
import {carCreateApi} from "@/api/car_api";
import {userStorei} from "@/stores/user_store";
import {dateTimeFormat} from "@/utils/date";

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

const commentFilters = [
  {key: "all", label: "全部评论"},
  {key: "great", label: "好评"},
  {key: "middle", label: "中评"},
  {key: "bad", label: "差评"},
  {key: "images", label: "有图"},
]

const goodsID = computed(() => Number(route.params.id))

function formatPrice(price?: number | null): string {
  if (price === null || price === undefined) {
    return "0.00"
  }
  return (price / 100).toFixed(price % 100 === 0 ? 0 : 2)
}

async function loadDetail() {
  const id = goodsID.value
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
    currentImage.value = detailRes.data.images?.[0] || detailRes.data.goodsConfigList?.[0]?.subList?.[0]?.image || ""
    buyNum.value = 1
    await loadComments(commentFilter.value)
  } catch (error) {
    console.error(error)
    Message.error("商品详情加载失败")
  } finally {
    loading.value = false
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
    router.push({name: "login", query: {redirect: `/goods/${detail.value.id}`}})
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
    currentImage.value = detail.value.images[0]
  }
})
</script>

<template>
  <div class="goods_detail_view">
    <f_nav no-scroll/>
    <f_main>
      <section class="detail_shell">
        <a-button class="back_btn" @click="router.back()">返回</a-button>

        <a-spin :loading="loading" tip="加载中...">
          <div v-if="detail" class="detail_grid">
            <div class="gallery_panel">
              <div class="main_cover">
                <img :src="currentImage || detail.images?.[0]" :alt="detail.title"></img>
              </div>
              <div class="thumb_list">
                <button
                  v-for="(img, index) in detail.images || []"
                  :key="img + index"
                  class="thumb_item"
                  :class="{active: currentImage === img}"
                  @click="currentImage = img"
                >
                  <img :src="img" :alt="detail.title"></img>
                </button>
              </div>
            </div>

            <div class="summary_panel">
              <div class="eyebrow">GOODS DETAIL</div>
              <h1>{{ detail.title }}</h1>
              <p class="summary">{{ detail.abstract }}</p>

              <div class="price_box">
                <div class="price">￥{{ formatPrice(detail.price) }}</div>
                <div class="meta_row">
                  <span>销量 {{ detail.salesNum }}</span>
                  <span>浏览 {{ detail.lookCount }}</span>
                  <span>评论 {{ detail.commentCount }}</span>
                </div>
              </div>

              <div class="info_list">
                <div>分类：{{ detail.category }}</div>
                <div>库存：{{ detail.inventory === null || detail.inventory === undefined ? "不限库存" : detail.inventory }}</div>
                <div>收藏：{{ detail.isCollect ? "已收藏" : "未收藏" }}</div>
                <div>优惠：{{ detail.isGoodCoupon ? "可领取" : "暂无" }}</div>
              </div>

              <div v-if="detail.goodsDetailCoupon" class="coupon_box">
                <div class="coupon_title">商品优惠券</div>
                <div class="coupon_desc">
                  满 {{ formatPrice(detail.goodsDetailCoupon.threshold) }} 减 {{ formatPrice(detail.goodsDetailCoupon.couponPrice) }}
                </div>
              </div>

              <div v-if="detail.goodsConfigList?.length" class="config_box">
                <div
                  class="config_group"
                  v-for="group in detail.goodsConfigList"
                  :key="group.title"
                >
                  <div class="config_title">{{ group.title }}</div>
                  <div class="config_items">
                    <div class="config_item" v-for="item in group.subList" :key="item.title">
                      <img :src="item.image" :alt="item.title"></img>
                      <span>{{ item.title }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div class="buy_box">
                <a-input-number v-model="buyNum" :min="1" :max="detail.inventory || 99" />
                <a-button type="primary" size="large" :loading="adding" @click="addToCart">加入购物车</a-button>
                <a-button size="large" @click="goCart">去购物车</a-button>
              </div>
            </div>
          </div>
          <a-empty v-else description="未找到商品"/>
        </a-spin>
      </section>

      <section v-if="detail" class="comment_shell">
        <div class="section_head">
          <div>
            <h2>评论概览</h2>
            <span>和原型保持同样的信息节奏，先展示摘要和少量评论。</span>
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
            @click="changeCommentFilter(item.key)">
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
                <div class="comment_meta">满意度 {{ item.level }} 星</div>
              </div>
            </article>
          </div>
          <a-empty v-else description="暂无评论"/>
        </a-spin>
      </section>
    </f_main>
    <f_footer/>
  </div>
</template>

<style scoped lang="less">
.goods_detail_view {
  color: var(--color-text-1);
}

.detail_shell,
.comment_shell {
  margin: 20px max(16px, calc((100% - 1240px) / 2));
  padding: 30px;
  border-radius: 28px;
  background: #fff;
  border: 1px solid rgba(226, 232, 240, .95);
  box-shadow: 0 12px 34px rgba(15, 23, 42, .04);
}

.detail_shell {
  margin-top: 20px;
}

.back_btn {
  margin-bottom: 16px;
}

.detail_grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, .98fr);
  gap: 28px;
}

.gallery_panel {
  display: grid;
  gap: 14px;
}

.main_cover {
  aspect-ratio: 1;
  border-radius: 26px;
  overflow: hidden;
  background: var(--color-fill-1);

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
}

.thumb_list {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 10px;
  align-items: start;
}

.thumb_item {
  padding: 0;
  border: 0;
  border-radius: 14px;
  overflow: hidden;
  background: transparent;
  opacity: .72;
  cursor: pointer;

  &.active {
    opacity: 1;
    box-shadow: 0 0 0 2px rgba(255, 93, 114, .36);
  }

  img {
    width: 100%;
    aspect-ratio: 1;
    object-fit: cover;
    display: block;
  }
}

.summary_panel {
  padding: 4px 0;
}

.eyebrow {
  color: #ff5d72;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: .08em;
}

.summary_panel h1 {
  margin: 12px 0 10px;
  font-size: 38px;
  line-height: 1.15;
}

.summary {
  margin: 0;
  color: var(--color-text-2);
  line-height: 1.8;
}

.price_box {
  margin-top: 20px;
  padding: 22px;
  border-radius: 24px;
  background: linear-gradient(135deg, rgba(255, 93, 114, .1), rgba(255, 93, 114, .03));
}

.price {
  color: #e11d48;
  font-size: 34px;
  font-weight: 800;
}

.meta_row {
  margin-top: 10px;
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  color: var(--color-text-2);
}

.info_list {
  margin-top: 18px;
  display: grid;
  gap: 10px;
  color: var(--color-text-2);
}

.coupon_box,
.config_box {
  margin-top: 18px;
  padding: 20px;
  border-radius: 24px;
  background: var(--color-fill-1);
}

.coupon_title,
.config_title {
  font-weight: 700;
  margin-bottom: 10px;
}

.coupon_desc {
  color: var(--color-text-2);
}

.config_group + .config_group {
  margin-top: 16px;
}

.config_items {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.config_item {
  border-radius: 18px;
  background: var(--color-bg-1);
  border: 1px solid var(--color-border-2);
  overflow: hidden;

  img {
    width: 100%;
    aspect-ratio: 1;
    object-fit: cover;
    display: block;
  }

  span {
    display: block;
    padding: 10px 12px;
  }
}

.buy_box {
  margin-top: 22px;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
}

.section_head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 22px;

  h2 {
    margin: 0;
    font-size: 30px;
  }

  span {
    display: block;
    margin-top: 8px;
    color: var(--color-text-2);
  }
}

.level_grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 14px;
}

.comment_filter_row {
  margin: 18px 0 16px;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.comment_filter {
  border: 1px solid var(--color-border-2);
  background: var(--color-fill-1);
  border-radius: 999px;
  padding: 8px 14px;
  cursor: pointer;
  color: var(--color-text-2);

  &.active {
    color: #e11d48;
    border-color: rgba(225, 29, 72, .28);
    background: rgba(255, 93, 114, .1);
  }
}

.level_card {
  padding: 18px;
  border-radius: 20px;
  background: var(--color-fill-1);
  text-align: center;

  strong {
    display: block;
    font-size: 28px;
    color: #ff5d72;
  }

  span {
    color: var(--color-text-2);
  }
}

.comment_list {
  margin-top: 22px;
  display: grid;
  gap: 14px;
}

.comment_card {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 14px;
  padding: 16px;
  border-radius: 20px;
  border: 1px solid var(--color-border-2);
}

.comment_body {
  min-width: 0;
}

.comment_head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  color: var(--color-text-2);
}

.comment_content {
  margin-top: 10px;
  line-height: 1.75;
}

.comment_meta {
  margin-top: 8px;
  color: #ff5d72;
}

@media (max-width: 1100px) {
  .detail_grid,
  .level_grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .config_items {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .detail_shell,
  .comment_shell {
    margin-left: 16px;
    margin-right: 16px;
    padding: 20px;
  }

  .detail_shell {
    margin-top: 76px;
  }

  .detail_grid {
    grid-template-columns: 1fr;
  }

  .thumb_list,
  .level_grid,
  .config_items {
    grid-template-columns: 1fr;
  }

  .summary_panel h1 {
    font-size: 30px;
  }

  .section_head {
    align-items: flex-start;
    flex-direction: column;
  }

  .comment_head {
    flex-direction: column;
  }
}
</style>
