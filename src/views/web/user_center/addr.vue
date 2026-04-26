<script setup lang="ts">
import {onMounted, reactive, ref} from "vue";
import {Message} from "@arco-design/web-vue";
import {areaList} from "@vant/area-data";
import {addrCreateApi, addrDefaultApi, addrListApi, addrRemoveApi, addrUpdateApi, type addrType} from "@/api/user_center_api";

type areaOption = {
  value: string
  label: string
  children?: areaOption[]
}

function buildAreaOptions() {
  const provinceMap = new Map<string, areaOption>()
  const cityMap = new Map<string, areaOption>()
  const codeToLabels = new Map<string, string[]>()

  for (const code in areaList.province_list) {
    const label = areaList.province_list[code]
    const option: areaOption = {value: code, label, children: []}
    provinceMap.set(code, option)
  }

  for (const code in areaList.city_list) {
    const label = areaList.city_list[code]
    const provinceCode = `${code.slice(0, 2)}0000`
    const parent = provinceMap.get(provinceCode)
    if (!parent) continue
    const option: areaOption = {value: code, label, children: []}
    parent.children?.push(option)
    cityMap.set(code, option)
  }

  for (const code in areaList.county_list) {
    const label = areaList.county_list[code]
    const cityCode = `${code.slice(0, 4)}00`
    const parent = cityMap.get(cityCode)
    if (!parent) continue
    parent.children?.push({value: code, label})
  }

  const options = Array.from(provinceMap.values())

  function walk(nodes: areaOption[], path: string[] = []) {
    for (const node of nodes) {
      const labels = [...path, node.label]
      codeToLabels.set(node.value, labels)
      if (node.children?.length) {
        walk(node.children, labels)
      }
    }
  }

  walk(options)
  return {options, codeToLabels}
}

const {options: areaOptions, codeToLabels} = buildAreaOptions()

const loading = ref(false)
const list = ref<addrType[]>([])
const visible = ref(false)
const formRef = ref()
const editingID = ref<number | null>(null)
const form = reactive({
  name: "",
  tel: "",
  addrCodes: [] as string[] | string,
  addr: "",
  detailAddr: "",
})

function addrCodesToText(codes: string[] | string): string {
  const lastCode = Array.isArray(codes) ? codes[codes.length - 1] : codes
  const labels = lastCode ? codeToLabels.get(lastCode) : undefined
  return labels ? labels.join(" ") : ""
}

function resolveAddrCodes(rawAddr?: string): string[] {
  const addr = rawAddr?.trim()
  if (!addr) return []
  const normalized = addr.replace(/\s+/g, " ").trim()
  const joined = normalized.replace(/\s+/g, "")

  for (const [code, labels] of codeToLabels.entries()) {
    if (labels.length !== 3) continue
    const text = labels.join(" ")
    if (text === normalized || labels.join("") === joined) {
      return [labels[0], labels[1], labels[2]].map((_, index) => {
        if (index === 0) {
          return `${code.slice(0, 2)}0000`
        }
        if (index === 1) {
          return `${code.slice(0, 4)}00`
        }
        return code
      })
    }
  }
  return []
}

async function loadList() {
  loading.value = true
  try {
    const res = await addrListApi()
    if (res.code) {
      Message.error(res.msg)
      return
    }
    list.value = res.data.list || []
  } catch (error) {
    console.error(error)
    Message.error("地址列表加载失败")
  } finally {
    loading.value = false
  }
}

function openCreate() {
  editingID.value = null
  form.name = ""
  form.tel = ""
  form.addrCodes = []
  form.addr = ""
  form.detailAddr = ""
  visible.value = true
}

function openEdit(item: addrType) {
  editingID.value = item.id
  form.name = item.name
  form.tel = item.tel
  form.addrCodes = resolveAddrCodes(item.addr)
  form.addr = item.addr
  form.detailAddr = item.detailAddr
  visible.value = true
}

async function saveAddress() {
  const error = await formRef.value?.validate?.()
  if (error) return false
  const payload = {
    name: form.name,
    tel: form.tel,
    addr: addrCodesToText(form.addrCodes),
    detailAddr: form.detailAddr,
  }
  const res = editingID.value
    ? await addrUpdateApi({id: editingID.value, ...payload})
    : await addrCreateApi(payload)
  if (res.code) {
    Message.error(res.msg)
    return false
  }
  Message.success(editingID.value ? "地址已更新" : "地址已新增")
  visible.value = false
  await loadList()
  return true
}

