<script setup lang="ts">
import {onMounted, reactive, ref} from "vue";
import {Message} from "@arco-design/web-vue";
import {addrCreateApi, addrDefaultApi, addrListApi, addrRemoveApi, addrUpdateApi, type addrType} from "@/api/user_center_api";

const loading = ref(false)
const list = ref<addrType[]>([])
const visible = ref(false)
const formRef = ref()
const editingID = ref<number | null>(null)
const form = reactive({
  name: "",
  tel: "",
  addr: "",
  detailAddr: "",
})

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
  form.addr = ""
  form.detailAddr = ""
  visible.value = true
}

function openEdit(item: addrType) {
  editingID.value = item.id
  form.name = item.name
  form.tel = item.tel
  form.addr = item.addr
  form.detailAddr = item.detailAddr
  visible.value = true
}

async function saveAddress() {
  const error = await formRef.value?.validate?.()
  if (error) return false
  const payload = {...form}
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
        <p>维护收货地址，结算页直接读取这里的数据。</p>
      </div>
      <a-button type="primary" @click="openCreate">新增地址</a-button>
    </div>

    <a-spin :loading="loading">
      <div v-if="list.length" class="addr_list">
        <article v-for="item in list" :key="item.id" class="addr_card">
          <div class="addr_top">
            <div>
              <strong>{{ item.name }}</strong>
              <span>{{ item.tel }}</span>
            </div>
            <a-tag v-if="item.isDefault" color="green">默认</a-tag>
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
        <a-form-item field="addr" label="省市区" :rules="[{required: true, message: '请输入省市区'}]">
          <a-input v-model="form.addr" placeholder="省市区"/>
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
  align-items: flex-start;
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
  letter-spacing: .08em;
}

.addr_list {
  display: grid;
  gap: 14px;
}

.addr_card {
  padding: 16px;
  border-radius: 20px;
  background: var(--color-fill-1);
  border: 1px solid var(--color-border-2);
}

.addr_top,
.actions {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
}

.addr_top strong {
  display: block;
  font-size: 18px;
  margin-bottom: 4px;
}

.addr_text {
  margin: 12px 0;
  line-height: 1.7;
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
