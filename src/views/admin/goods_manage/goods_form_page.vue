<script setup lang="ts">
import {computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch} from "vue";
import {useRoute, useRouter} from "vue-router";
import {Message} from "@arco-design/web-vue";
import type {RequestOption, UploadRequest} from "@arco-design/web-vue";
import {MdEditor} from "md-editor-v3";
import "md-editor-v3/lib/style.css";
import {imageUploadApi} from "@/api/image_api";
import {
  goodsCreateApi,
  goodsDetailApi,
  goodsUpdateApi,
  type goodsConfigType,
  type goodsSubConfigType,
  type goodsType,
} from "@/api/goods_api";

interface GoodsForm {
  id?: number
  title: string
  videoPath: string
  images: string[]
  priceYuan: number
  inventory?: number
  category: string
  abstract: string
  goodsConfigList: goodsConfigType[]
}

const route = useRoute()
const router = useRouter()
const formRef = ref()
const goodsFormLeftRef = ref<HTMLElement | null>(null)
const editorCardRef = ref<HTMLElement | null>(null)
const loading = ref(false)
const saving = ref(false)
const editorCardHeight = ref("auto")
const isEdit = computed(() => route.name === "goodsEdit")
const pageTitle = computed(() => isEdit.value ? "编辑商品" : "发布商品")
const pageDesc = computed(() => isEdit.value ? "修改商品基础信息、Markdown 简介和高级配置。" : "填写商品基础信息、Markdown 简介和高级配置。")

function createEmptySub(): goodsSubConfigType {
  return {
    title: "",
    image: "",
  }
}

function createEmptyGroup(): goodsConfigType {
  return {
    title: "",
    subList: [createEmptySub()],
  }
}

function createEmptyForm(): GoodsForm {
  return {
    id: undefined,
    title: "",
    videoPath: "",
    images: [""],
    priceYuan: 0,
    inventory: undefined,
    category: "",
    abstract: "",
    goodsConfigList: [createEmptyGroup()],
  }
}

const form = reactive<GoodsForm>(createEmptyForm())

function resetForm() {
  Object.assign(form, createEmptyForm())
  formRef.value?.clearValidate?.()
}

function addImage(index?: number) {
  const insertIndex = typeof index === "number" ? index + 1 : form.images.length
  form.images.splice(insertIndex, 0, "")
}

function removeImage(index: number) {
  if (form.images.length === 1) {
    form.images[0] = ""
    return
  }
  form.images.splice(index, 1)
}

function addGroup(index?: number) {
  const insertIndex = typeof index === "number" ? index + 1 : form.goodsConfigList.length
  form.goodsConfigList.splice(insertIndex, 0, createEmptyGroup())
}

function removeGroup(index: number) {
  if (form.goodsConfigList.length === 1) {
    form.goodsConfigList.splice(0, 1, createEmptyGroup())
    return
  }
  form.goodsConfigList.splice(index, 1)
}

function addSub(groupIndex: number, subIndex?: number) {
  const insertIndex = typeof subIndex === "number" ? subIndex + 1 : form.goodsConfigList[groupIndex].subList.length
  form.goodsConfigList[groupIndex].subList.splice(insertIndex, 0, createEmptySub())
}

function removeSub(groupIndex: number, subIndex: number) {
  const subList = form.goodsConfigList[groupIndex].subList
  if (subList.length === 1) {
    subList.splice(0, 1, createEmptySub())
    return
  }
  subList.splice(subIndex, 1)
}

function applyImagePath(target: {type: "main"; index: number} | {type: "sub"; groupIndex: number; subIndex: number}, path: string) {
  if (target.type === "main") {
    form.images[target.index] = path
    return
  }
  form.goodsConfigList[target.groupIndex].subList[target.subIndex].image = path
}

function createImageUploadRequest(target: {type: "main"; index: number} | {type: "sub"; groupIndex: number; subIndex: number}) {
  return (option: RequestOption): UploadRequest => {
    const file = option.fileItem.file
    if (!file) {
      const msg = "请选择图片文件"
      Message.error(msg)
      option.onError(msg)
      return {}
    }

    let aborted = false
    imageUploadApi(file).then((res) => {
      if (aborted) {
        return
      }
      if (res.code) {
        Message.error(res.msg)
        option.onError(res.msg)
        return
      }

      applyImagePath(target, res.data)
      Message.success(res.msg)
      option.onSuccess(res)
    }).catch((error) => {
      if (aborted) {
        return
      }
      console.error(error)
      Message.error("图片上传失败")
      option.onError(error)
    })

    return {
      abort() {
        aborted = true
      },
    }
  }
}

