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
        <p>最近浏览过的商品。</p>
      </div>
      <a-tag color="orange">共 {{ count }} 条</a-tag>
    </div>

    <a-spin :loading="loading">
      <div v-if="list.length" class="goods_grid">
        <article v-for="item in list" :key="item.id" class="goods_card">
          <div class="body">
            <strong @click="openDetail(item)">{{ item.goodsTitle }}</strong>
            <span>商品ID：{{ item.goodsID }}</span>
            <span>浏览时间：{{ dateTimeFormat(item.createdAt) }}</span>
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
  align-items: flex-start;
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
  letter-spacing: .08em;
}

.goods_grid {
  display: grid;
  gap: 14px;
}

.goods_card {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  align-items: center;
  padding: 16px;
  border-radius: 20px;
  background: var(--color-fill-1);
  border: 1px solid var(--color-border-2);
}

.body {
  display: grid;
  gap: 6px;
}

.body strong {
  font-size: 18px;
  cursor: pointer;
}

.actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

@media (max-width: 768px) {
  .panel_head,
  .goods_card {
    flex-direction: column;
  }
}
</style>
