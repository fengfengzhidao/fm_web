<script setup lang="ts">
import {computed, onMounted, ref} from "vue";
import {useRouter} from "vue-router";
import {Message} from "@arco-design/web-vue";
import {lookGoodsListApi, lookGoodsRemoveApi, type lookGoodsType} from "@/api/user_center_api";
import {dateTimeFormat} from "@/utils/date";

const router = useRouter()
const loading = ref(false)
const list = ref<lookGoodsType[]>([])
const count = computed(() => list.value.length)

async function loadList() {
  loading.value = true
  try {
    const res = await lookGoodsListApi({limit: 50, page: 1})
    if (res.code) {
      Message.error(res.msg)
      return
    }
    list.value = res.data.list || []
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

    <a-spin :loading="loading">
      <div v-if="list.length" class="goods_grid">
        <article v-for="item in list" :key="item.id" class="goods_card">
          <div class="cover">
            <img :src="item.cover" :alt="item.title || item.goodsTitle" @click="openDetail(item)">
          </div>
          <div class="body">
            <div class="body_top">
              <strong @click="openDetail(item)">{{ item.title || item.goodsTitle }}</strong>
              <span class="status_chip">最近浏览</span>
            </div>
            <div class="meta_list">
              <span>价格：￥{{ formatPrice(item.price) }}</span>
              <span>销量：{{ item.salesNum }}</span>
              <span>商品ID：{{ item.goodsID }}</span>
              <span>浏览时间：{{ dateTimeFormat(item.createdAt) }}</span>
            </div>
          </div>
          <div class="actions">
            <a-button type="primary" @click="openDetail(item)">查看商品</a-button>
            <a-popconfirm content="确定删除足迹吗？" @ok="removeItem(item)">
              <a-button status="danger">删除</a-button>
            </a-popconfirm>
          </div>
        </article>
      </div>
      <a-empty v-else description="暂无足迹"/>
    </a-spin>
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

.goods_grid {
  display: grid;
  gap: 14px;
}

.goods_card {
  display: grid;
  grid-template-columns: 120px minmax(0, 1fr) auto;
  gap: 16px;
  align-items: center;
  padding: 18px;
  border-radius: 18px;
  background: linear-gradient(180deg, #fffafb, #fff);
  border: 1px solid #eceef2;
  box-shadow: 0 12px 30px rgba(17, 24, 39, .04);
}

.cover {
  width: 120px;
  aspect-ratio: 16 / 9;
  border-radius: 20px;
  overflow: hidden;
  background: #f7f8fa;
  border: 1px solid #ffe1e7;

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
  gap: 10px;
}

.body_top {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
}

.body strong {
  font-size: 18px;
  cursor: pointer;
}

.status_chip {
  flex: 0 0 auto;
  padding: 6px 10px;
  border-radius: 999px;
  color: #ff647c;
  font-size: 11px;
  font-weight: 700;
  background: #fff2f5;
  border: 1px solid #ffd4dc;
}

.meta_list {
  display: grid;
  gap: 6px;
}

.actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

@media (max-width: 768px) {
  .goods_card {
    grid-template-columns: 1fr;
  }

  .cover {
    width: 100%;
    height: auto;
    aspect-ratio: 16 / 9;
  }

  .body_top {
    align-items: flex-start;
    flex-direction: column;
  }

  .actions {
    justify-content: flex-start;
  }
}
</style>
