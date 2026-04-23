<script setup lang="ts">
import {computed, ref} from "vue";
import F_list, {type columnType} from "@/components/admin/f_list.vue";
import {commentAdminListApi, type commentType} from "@/api/comment_api";
import {dateTemFormat} from "@/utils/date";

const fListRef = ref<InstanceType<typeof F_list>>()
const userID = ref<number>()

const columns: columnType[] = [
  {title: "ID", dataIndex: "id", width: 80},
  {title: "用户", slotName: "user", width: 150},
  {title: "商品", slotName: "goods", width: 220},
  {title: "满意度", slotName: "level", width: 140},
  {title: "内容", slotName: "content"},
  {title: "图片", slotName: "images", width: 160},
  {title: "时间", slotName: "createdAt", width: 180},
]

const commentCount = computed(() => fListRef.value?.data.count || 0)

function searchByUser() {
  fListRef.value?.getList({
    userID: userID.value,
    page: 1,
  })
}

function resetSearch() {
  userID.value = undefined
  searchByUser()
}

function levelStatus(level: number) {
  if (level >= 4) {
    return "success"
  }
  if (level === 3) {
    return "warning"
  }
  return "danger"
}

function levelText(level: number) {
  if (level >= 4) {
    return "好评"
  }
  if (level === 3) {
    return "中评"
  }
  return "差评"
}
</script>

<template>
  <div class="comment_manage_view">
    <div class="comment_summary">
      <div>
        <div class="label">评价总数</div>
        <div class="value">{{ commentCount }}</div>
      </div>
      <div>
        <div class="label">当前筛选</div>
        <div class="value small">{{ userID ? `用户 ${userID}` : "全部用户" }}</div>
      </div>
    </div>

    <f_list
        ref="fListRef"
        :url="commentAdminListApi"
        :columns="columns"
        search-placeholder="接口暂不支持关键词搜索"
        no-add
        no-edit
        no-delete
        no-check
        no-action-group>
      <template #search_other>
        <div class="comment_filters">
          <a-input-number
              v-model="userID"
              :min="1"
              hide-button
              placeholder="用户ID"
              @press-enter="searchByUser"></a-input-number>
          <a-button type="primary" @click="searchByUser">筛选</a-button>
          <a-button @click="resetSearch">重置</a-button>
        </div>
      </template>

      <template #user="{record}:{record: commentType}">
        <div class="user_cell">
          <span class="nickname">{{ record.userNickname || "未知用户" }}</span>
          <span class="muted">ID：{{ record.userID }}</span>
        </div>
      </template>

      <template #goods="{record}:{record: commentType}">
        <div class="goods_cell">
          <span class="title">{{ record.goodsTitle || "未知商品" }}</span>
          <span class="muted">商品ID：{{ record.goodsID }}</span>
          <span class="muted" v-if="record.orderGoodsPrice">订单价：¥{{ record.orderGoodsPrice }}</span>
        </div>
      </template>

      <template #level="{record}:{record: commentType}">
        <div class="level_cell">
          <a-rate :model-value="record.level" readonly></a-rate>
          <a-tag :color="levelStatus(record.level)">{{ levelText(record.level) }}</a-tag>
        </div>
      </template>

      <template #content="{record}:{record: commentType}">
        <a-tooltip :content="record.content" position="top">
          <div class="content_text">{{ record.content || "无评价内容" }}</div>
        </a-tooltip>
      </template>

      <template #images="{record}:{record: commentType}">
        <div class="image_list" v-if="record.images?.length">
          <a-image-preview-group infinite>
            <a-image
                v-for="image in record.images.slice(0, 3)"
                :key="image"
                :src="image"
                :width="40"
                :height="40"
                fit="cover"></a-image>
          </a-image-preview-group>
          <a-tag v-if="record.images.length > 3">+{{ record.images.length - 3 }}</a-tag>
        </div>
        <span class="muted" v-else>无图</span>
      </template>

      <template #createdAt="{record}:{record: commentType}">
        {{ dateTemFormat(record.createdAt) }}
      </template>
    </f_list>
  </div>
</template>

<style lang="less">
.comment_manage_view {
  .comment_summary {
    display: flex;
    gap: 40px;
    padding: 20px 20px 0;

    .label {
      color: @color-text-2;
      font-size: 13px;
      margin-bottom: 6px;
    }

    .value {
      color: @color-text-1;
      font-size: 24px;
      font-weight: 600;

      &.small {
        font-size: 18px;
      }
    }
  }

  .comment_filters {
    display: flex;
    align-items: center;
    gap: 10px;

    .arco-input-number {
      width: 120px;
    }
  }

  .user_cell,
  .goods_cell {
    display: flex;
    flex-direction: column;
    line-height: 1.6;

    .nickname,
    .title {
      color: @color-text-1;
      font-weight: 500;
    }
  }

  .muted {
    color: @color-text-3;
    font-size: 12px;
  }

  .level_cell {
    display: flex;
    align-items: center;
    gap: 8px;

    .arco-rate {
      font-size: 16px;
      white-space: nowrap;
    }
  }

  .content_text {
    max-width: 360px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .image_list {
    display: flex;
    align-items: center;
    gap: 6px;

    .arco-image {
      border-radius: 4px;
      overflow: hidden;
      background-color: var(--color-fill-2);
    }
  }
}
</style>