async function setDefault(item: addrType) {
  const res = await addrDefaultApi(item.id)
  if (res.code) {
    Message.error(res.msg)
    return
  }
  Message.success("默认地址已更新")
  await loadList()
}

async function removeItem(item: addrType) {
  const res = await addrRemoveApi([item.id])
  if (res.code) {
    Message.error(res.msg)
    return
  }
  Message.success("已删除地址")
  await loadList()
}

onMounted(loadList)
</script>

<template>
  <div class="page_view">
    <div class="panel_head">
      <div>
        <div class="eyebrow">ADDRESS</div>
        <h2>我的地址</h2>
      </div>
      <a-button type="primary" @click="openCreate">新增地址</a-button>
    </div>

    <a-spin :loading="loading">
      <div v-if="list.length" class="addr_list">
        <article v-for="item in list" :key="item.id" class="addr_card">
          <div class="addr_top">
            <div class="addr_identity">
              <div class="avatar_mark">{{ item.name.slice(0, 1) }}</div>
              <div>
                <strong>{{ item.name }}</strong>
                <span>{{ item.tel }}</span>
              </div>
            </div>
            <span v-if="item.isDefault" class="default_badge">默认地址</span>
          </div>
          <div class="addr_text">{{ item.addr }} {{ item.detailAddr }}</div>
          <div class="actions">
            <a-button @click="openEdit(item)">编辑</a-button>
            <a-button v-if="!item.isDefault" type="primary" @click="setDefault(item)">设为默认</a-button>
            <a-popconfirm content="确定删除吗？" @ok="removeItem(item)">
              <a-button status="danger">删除</a-button>
            </a-popconfirm>
          </div>
        </article>
      </div>
      <a-empty v-else description="暂无地址"/>
    </a-spin>

    <a-modal v-model:visible="visible" title="收货地址" :on-before-ok="saveAddress">
      <a-form ref="formRef" :model="form" auto-label-width>
        <a-form-item field="name" label="收货人" :rules="[{required: true, message: '请输入收货人'}]">
          <a-input v-model="form.name" placeholder="收货人"/>
        </a-form-item>
        <a-form-item field="tel" label="手机号" :rules="[{required: true, message: '请输入手机号'}]">
          <a-input v-model="form.tel" placeholder="手机号"/>
        </a-form-item>
        <a-form-item field="addrCodes" label="省市区" :rules="[{required: true, message: '请选择省市区'}]">
          <a-cascader
            v-model="form.addrCodes"
            :options="areaOptions"
            placeholder="选择省 / 市 / 区"
            allow-search
            style="width: 100%"
          />
        </a-form-item>
        <a-form-item field="detailAddr" label="详细地址" :rules="[{required: true, message: '请输入详细地址'}]">
          <a-input v-model="form.detailAddr" placeholder="详细地址"/>
        </a-form-item>
      </a-form>
    </a-modal>
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
.addr_text,
.addr_top span {
  color: var(--color-text-2);
}

.eyebrow {
  color: #ff5d72;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: .12em;
}

.addr_list {
  display: grid;
  gap: 14px;
}

.addr_card {
  padding: 18px;
  border-radius: 18px;
  background: var(--web-soft-grad);
  border: 1px solid var(--web-border);
  box-shadow: var(--web-shadow-soft);
}

.addr_top,
.actions {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
}

.addr_identity {
  display: flex;
  align-items: center;
  gap: 12px;
}

.avatar_mark {
  width: 42px;
  height: 42px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  flex: 0 0 auto;
  color: #ff647c;
  font-size: 18px;
  font-weight: 800;
  background: var(--web-soft-grad);
  border: 1px solid var(--web-border);
}

.addr_top strong {
  display: block;
  font-size: 18px;
  margin-bottom: 4px;
}

.default_badge {
  flex: 0 0 auto;
  padding: 8px 12px;
  border-radius: 999px;
  color: var(--web-status-badge-text);
  font-size: 12px;
  font-weight: 700;
  background: var(--web-status-badge-bg);
  border: 1px solid var(--web-status-badge-border);
  box-shadow: 0 10px 22px rgba(255, 111, 142, .16);
}

.addr_text {
  margin: 12px 0;
  line-height: 1.7;
  padding: 14px 16px;
  border-radius: 16px;
  background: var(--web-soft-bg);
}

.actions {
  flex-wrap: wrap;
  justify-content: flex-end;
}

@media (max-width: 768px) {
  .panel_head,
  .addr_top,
  .actions {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
