<script setup lang="ts">
import {onMounted, ref} from "vue";
import {Message} from "@arco-design/web-vue";
import {commentUserListApi, type commentType} from "@/api/comment_api";
import {dateTemFormat} from "@/utils/date";
import {commentLevelText, formatPrice} from "@/views/web/user_center/utils";

const loading = ref(false)
const list = ref<commentType[]>([])

async function loadList() {
  loading.value = true
  try {
    const res = await commentUserListApi({limit: 50, page: 1})
    if (res.code) {
      Message.error(res.msg)
      return
    }
    list.value = res.data.list || []
  } catch (error) {
    console.error(error)
    Message.error("评价列表加载失败")
  } finally {
    loading.value = false
  }
}

onMounted(loadList)
</script>

<template>
  <div class="page_view">
    <div class="panel_head">
      <div>
        <div class="eyebrow">COMMENT</div>
        <h2>我的评价</h2>
        <p>集中查看已经发布过的评价记录，便于回顾商品体验和下单价格。</p>
      </div>
    </div>

    <a-spin :loading="loading">
      <div v-if="list.length" class="comment_list">
        <article v-for="item in list" :key="item.id" class="comment_card">
          <div class="comment_top">
            <strong>{{ item.goodsTitle || `商品 #${item.goodsID}` }}</strong>
            <span class="comment_level">{{ commentLevelText(item.level) }}</span>
          </div>
          <div class="comment_body">{{ item.content || "无评价内容" }}</div>
          <div v-if="item.images?.length" class="image_list">
            <a-image v-for="img in item.images.slice(0, 4)" :key="img" :src="img" :width="56" :height="56" fit="cover"/>
          </div>
          <div class="comment_foot">
            <span>订单商品ID：{{ item.orderGoodsID }}</span>
            <span v-if="item.orderGoodsPrice">下单价 ￥{{ formatPrice(item.orderGoodsPrice) }}</span>
            <span>{{ dateTemFormat(item.createdAt) }}</span>
          </div>
        </article>
      </div>
      <a-empty v-else description="暂无评价"/>
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
.comment_foot span {
  color: var(--color-text-2);
}

.eyebrow {
  color: #ff5d72;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: .12em;
}

.comment_list {
  display: grid;
  gap: 14px;
}

.comment_card {
  padding: 18px;
  border-radius: 18px;
  background: linear-gradient(180deg, #fffafb, #fff);
  border: 1px solid #eceef2;
  box-shadow: 0 12px 30px rgba(17, 24, 39, .04);
}

.comment_top,
.comment_foot {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
}

.comment_level {
  flex: 0 0 auto;
  padding: 7px 12px;
  border-radius: 999px;
  color: #ff647c;
  font-size: 12px;
  font-weight: 700;
  background: #fff2f5;
  border: 1px solid #ffd4dc;
}

.comment_body {
  margin: 12px 0;
  line-height: 1.8;
  padding: 14px 16px;
  border-radius: 16px;
  background: #fafafb;
}

.image_list {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}

@media (max-width: 768px) {
  .comment_top,
  .comment_foot {
    flex-direction: column;
  }
}
</style>
