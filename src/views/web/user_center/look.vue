<script setup lang="ts">
import {computed, onMounted, ref} from "vue";
import dayjs from "dayjs";
import {useRouter} from "vue-router";
import {Message} from "@arco-design/web-vue";
import {lookGoodsListApi, lookGoodsRemoveApi, type lookGoodsType} from "@/api/user_center_api";
import {dateTimeFormat} from "@/utils/date";

const router = useRouter()
const loading = ref(false)
const list = ref<lookGoodsType[]>([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(12)
const keyword = ref("")

const count = computed(() => total.value)
const groupedList = computed(() => {
  const groups: Array<{date: string; items: lookGoodsType[]}> = []
  const map = new Map<string, lookGoodsType[]>()

  list.value.forEach((item) => {
    const key = dayjs(item.createdAt).format("YYYY-MM-DD")
    if (!map.has(key)) {
      map.set(key, [])
    }
    map.get(key)!.push(item)
  })

  map.forEach((items, date) => {
    groups.push({date, items})
  })

  return groups
})

async function loadList() {
  loading.value = true
  try {
    const res = await lookGoodsListApi({
      limit: pageSize.value,
      page: currentPage.value,
      key: keyword.value.trim() || undefined,
    })
    if (res.code) {
      Message.error(res.msg)
      return
    }
    list.value = res.data.list || []
    total.value = res.data.count || 0
  } catch (error) {
    console.error(error)
    Message.error("足迹列表加载失败")
  } finally {
    loading.value = false
  }
}

function openDetail(item: lookGoodsType) {
  router.push({name: "web_goods_detail", params: {id: item.goodsID}})
}

function formatPrice(price?: number | null): string {
  if (price === null || price === undefined) {
    return "0.00"
  }
  return (price / 100).toFixed(price % 100 === 0 ? 0 : 2)
}

async function removeItem(item: lookGoodsType) {
  const res = await lookGoodsRemoveApi([item.id])
  if (res.code) {
    Message.error(res.msg)
    return
  }
  Message.success("已删除足迹")
  if (list.value.length === 1 && currentPage.value > 1) {
    currentPage.value -= 1
  }
  await loadList()
}

async function handleSearch() {
  currentPage.value = 1
  await loadList()
}

async function handlePageChange(page: number) {
  currentPage.value = page
  await loadList()
}

onMounted(loadList)
</script>

<template>
  <div class="page_view">
    <div class="panel_head">
      <div>
        <div class="eyebrow">LOOK</div>
        <h2>我的足迹</h2>
      </div>
      <div class="summary_badge">共 {{ count }} 条</div>
    </div>

    <div class="toolbar">
      <a-input-search
        v-model="keyword"
        allow-clear
        class="search_input"
        placeholder="搜索浏览过的商品"
        @search="handleSearch"
        @press-enter="handleSearch"
        @clear="handleSearch"
      />
    </div>

    <a-spin :loading="loading">
      <div v-if="groupedList.length" class="look_group_list">
        <section v-for="group in groupedList" :key="group.date" class="look_group">
          <div class="group_head">
            <h3>{{ group.date }}</h3>
            <span>({{ group.items.length }}件宝贝)</span>
          </div>

          <div class="goods_grid">
            <article v-for="item in group.items" :key="item.id" class="goods_card">
              <div class="cover" @click="openDetail(item)">
                <img :src="item.cover" :alt="item.title || item.goodsTitle">
              </div>
              <div class="body">
                <strong class="goods_title" @click="openDetail(item)">{{ item.title || item.goodsTitle }}</strong>
                <div class="meta_row">
                  <span class="price">￥ {{ formatPrice(item.price) }}</span>
                  <span class="sales">{{ item.salesNum }}人购买</span>
                </div>
              </div>
              <div class="card_actions">
                <a-button type="text" size="mini" @click="openDetail(item)">查看</a-button>
                <a-popconfirm content="确定删除足迹吗？" @ok="removeItem(item)">
                  <a-button type="text" size="mini" status="danger">删除</a-button>
                </a-popconfirm>
              </div>
            </article>
          </div>
        </section>
      </div>
      <a-empty v-else :description="keyword ? '没有找到相关足迹' : '暂无足迹'"/>
    </a-spin>

    <div v-if="count > pageSize" class="pager_wrap">
      <a-pagination
        :total="count"
        :current="currentPage"
        :page-size="pageSize"
        :show-total="true"
        @change="handlePageChange"
      />
    </div>
  </div>
</template>

<style scoped lang="less">
.page_view {
  display: grid;
  gap: 18px;
}

.panel_head {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: center;
}

.panel_head h2 {
  margin: 8px 0 8px;
  font-size: 30px;
}

.panel_head p,
.body span {
  color: var(--color-text-2);
}

.eyebrow {
  color: #ff5d72;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: .12em;
}

.summary_badge {
  min-width: 104px;
  padding: 12px 18px;
  border-radius: 999px;
  text-align: center;
  color: #ff647c;
  font-size: 13px;
  font-weight: 700;
  background: linear-gradient(180deg, #fff7f9, #fff);
  border: 1px solid #ffd7df;
}

.toolbar {
  display: flex;
  justify-content: flex-end;
}

.search_input {
  width: min(320px, 100%);

  :deep(.arco-input-wrapper) {
    border-radius: 999px;
    border-color: #ffd7df;
    background: #fffafb;
  }

  :deep(.arco-input-wrapper:hover),
  :deep(.arco-input-wrapper-focus) {
    border-color: #ffb9c6;
    box-shadow: 0 0 0 2px rgba(255, 100, 124, .08);
  }

  :deep(.arco-input-search-btn) {
    background: linear-gradient(135deg, #ff7a8f, #ff627a);
    border-radius: 999px;
  }
}

.look_group_list {
  display: grid;
  gap: 22px;
}

.look_group {
  display: grid;
  gap: 12px;
}

.group_head {
  display: flex;
  align-items: center;
  gap: 8px;

  h3 {
    margin: 0;
    color: #374151;
    font-size: 24px;
    font-weight: 700;
  }

  span {
    color: #6b7280;
    font-size: 14px;
  }
}

.goods_grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 16px 18px;
}

.goods_card {
  display: grid;
  gap: 8px;
  align-content: start;
}

.cover {
  width: 100%;
  aspect-ratio: 16 / 9;
  border-radius: 8px;
  overflow: hidden;
  background: #f7f8fa;
  border: 1px solid #eceef2;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    cursor: pointer;
  }
}

.body {
  display: grid;
  gap: 6px;
}

.goods_title {
  font-size: 14px;
  line-height: 1.45;
  cursor: pointer;
  color: #374151;
  display: -webkit-box;
  overflow: hidden;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.meta_row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font-size: 12px;
}

.price {
  color: #ff5d72;
  font-size: 15px;
  font-weight: 700;
}

.sales {
  color: #6b7280;
}

.card_actions {
  display: flex;
  gap: 4px;
  align-items: center;
}

.pager_wrap {
  display: flex;
  justify-content: flex-end;

  :deep(.arco-pagination-item-active),
  :deep(.arco-pagination-item:hover) {
    border-color: #ffccd5;
    color: #ff647c;
  }

  :deep(.arco-pagination-item-active) {
    background: #fff2f5;
  }

  :deep(.arco-pagination-item-active:hover) {
    background: #fff0f4;
  }
}

@media (max-width: 1100px) {
  .goods_grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

@media (max-width: 900px) {
  .goods_grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .panel_head,
  .toolbar {
    justify-content: flex-start;
  }

  .goods_card {
    grid-template-columns: 1fr;
  }

  .pager_wrap {
    justify-content: flex-start;
  }
}

@media (max-width: 640px) {
  .goods_grid {
    grid-template-columns: 1fr;
  }

  .group_head {
    h3 {
      font-size: 20px;
    }
  }
}
</style>
