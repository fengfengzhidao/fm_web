<script setup lang="ts">
import {computed, onMounted, ref, watch} from "vue";
import {useRoute, useRouter} from "vue-router";
import {Message} from "@arco-design/web-vue";
import F_nav from "@/components/web/f_nav.vue";
import F_main from "@/components/web/f_main.vue";
import F_footer from "@/components/web/f_footer.vue";
import {goodsIndexListApi, type goodsIndexType} from "@/api/goods_api";

const route = useRoute()
const router = useRouter()
const keyword = ref("")
const loading = ref(false)
const goodsList = ref<goodsIndexType[]>([])

const quickKeys = [
  "数码家电",
  "品质生活",
  "服饰运动",
  "食品生鲜",
  "秒杀",
  "优惠券",
]

const currentKey = computed(() => (route.query.key as string || "").trim())

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

function openHome() {
  router.push({name: "web_home"})
}

function goGoodsDetail(id: number) {
  router.push({
    name: "web_goods_detail",
    params: {id},
  })
}

watch(currentKey, (value) => {
  keyword.value = value
  loadGoods(value)
}, {immediate: true})

onMounted(() => {
  keyword.value = currentKey.value
})
</script>

<template>
  <div class="web_search_view">
    <f_nav no-scroll/>
    <f_main>
      <section class="search_shell">
        <div class="search_head">
          <div>
            <div class="eyebrow">SEARCH</div>
            <h1>搜索商品</h1>
            <p>使用 goodsIndexListApi 的 key 参数进行查询，和原型里的搜索页保持一致。</p>
          </div>
          <a-button @click="openHome">返回首页</a-button>
        </div>

        <div class="search_bar">
          <a-input
            v-model="keyword"
            size="large"
            allow-clear
            placeholder="输入商品关键词后回车搜索"
            @press-enter="doSearch()"
          />
          <a-button type="primary" size="large" @click="doSearch()">搜索</a-button>
        </div>

        <div class="search_chips">
          <span>热门搜索：</span>
          <a-link v-for="item in quickKeys" :key="item" @click="doSearch(item)">{{ item }}</a-link>
        </div>
      </section>

      <section class="result_shell">
        <div class="result_head">
          <div>
            <h2>{{ currentKey ? `搜索结果：${currentKey}` : "全部商品" }}</h2>
            <span>{{ goodsList.length }} 件商品</span>
          </div>
          <a-link @click="loadGoods(currentKey)">刷新</a-link>
        </div>

        <a-spin :loading="loading" tip="加载中...">
          <div v-if="goodsList.length" class="result_grid">
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
          <a-empty v-else description="没有找到相关商品"/>
        </a-spin>
      </section>
    </f_main>
    <f_footer/>
  </div>
</template>

<style scoped lang="less">
.web_search_view {
  color: var(--color-text-1);
}

.search_shell,
.result_shell {
  margin: 20px max(16px, calc((100% - 1240px) / 2));
  padding: 18px 18px 20px;
  border-radius: 8px;
  background: #fff;
  border: 1px solid rgba(226, 232, 240, .95);
  box-shadow: 0 6px 18px rgba(15, 23, 42, .03);
}

.search_shell {
  margin-top: 20px;
}

.search_head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;

  h1 {
    margin: 8px 0 8px;
    font-size: 28px;
    line-height: 1.1;
  }

  p {
    margin: 0;
    color: var(--color-text-2);
    line-height: 1.85;
  }
}

.eyebrow {
  color: #ff5d72;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: .08em;
}

.search_bar {
  margin-top: 18px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 12px;

  :deep(.arco-input-wrapper) {
    height: 44px;
    border-radius: 14px;
    border-color: rgba(255, 93, 114, .26);
    box-shadow: none;
  }

  :deep(.arco-btn) {
    height: 44px;
    min-width: 120px;
    border-radius: 12px;
  }
}

.search_chips {
  margin-top: 18px;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  color: var(--color-text-2);
}

.result_head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 24px;

  h2 {
    margin: 0;
    font-size: 20px;
  }

  span {
    display: block;
    margin-top: 8px;
    color: var(--color-text-2);
  }
}

.result_grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 16px;
}

.goods_card {
  overflow: hidden;
  border-radius: 8px;
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
  padding: 12px;
}

.goods_title {
  font-size: 13px;
  line-height: 1.5;
  min-height: 39px;
}

.goods_price {
  margin-top: 10px;
  color: #e11d48;
  font-size: 16px;
  font-weight: 800;
}

.goods_meta {
  margin-top: 8px;
  color: var(--color-text-2);
}

@media (max-width: 1100px) {
  .result_grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .search_shell,
  .result_shell {
    margin-left: 16px;
    margin-right: 16px;
    padding: 20px;
  }

  .search_shell {
    margin-top: 76px;
  }

  .search_head {
    flex-direction: column;
  }

  .search_bar {
    grid-template-columns: 1fr;
  }

  .result_grid {
    grid-template-columns: 1fr;
  }

  .result_head {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