function syncEditorHeight() {
  const leftBox = goodsFormLeftRef.value
  const editorBox = editorCardRef.value
  if (!leftBox || !editorBox) {
    return
  }

  const configCard = leftBox.querySelector(".form_card:last-of-type") as HTMLElement | null
  if (!configCard) {
    return
  }

  const editorRect = editorBox.getBoundingClientRect()
  const configRect = configCard.getBoundingClientRect()
  const nextHeight = Math.max(0, Math.round(configRect.bottom - editorRect.top))
  editorCardHeight.value = `${nextHeight}px`
}

let resizeObserver: ResizeObserver | null = null

onMounted(async () => {
  await nextTick()
  syncEditorHeight()

  if (typeof ResizeObserver !== "undefined" && goodsFormLeftRef.value) {
    resizeObserver = new ResizeObserver(() => {
      syncEditorHeight()
    })
    resizeObserver.observe(goodsFormLeftRef.value)
  }

  window.addEventListener("resize", syncEditorHeight)
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  window.removeEventListener("resize", syncEditorHeight)
})

function normalizeImages() {
  const images = form.images.map((item) => item.trim()).filter(Boolean)
  if (!images.length) {
    Message.error("请至少填写一张商品主图")
    return null
  }
  return images
}

function normalizeGoodsConfigList() {
  const goodsConfigList: goodsConfigType[] = []

  for (const group of form.goodsConfigList) {
    const title = group.title.trim()
    const subList = group.subList
      .map((item) => ({
        title: item.title.trim(),
        image: item.image.trim(),
      }))
      .filter((item) => item.title || item.image)

    if (!title && !subList.length) {
      continue
    }

    if (!title) {
      Message.error("高级配置的名称不能为空")
      return null
    }

    if (!subList.length) {
      Message.error(`高级配置「${title}」至少要有一个配置项`)
      return null
    }

    for (const item of subList) {
      if (!item.title) {
        Message.error(`高级配置「${title}」的配置项名称不能为空`)
        return null
      }
      if (!item.image) {
        Message.error(`高级配置「${title}」的配置项图片不能为空`)
        return null
      }
    }

    goodsConfigList.push({
      title,
      subList,
    })
  }

  return goodsConfigList
}

function normalizePayload() {
  const images = normalizeImages()
  if (!images) {
    return null
  }

  const goodsConfigList = normalizeGoodsConfigList()
  if (!goodsConfigList) {
    return null
  }

  return {
    title: form.title.trim(),
    videoPath: form.videoPath.trim() || undefined,
    images,
    price: Math.round(Number(form.priceYuan) * 100),
    inventory: form.inventory === undefined || form.inventory === null ? undefined : Number(form.inventory),
    category: form.category.trim(),
    abstract: form.abstract,
    goodsConfigList,
  }
}

async function loadDetail() {
  if (!isEdit.value) {
    resetForm()
    return
  }

  const id = Number(route.params.id)
  if (!id) {
    Message.error("缺少商品ID")
    router.push({name: "goodsList"})
    return
  }

  loading.value = true
  try {
    const res = await goodsDetailApi(id)
    if (res.code) {
      Message.error(res.msg)
      router.push({name: "goodsList"})
      return
    }
    const record: goodsType = res.data
    form.id = record.id
    form.title = record.title
    form.videoPath = record.videoPath || ""
    form.images = record.images?.length ? [...record.images] : [""]
    form.priceYuan = Number((record.price / 100).toFixed(2))
    form.inventory = record.inventory === null ? undefined : record.inventory ?? undefined
    form.category = record.category
    form.abstract = record.abstract
    form.goodsConfigList = record.goodsConfigList?.length
        ? record.goodsConfigList.map((item) => ({
          title: item.title,
          subList: item.subList?.length ? item.subList.map((subItem) => ({
            title: subItem.title,
            image: subItem.image,
          })) : [createEmptySub()],
        }))
        : [createEmptyGroup()]
    await nextTick()
    syncEditorHeight()
  } catch (error) {
    console.error(error)
    Message.error("商品详情加载失败")
    router.push({name: "goodsList"})
  } finally {
    loading.value = false
  }
}

watch(() => [route.name, route.params.id], () => {
  loadDetail()
}, {immediate: true})

