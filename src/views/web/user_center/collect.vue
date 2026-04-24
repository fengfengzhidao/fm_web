<script setup lang="ts">
import {computed, onMounted, ref} from "vue";
import {useRouter} from "vue-router";
import {Message} from "@arco-design/web-vue";
import {collectGoodsListApi, collectGoodsRemoveApi, type collectGoodsType} from "@/api/user_center_api";
import {dateTimeFormat} from "@/utils/date";

const router = useRouter()
const loading = ref(false)
const list = ref<collectGoodsType[]>([])

const count = computed(() => list.value.length)

async function loadList() {
  loading.value = true
  try {
    const res = await collectGoodsListApi({limit: 50, page: 1})
    if (res.code) {
      Message.error(res.msg)
      return
    }
    list.value = res.data.list || []
  } catch (error) {
    console.error(error)
    Message.error("收藏列表加载失败")
  } finally {
    loading.value = false
  }
}

function openDetail(item: collectGoodsType) {
  router.push({name: "web_goods_detail", params: {id: item.goodsID}})
}

async function removeItem(item: collectGoodsType) {
  const res = await collectGoodsRemoveApi([item.id])
  if (res.code) {
    Message.error(res.msg)
    return
  }
  Message.success("已取消收藏")
  await loadList()
}

onMounted(loadList)
</script>

<template>
  <div class="page_view">
    <div class="panel_head">
      <div>
        <div class="eyebrow">COLLECT</div>
        <h2>我的收藏</h2>
        <p>保存过的商品列表。</p>
      </div>
      <a-tag color="arcoblue">共 {{ count }} 件</a-tag>
    </div>

    <a-spin :loading="loading">
      <div v-if="list.length" class="goods_grid">
        <article v-for="item in list" :key="item.id" class="goods_card">
          <div class="cover" @click="openDetail(item)">
            <span>{{ (item.goodsTitle || "商").slice(0, 1) }}</span>
          </div>
          <div class="body">
            <strong @click="openDetail(item)">{{ item.goodsTitle }}</strong>
            <span>商品ID：{{ item.goodsID }}</span>
            <span>收藏时间：{{ dateTimeFormat(item.createdAt) }}</span>
          </div>
          <div class="actions">
            <a-button type="primary" @click="openDetail(item)">查看商品</a-button>
            <a-popconfirm content="确定取消收藏吗？" @ok="removeItem(item)">
              <a-button status="danger">取消收藏</a-button>
            </a-popconfirm>
          </div>
        </article>
      </div>
      <a-empty v-else description="暂无收藏"/>
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
  font-size: 28px;
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
  display: grid;
  grid-template-columns: 120px minmax(0, 1fr) auto;
  gap: 14px;
  align-items: center;
  padding: 16px;
  border-radius: 20px;
  background: var(--color-bg-1);
  border: 1px solid var(--color-border-2);
  box-shadow: 0 8px 24px rgba(15, 23, 42, .03);
}

.cover {
  width: 120px;
  height: 120px;
  border-radius: 18px;
  overflow: hidden;
  background: linear-gradient(135deg, rgba(255, 93, 114, .08), rgba(255, 93, 114, .02));
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ff5d72;
  font-size: 40px;
  font-weight: 800;
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
    grid-template-columns: 1fr;
  }

  .goods_card {
    display: grid;
  }

  .actions {
    justify-content: flex-start;
  }
}
</style>
