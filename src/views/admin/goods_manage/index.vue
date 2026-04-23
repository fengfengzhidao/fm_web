<script setup lang="ts">
import {onMounted, reactive, ref} from "vue";
import F_list, {type columnType} from "@/components/admin/f_list.vue";
import {
  goodsAdminListApi,
  goodsCategoryOptionsApi,
  goodsCreateApi,
  goodsStatusUpdateApi,
  goodsUpdateApi,
  type goodsType,
} from "@/api/goods_api";
import {Message} from "@arco-design/web-vue";
import {dateTemFormat} from "@/utils/date";
import type {optionsType} from "@/api";

interface GoodsForm {
  id?: number
  title: string
  videoPath: string
  imageText: string
  priceYuan: number
  inventory?: number
  category: string
  abstract: string
  goodsConfigText: string
}

const fListRef = ref<InstanceType<typeof F_list>>()
const formRef = ref()
const visible = ref(false)
const isEdit = ref(false)
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

const form = reactive<GoodsForm>({
  title: "",
  videoPath: "",
  imageText: "",
  priceYuan: 0,
  inventory: undefined,
  category: "",
  abstract: "",
  goodsConfigText: "[]",
})

function closeModal() {
  visible.value = false
  isEdit.value = false
  resetForm()
}

function resetForm() {
  Object.assign(form, {
    id: undefined,
    title: "",
    videoPath: "",
    imageText: "",
    priceYuan: 0,
    inventory: undefined,
    category: "",
    abstract: "",
    goodsConfigText: "[]",
  })
  formRef.value?.clearValidate()
}

function openAdd() {
  isEdit.value = false
  resetForm()
  visible.value = true
}

function openEdit(record: goodsType) {
  isEdit.value = true
  Object.assign(form, {
    id: record.id,
    title: record.title,
    videoPath: record.videoPath || "",
    imageText: record.images?.join("\n") || "",
    priceYuan: Number((record.price / 100).toFixed(2)),
    inventory: record.inventory === null ? undefined : record.inventory,
    category: record.category,
    abstract: record.abstract,
    goodsConfigText: JSON.stringify(record.goodsConfigList || [], null, 2),
  })
  visible.value = true
}

async function initFilterGroup() {
  const res = await goodsCategoryOptionsApi()
  if (res.code) {
    Message.error(res.msg)
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

function onCategoryChange(event: Event) {
  const target = event.target as HTMLSelectElement
  applyCategoryFilter(target.value || undefined)
}

function buildPayload() {
  let goodsConfigList = []
  try {
    goodsConfigList = JSON.parse(form.goodsConfigText || "[]")
  } catch (e) {
    Message.error("高级配置必须是合法 JSON")
    return
  }
  const images = form.imageText.split(/\r?\n/).map((item) => item.trim()).filter(Boolean)
  return {
    id: form.id as number,
    title: form.title,
    videoPath: form.videoPath || undefined,
    images,
    price: Math.round(Number(form.priceYuan) * 100),
    inventory: form.inventory === undefined || form.inventory === null ? undefined : Number(form.inventory),
    category: form.category,
    abstract: form.abstract,
    goodsConfigList,
  }
}

async function submit(done: (closed: boolean) => void) {
  const error = await formRef.value.validate()
  if (error) {
    done(false)
    return
  }
  const payload = buildPayload()
  if (!payload) {
    done(false)
    return
  }
  const res = isEdit.value ? await goodsUpdateApi(payload) : await goodsCreateApi(payload)
  if (res.code) {
    Message.error(res.msg)
    done(false)
    return
  }
  Message.success(res.msg)
  fListRef.value?.getList()
  closeModal()
  done(true)
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

onMounted(initFilterGroup)
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
        @add="openAdd"
        @edit="openEdit">
      <template #search_other>
        <div class="goods_filter">
          <select :value="selectedCategory || ''" class="goods_category_select" @change="onCategoryChange">
            <option value="">商品分类</option>
            <option v-for="item in categoryOptions" :key="item.value" :value="item.value">
              {{ item.label }}
            </option>
          </select>
        </div>
      </template>
      <template #cover="{record}:{record: goodsType}">
        <a-image
            v-if="record.images?.length"
            :src="record.images[0]"
            :width="56"
            :height="56"
            fit="cover"></a-image>
        <a-avatar v-else shape="square">无图</a-avatar>
      </template>
      <template #info="{record}:{record: goodsType}">
        <div class="goods_info">
          <strong>{{ record.title }}</strong>
          <span>{{ record.category || "未分类" }}</span>
          <p>{{ record.abstract || "无简介" }}</p>
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

    <a-modal
        v-if="visible"
        v-model:visible="visible"
        :title="isEdit ? '编辑商品' : '发布商品'"
        :on-before-ok="submit"
        @cancel="closeModal"
        width="720px">
      <a-form ref="formRef" :model="form" auto-label-width>
        <a-form-item field="title" label="商品名称" :rules="[{required: true, message: '请输入商品名称'}]">
          <a-input v-model="form.title" placeholder="商品名称"></a-input>
        </a-form-item>
        <a-form-item field="category" label="商品分类" :rules="[{required: true, message: '请输入商品分类'}]">
          <a-input v-model="form.category" placeholder="例如：手机数码"></a-input>
        </a-form-item>
        <a-form-item field="priceYuan" label="商品价格" :rules="[{required: true, message: '请输入商品价格'}]">
          <a-input-number v-model="form.priceYuan" :min="0.01" :precision="2" placeholder="单位：元"></a-input-number>
        </a-form-item>
        <a-form-item field="inventory" label="库存">
          <a-input-number v-model="form.inventory" :min="0" placeholder="不填表示无限库存"></a-input-number>
        </a-form-item>
        <a-form-item field="imageText" label="商品主图" :rules="[{required: true, message: '请输入至少一张主图地址'}]">
          <a-textarea v-model="form.imageText" placeholder="每行一个图片地址，最多 9 张" :auto-size="{minRows: 3, maxRows: 5}"></a-textarea>
        </a-form-item>
        <a-form-item field="videoPath" label="视频地址">
          <a-input v-model="form.videoPath" placeholder="可选"></a-input>
        </a-form-item>
        <a-form-item field="abstract" label="商品简介">
          <a-textarea v-model="form.abstract" placeholder="商品简介" :auto-size="{minRows: 2, maxRows: 4}"></a-textarea>
        </a-form-item>
        <a-form-item field="goodsConfigText" label="高级配置">
          <a-textarea v-model="form.goodsConfigText" placeholder="JSON 数组" :auto-size="{minRows: 4, maxRows: 8}"></a-textarea>
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<style lang="less">
.goods_manage_view {
  .goods_filter {
    display: flex;
    align-items: center;
  }

  .goods_category_select {
    min-width: 150px;
    height: 32px;
    border: 1px solid var(--color-border-2);
    border-radius: 4px;
    background: var(--color-bg-1);
    color: var(--color-text-1);
    padding: 0 10px;
    outline: none;
  }

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