async function submit() {
  const error = await formRef.value.validate()
  if (error) {
    return
  }

  const payload = normalizePayload()
  if (!payload) {
    return
  }

  saving.value = true
  try {
    const res = isEdit.value
        ? await goodsUpdateApi({
          id: form.id as number,
          ...payload,
        })
        : await goodsCreateApi(payload)

    if (res.code) {
      Message.error(res.msg)
      return
    }

    Message.success(res.msg)
    router.push({name: "goodsList"})
  } catch (error) {
    Message.error("提交失败")
  } finally {
    saving.value = false
  }
}

function backToList() {
  router.push({name: "goodsList"})
}
</script>

<template>
  <div class="goods_form_page">
    <div class="goods_form_head">
      <div class="head_title">
        <h2>{{ pageTitle }}</h2>
        <p>{{ pageDesc }}</p>
      </div>
      <div class="head_actions">
        <a-button @click="backToList">返回列表</a-button>
        <a-button type="primary" :loading="saving" @click="submit">
          {{ isEdit ? "保存修改" : "确认发布" }}
        </a-button>
      </div>
    </div>

    <a-spin class="goods_form_spin" :loading="loading">
      <div class="goods_form_layout">
        <div ref="goodsFormLeftRef" class="goods_form_left">
          <a-form ref="formRef" :model="form" auto-label-width>
            <a-card class="form_card" :bordered="false">
              <template #title>基础信息</template>
              <a-form-item field="title" label="商品名称" :rules="[{required: true, message: '请输入商品名称'}]">
                <a-input v-model="form.title" placeholder="请输入商品名称"></a-input>
              </a-form-item>
              <a-form-item field="category" label="商品分类" :rules="[{required: true, message: '请选择商品分类'}]">
                <a-input v-model="form.category" placeholder="请输入商品分类"></a-input>
              </a-form-item>
              <a-form-item field="priceYuan" label="商品价格" :rules="[{required: true, message: '请输入商品价格'}]">
                <a-input-number v-model="form.priceYuan" :min="0.01" :precision="2" placeholder="单位：元"></a-input-number>
              </a-form-item>
              <a-form-item field="inventory" label="商品库存">
                <a-input-number v-model="form.inventory" :min="0" placeholder="不填表示无限库存"></a-input-number>
                <template #help>不填就是无限库存</template>
              </a-form-item>
              <a-form-item label="商品主图">
                <div class="image_list">
                  <div v-for="(image, index) in form.images" :key="`image-${index}`" class="image_row">
                    <div class="image_preview">
                      <a-image
                          v-if="image"
                          :src="image"
                          :preview="false"
                          :width="72"
                          :height="72"
                          fit="cover"></a-image>
                      <div v-else class="image_placeholder">预览</div>
                    </div>
                    <a-input v-model="form.images[index]" placeholder="支持手动填写图片路径，也可本地上传"></a-input>
                    <div class="row_actions">
                      <a-upload
                        :show-file-list="false"
                        accept="image/png,image/jpeg,image/webp"
                        :custom-request="createImageUploadRequest({type: 'main', index})"
                      >
                        <template #upload-button>
                          <a-button>本地上传</a-button>
                        </template>
                      </a-upload>
                      <a-button type="primary" @click="addImage(index)">+</a-button>
                      <a-button status="danger" @click="removeImage(index)">-</a-button>
                    </div>
                  </div>
                  <div class="tip_line">至少填写 1 张主图，最多可继续追加。</div>
                </div>
              </a-form-item>
              <a-form-item field="videoPath" label="商品视频">
                <a-input v-model="form.videoPath" placeholder="可选"></a-input>
              </a-form-item>
            </a-card>

            <a-card class="form_card" :bordered="false">
              <template #title>高级配置</template>
              <div class="config_group_list">
                <div v-for="(group, groupIndex) in form.goodsConfigList" :key="`group-${groupIndex}`" class="config_group">
                  <div class="config_group_head">
                    <a-input v-model="group.title" class="group_title_input" placeholder="配置名称，例如：颜色、尺寸"></a-input>
                    <div class="row_actions">
                      <a-button type="primary" @click="addGroup(groupIndex)">增加</a-button>
                      <a-button status="danger" @click="removeGroup(groupIndex)">删除</a-button>
                    </div>
                  </div>
                  <div class="config_sub_list">
                    <div v-for="(subItem, subIndex) in group.subList" :key="`sub-${groupIndex}-${subIndex}`" class="config_sub_row">
                      <a-input v-model="subItem.title" class="sub_title_input" placeholder="配置项名称"></a-input>
                      <a-input v-model="subItem.image" class="sub_image_input" placeholder="支持手动填写图片路径，也可本地上传"></a-input>
                      <div class="row_actions">
                        <a-upload
                          :show-file-list="false"
                          accept="image/png,image/jpeg,image/webp"
                          :custom-request="createImageUploadRequest({type: 'sub', groupIndex, subIndex})"
                        >
                          <template #upload-button>
                            <a-button>本地上传</a-button>
                          </template>
                        </a-upload>
                        <a-button type="primary" @click="addSub(groupIndex, subIndex)">+</a-button>
                        <a-button status="danger" @click="removeSub(groupIndex, subIndex)">-</a-button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div class="tip_line">列表里套对象，组名称和配置项名称都可以自由配置，支持随时新增或删除。</div>
            </a-card>
          </a-form>
        </div>

        <div class="goods_form_right">
          <div ref="editorCardRef" class="editor_card_wrap" :style="{height: editorCardHeight}">
            <a-card class="form_card editor_card" :bordered="false">
              <template #title>商品简介</template>
              <div class="editor_tip">使用 Markdown 编辑商品简介。</div>
              <div class="markdown_wrap">
                <MdEditor v-model="form.abstract" />
              </div>
            </a-card>
          </div>
        </div>
      </div>
    </a-spin>
  </div>
