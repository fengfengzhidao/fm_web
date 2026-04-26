<script setup lang="ts">
import {onMounted, ref} from "vue";
import {useRouter} from "vue-router";
import F_list, {type columnType} from "@/components/admin/f_list.vue";
import {
  goodsAdminListApi,
  goodsCategoryOptionsApi,
  goodsStatusUpdateApi,
  type goodsType,
} from "@/api/goods_api";
import {Message} from "@arco-design/web-vue";
import {dateTemFormat} from "@/utils/date";
import type {optionsType} from "@/api";

const router = useRouter()
const fListRef = ref<InstanceType<typeof F_list>>()
const categoryOptions = ref<optionsType[]>([])
const selectedCategory = ref<string | undefined>()

const columns: columnType[] = [
  {title: "ID", dataIndex: "id", width: 80},
  {title: "主图", slotName: "cover", width: 90},
  {title: "商品信息", slotName: "info"},
  {title: "价格", slotName: "price", width: 110},
  {title: "库存", slotName: "inventory", width: 100},
  {title: "状态", slotName: "status", width: 90},
  {title: "数据", slotName: "stats", width: 180},
  {title: "时间", slotName: "createdAt", width: 180},
  {title: "操作", slotName: "action", width: 220},
]

async function initFilterGroup() {
  const res = await goodsCategoryOptionsApi()
  if (res.code) {
    Message.error(res.msg)
    return
  }
  categoryOptions.value = res.data || []
}

function applyCategoryFilter(value: string | number | boolean | Record<string, any> | Array<string | number | boolean | Record<string, any>> | undefined) {
  const category = typeof value === "string" ? value : undefined
  selectedCategory.value = category
  fListRef.value?.getList({
    page: 1,
    category,
  })
}

function openCreate() {
  router.push({name: "goodsCreate"})
}

function openEdit(record: goodsType) {
  router.push({name: "goodsEdit", params: {id: record.id}})
}

async function updateStatus(record: goodsType) {
  const status = record.status === 1 ? 2 : 1
  const res = await goodsStatusUpdateApi({id: record.id, status})
  if (res.code) {
    Message.error(res.msg)
    return
  }
  Message.success(res.msg)
  fListRef.value?.getList()
}

onMounted(() => {
  initFilterGroup()
})

function formatAbstractPreview(content?: string) {
  if (!content) {
    return "无简介"
  }

  return content
    .replace(/!\[[^\]]*]\([^)]*\)/g, " ")
    .replace(/\[[^\]]*]\([^)]*\)/g, " ")
    .replace(/[`>#*_~-]/g, " ")
    .replace(/\s+/g, " ")
    .trim() || "无简介"
}
</script>

<template>
  <div class="goods_manage_view">
    <f_list
        ref="fListRef"
        :url="goodsAdminListApi"
        :columns="columns"
        add-label="发布商品"
        edit-label="编辑"
        search-placeholder="搜索商品"
        @add="openCreate"
        @edit="openEdit">
      <template #search_other>
        <a-select
            v-model="selectedCategory"
            :options="categoryOptions"
            allow-clear
            style="width: 150px"
            placeholder="商品分类"
            @change="applyCategoryFilter"></a-select>
      </template>
      <template #cover="{record}:{record: goodsType}">
        <a-image
            v-if="record.images?.length"
            :src="record.images[0]"
            :width="72"
            :height="41"
            fit="cover"></a-image>
        <a-avatar v-else shape="square" :size="41">无图</a-avatar>
      </template>
      <template #info="{record}:{record: goodsType}">
        <div class="goods_info">
          <strong>{{ record.title }}</strong>
          <span>{{ record.category || "未分类" }}</span>
          <a-tooltip :content="record.abstract || '无简介'" position="top">
            <p>{{ formatAbstractPreview(record.abstract) }}</p>
          </a-tooltip>
        </div>
      </template>
      <template #price="{record}:{record: goodsType}">
        ¥{{ (record.price / 100).toFixed(2) }}
      </template>
      <template #inventory="{record}:{record: goodsType}">
        {{ record.inventory === null || record.inventory === undefined ? "无限" : record.inventory }}
      </template>
      <template #status="{record}:{record: goodsType}">
        <a-tag :color="record.status === 1 ? 'green' : 'gray'">{{ record.status === 1 ? "上架" : "下架" }}</a-tag>
      </template>
      <template #stats="{record}:{record: goodsType}">
        <div class="stats_cell">
          <span>浏览 {{ record.lookCount }}</span>
          <span>评价 {{ record.commentCount }}</span>
          <span>销量 {{ record.salesNum }}</span>
        </div>
      </template>
      <template #createdAt="{record}:{record: goodsType}">
        {{ dateTemFormat(record.createdAt) }}
      </template>
      <template #action_left="{record}:{record: goodsType}">
        <a-button type="primary" status="warning" @click="updateStatus(record)">
          {{ record.status === 1 ? "下架" : "上架" }}
        </a-button>
      </template>
    </f_list>
  </div>
</template>

<style lang="less">
.goods_manage_view {
  .goods_info {
    display: flex;
    flex-direction: column;
    line-height: 1.6;

    strong {
      color: @color-text-1;
    }

    span,
    p {
      color: @color-text-2;
      margin: 0;
    }

    p {
      display: -webkit-box;
      overflow: hidden;
      text-overflow: ellipsis;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      max-width: 100%;
      line-height: 1.7;
      word-break: break-word;
    }
  }

  .stats_cell {
    display: flex;
    flex-direction: column;
    color: @color-text-2;
    line-height: 1.7;
  }

  .arco-image {
    border-radius: 4px;
    overflow: hidden;
  }
}
</style>
