<script setup lang="ts">
import {computed, ref, watch} from "vue";
import {useRoute, useRouter} from "vue-router";
import {Message} from "@arco-design/web-vue";
import {goodsIndexListApi, type goodsIndexType} from "@/api/goods_api";

const route = useRoute()
const router = useRouter()
const keyword = ref("")
const loading = ref(false)
const goodsList = ref<goodsIndexType[]>([])

const currentKey = computed(() => (route.query.key as string || "").trim())
const resultText = computed(() => currentKey.value || "全部商品")

function formatPrice(price?: number | null): string {
  if (price === null || price === undefined) {
    return "0.00"
  }
  return (price / 100).toFixed(price % 100 === 0 ? 0 : 2)
}

async function loadGoods(key?: string) {
  loading.value = true
  try {
    const res = await goodsIndexListApi({
      page: 1,
      limit: 24,
      key: key?.trim() || undefined,
    })
    if (res.code) {
      Message.error(res.msg)
      return
    }
    goodsList.value = res.data.list || []
  } catch (error) {
    console.error(error)
    Message.error("搜索结果加载失败")
  } finally {
    loading.value = false
  }
}

function doSearch(key?: string) {
  const value = (key ?? keyword.value).trim()
  router.push({
    name: "web_search",
    query: value ? {key: value} : {},
  })
}

function openGoodsDetail(id: number) {
  router.push({
    name: "web_goods_detail",
    params: {id},
  })
}

watch(currentKey, (value) => {
  keyword.value = value
  loadGoods(value)
}, {immediate: true})
</script>

<template>
  <div class="web_search_view">
    <div class="page_shell">
      <section class="search_surface">
        <section class="search_panel">
          <div class="search_intro">
            <div class="intro_badge">SEARCH</div>
            <h1>搜索商品</h1>
          </div>

          <div class="search_bar">
            <a-input
              v-model="keyword"
              allow-clear
              placeholder="搜索你需要的商品"
              @press-enter="doSearch()"
            />
            <a-button type="primary" @click="doSearch()">搜索</a-button>
          </div>
        </section>
      </section>

      <section class="result_surface">
        <div class="result_head">
          <div>
            <div class="result_title">搜索结果：{{ resultText }}</div>
            <div class="result_meta">{{ goodsList.length }} 件商品</div>
          </div>
          <div class="result_actions">
            <span class="result_filter">{{ currentKey || "全部" }}</span>
            <a-link @click="loadGoods(currentKey)">刷新商品</a-link>
          </div>
        </div>

        <a-spin :loading="loading" tip="加载中...">
          <div v-if="goodsList.length" class="result_grid">
            <article class="goods_card" v-for="item in goodsList" :key="item.id" @click="openGoodsDetail(item.id)">
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
          <div v-else class="empty_shell">
            <a-empty description="没有找到相关商品"/>
          </div>
        </a-spin>
      </section>
    </div>
  </div>
</template>

<style scoped lang="less">
.web_search_view {
  min-height: 100vh;
  color: var(--color-text-1);
  background: #fff;
}

.page_shell {
  width: min(1180px, calc(100% - 48px));
  margin: 0 auto;
  padding: 0 0 36px;
}

.search_surface,
.result_surface {
  border-radius: 18px;
}

.search_surface {
  padding: 0;
}

.result_surface {
  background: #fff;
  box-shadow: 0 20px 45px rgba(17, 24, 39, .05);
}

.search_panel {
  margin-top: 0;
  padding: 22px;
  border-radius: 16px;
  border: 1px solid #eceef2;
  background: linear-gradient(180deg, #fffafb, #ffffff 64%);
}

.search_intro {
  h1 {
    margin: 8px 0 10px;
    font-size: 34px;
    line-height: 1.05;
    color: #1f2937;
  }

  p {
    margin: 0;
    color: #6b7280;
    font-size: 14px;
    line-height: 1.75;
  }
}

.intro_badge {
  color: #ff647c;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: .12em;
}

.search_bar {
  margin-top: 18px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 92px;
  align-items: center;
  min-height: 48px;
  border-radius: 999px;
  border: 2px solid #ff8fa0;
  overflow: hidden;
  background: #fff;

  :deep(.arco-input-wrapper) {
    height: 44px;
    border: 0;
    box-shadow: none;
    padding-left: 14px;
    background: transparent;
  }

  :deep(.arco-input) {
    font-size: 13px;
  }

  :deep(.arco-btn) {
    height: 44px;
    margin: 2px;
    border-radius: 999px;
    font-weight: 600;
    background: linear-gradient(135deg, #ff7a8f, #ff627a);
  }
}

.result_surface {
  margin-top: 18px;
  padding: 0;
}

.result_head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 12px;
}

.result_title {
  color: #111827;
  font-size: 24px;
  font-weight: 700;
  line-height: 1.1;
}

.result_meta {
  margin-top: 8px;
  color: #9ca3af;
  font-size: 13px;
}

.result_actions {
  display: flex;
  align-items: center;
  gap: 14px;

  :deep(.arco-link) {
    color: #ff647c;
    font-weight: 600;
  }

  :deep(.arco-link:hover) {
    color: #ff4f69;
  }
}

.result_filter {
  display: inline-flex;
  align-items: center;
  height: 30px;
  padding: 0 14px;
  border-radius: 999px;
  background: #fff4f6;
  color: #ff6178;
  font-size: 12px;
  font-weight: 600;
}

.result_grid {
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

.empty_shell {
  padding: 24px 0 14px;
}

@media (max-width: 1100px) {
  .result_grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

@media (max-width: 900px) {
  .page_shell {
    width: calc(100% - 24px);
    padding-top: 12px;
  }

  .search_surface,
  .result_surface {
    border-radius: 14px;
  }

  .result_head {
    align-items: flex-start;
    flex-direction: column;
  }

  .result_grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .page_shell {
    width: calc(100% - 16px);
  }

  .search_surface {
    padding: 0;
  }

  .search_panel,
  .result_surface {
    padding-left: 0;
    padding-right: 0;
  }

  .result_title {
    font-size: 20px;
  }

  .search_bar {
    grid-template-columns: minmax(0, 1fr) 76px;
  }

  .result_grid {
    grid-template-columns: 1fr;
  }
}
</style>