</template>

<style lang="less">
.goods_form_page {
  padding: 0;

  .goods_form_head {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 16px;
    margin-bottom: 16px;
    padding: 20px;
    border-bottom: @f_border;

    .head_title {
      h2 {
        margin: 0 0 6px;
        font-size: 20px;
        color: @color-text-1;
      }

      p {
        margin: 0;
        color: @color-text-2;
      }
    }

    .head_actions {
      display: flex;
      gap: 12px;
      flex-shrink: 0;
    }
  }

  .goods_form_spin {
    width: 100%;
  }

  .goods_form_layout {
    display: grid;
    grid-template-columns: minmax(360px, 440px) minmax(0, 1fr);
    gap: 16px;
    padding: 0 20px 20px;
    align-items: start;
  }

  .goods_form_left,
  .goods_form_right {
    min-width: 0;
  }

  .editor_card_wrap {
    width: 100%;
  }

  .form_card {
    margin-bottom: 16px;
    border-radius: 8px;
    box-shadow: 0 1px 0 rgba(0, 0, 0, .02);

    .arco-card-header {
      border-bottom: 1px solid var(--color-border-2);
    }
  }

  .image_list,
  .config_group_list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .image_row,
  .config_group_head,
  .config_sub_row {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .image_preview {
    width: 72px;
    height: 72px;
    flex-shrink: 0;
    border: 1px solid var(--color-border-2);
    border-radius: 6px;
    overflow: hidden;
    background: var(--color-fill-2);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .image_placeholder {
    color: @color-text-4;
    font-size: 12px;
  }

  .row_actions {
    display: flex;
    gap: 8px;
    flex-shrink: 0;
  }

  .tip_line {
    color: @color-text-3;
    font-size: 12px;
    line-height: 1.5;
  }

  .config_group {
    padding: 14px;
    border: 1px solid var(--color-border-2);
    border-radius: 8px;
    background: var(--color-fill-1);
  }

  .config_group_head {
    margin-bottom: 12px;
  }

  .group_title_input {
    flex: 1;
    min-width: 0;
  }

  .config_sub_list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .config_sub_row {
    padding-left: 4px;
  }

  .sub_title_input {
    width: 120px;
    flex-shrink: 0;
  }

  .sub_image_input {
    flex: 1;
    min-width: 0;
  }

  .editor_card {
    height: 100%;
    display: flex;
    flex-direction: column;

    .arco-card-body {
      flex: 1;
      min-height: 0;
      display: flex;
      flex-direction: column;
    }
  }

  .editor_tip {
    margin-bottom: 12px;
    color: @color-text-3;
    font-size: 12px;
  }

  .markdown_wrap {
    flex: 1;
    min-height: 0;

    .md-editor {
      height: 100%;
      min-height: 0;
    }
  }

  @media (max-width: 1280px) {
    .goods_form_layout {
      grid-template-columns: 1fr;
    }

    .editor_card {
      min-height: 540px;
    }
  }

  @media (max-width: 768px) {
    .goods_form_head {
      flex-direction: column;
    }

    .goods_form_layout {
      padding: 0 12px 12px;
    }

    .image_row,
    .config_group_head,
    .config_sub_row {
      flex-wrap: wrap;
    }

    .sub_title_input {
      width: 100%;
    }
  }
}
</style>
