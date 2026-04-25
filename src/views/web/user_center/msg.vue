<script setup lang="ts">
import {computed, onMounted, ref} from "vue";
import {useRouter} from "vue-router";
import {Message} from "@arco-design/web-vue";
import {msgReadApi, msgUserListApi, msgUserRemoveApi, type msgType} from "@/api/msg_api";
import {dateTimeFormat} from "@/utils/date";

const router = useRouter()
const loading = ref(false)
const list = ref<msgType[]>([])
const active = ref("all")

const unreadCount = computed(() => list.value.filter((item) => !item.isRead).length)
const readCount = computed(() => list.value.filter((item) => item.isRead).length)
const allList = computed(() => list.value)
const unreadList = computed(() => list.value.filter((item) => !item.isRead))
const readList = computed(() => list.value.filter((item) => item.isRead))

async function loadList() {
  loading.value = true
  try {
    const res = await msgUserListApi({limit: 50, page: 1})
    if (res.code) {
      Message.error(res.msg)
      return
    }
    list.value = res.data.list || []
  } catch (error) {
    console.error(error)
    Message.error("消息列表加载失败")
  } finally {
    loading.value = false
  }
}

function openTarget(item: msgType) {
  if (item.orderID) {
    router.push({name: "web_user_center_order_detail", params: {id: item.orderID}})
    return
  }
  if (item.goodsID) {
    router.push({name: "web_goods_detail", params: {id: item.goodsID}})
  }
}

async function markRead(item: msgType) {
  const res = await msgReadApi(item.id)
  if (res.code) {
    Message.error(res.msg)
    return
  }
  Message.success("已标记已读")
  await loadList()
}

async function removeItem(item: msgType) {
  const res = await msgUserRemoveApi([item.id])
  if (res.code) {
    Message.error(res.msg)
    return
  }
  Message.success("已删除消息")
  await loadList()
}

async function markAllRead() {
  const unreadList = list.value.filter((item) => !item.isRead)
  if (!unreadList.length) {
    Message.info("没有未读消息")
    return
  }
  for (const item of unreadList) {
    const res = await msgReadApi(item.id)
    if (res.code) {
      Message.error(res.msg)
      return
    }
  }
  Message.success("已全部标记已读")
  await loadList()
}

onMounted(loadList)
</script>

<template>
  <div class="page_view">
    <div class="panel_head">
      <div>
        <div class="eyebrow">MESSAGE</div>
        <h2>消息通知</h2>
        <p>统一查看订单、商品和系统提醒，支持快速跳转来源并管理已读状态。</p>
      </div>
      <div class="head_actions">
        <span class="summary_badge">未读 {{ unreadCount }}</span>
        <span class="summary_badge muted">已读 {{ readCount }}</span>
        <a-button type="primary" @click="markAllRead">全部已读</a-button>
      </div>
    </div>

    <a-spin :loading="loading">
      <a-tabs v-model:active-key="active" class="msg_tabs">
        <a-tab-pane key="all" title="全部消息">
          <div v-if="allList.length" class="msg_list">
            <article v-for="item in allList" :key="item.id" class="msg_card" :class="{read: item.isRead}">
              <div class="msg_top">
                <strong>{{ item.goodsTitle || `消息 #${item.id}` }}</strong>
                <span class="msg_state" :class="{read: item.isRead}">{{ item.isRead ? '已读' : '未读' }}</span>
              </div>
              <div class="msg_body">
                <div v-for="line in item.msgList" :key="line">{{ line }}</div>
              </div>
              <div class="msg_foot">
                <span>{{ dateTimeFormat(item.createdAt) }}</span>
                <div class="actions">
                  <a-button @click="openTarget(item)">查看来源</a-button>
                  <a-button v-if="!item.isRead" type="primary" @click="markRead(item)">标记已读</a-button>
                  <a-popconfirm content="确定删除这条消息吗？" @ok="removeItem(item)">
                    <a-button status="danger">删除</a-button>
                  </a-popconfirm>
                </div>
              </div>
            </article>
          </div>
          <a-empty v-else description="暂无消息"/>
        </a-tab-pane>

        <a-tab-pane key="unread" title="未读消息">
          <div v-if="unreadList.length" class="msg_list">
            <article v-for="item in unreadList" :key="item.id" class="msg_card">
              <div class="msg_top">
                <strong>{{ item.goodsTitle || `消息 #${item.id}` }}</strong>
                <span class="msg_state">未读</span>
              </div>
              <div class="msg_body">
                <div v-for="line in item.msgList" :key="line">{{ line }}</div>
              </div>
              <div class="msg_foot">
                <span>{{ dateTimeFormat(item.createdAt) }}</span>
                <div class="actions">
                  <a-button @click="openTarget(item)">查看来源</a-button>
                  <a-button type="primary" @click="markRead(item)">标记已读</a-button>
                </div>
              </div>
            </article>
          </div>
          <a-empty v-else description="暂无未读消息"/>
        </a-tab-pane>

        <a-tab-pane key="read" title="已读消息">
          <div v-if="readList.length" class="msg_list">
            <article v-for="item in readList" :key="item.id" class="msg_card read">
              <div class="msg_top">
                <strong>{{ item.goodsTitle || `消息 #${item.id}` }}</strong>
                <span class="msg_state read">已读</span>
              </div>
              <div class="msg_body">
                <div v-for="line in item.msgList" :key="line">{{ line }}</div>
              </div>
              <div class="msg_foot">
                <span>{{ dateTimeFormat(item.createdAt) }}</span>
                <div class="actions">
                  <a-button @click="openTarget(item)">查看来源</a-button>
                  <a-popconfirm content="确定删除这条消息吗？" @ok="removeItem(item)">
                    <a-button status="danger">删除</a-button>
                  </a-popconfirm>
                </div>
              </div>
            </article>
          </div>
          <a-empty v-else description="暂无已读消息"/>
        </a-tab-pane>
      </a-tabs>
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
.msg_foot span {
  color: var(--color-text-2);
}

.head_actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.summary_badge {
  padding: 8px 12px;
  border-radius: 999px;
  color: #ff647c;
  font-size: 12px;
  font-weight: 700;
  background: #fff2f5;
  border: 1px solid #ffd4dc;
}

.summary_badge.muted {
  color: #9ca3af;
  background: #f8fafc;
  border-color: #e5e7eb;
}

.eyebrow {
  color: #ff5d72;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: .12em;
}

.msg_tabs {
  :deep(.arco-tabs-nav::before) {
    background: #f1f3f6;
  }

  :deep(.arco-tabs-tab) {
    color: #6b7280;
    font-weight: 600;
  }

  :deep(.arco-tabs-tab-active),
  :deep(.arco-tabs-tab:hover) {
    color: #ff647c;
  }

  :deep(.arco-tabs-nav-ink) {
    background: #ff647c;
  }
}

.msg_list {
  display: grid;
  gap: 14px;
}

.msg_card {
  padding: 18px;
  border-radius: 18px;
  background: linear-gradient(180deg, #fffafb, #fff);
  border: 1px solid #eceef2;
  box-shadow: 0 12px 30px rgba(17, 24, 39, .04);
}

.msg_card.read {
  background: linear-gradient(180deg, #fbfcfd, #fff);
}

.msg_top,
.msg_foot {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
}

.msg_state {
  flex: 0 0 auto;
  padding: 7px 12px;
  border-radius: 999px;
  color: #ff647c;
  font-size: 12px;
  font-weight: 700;
  background: #fff2f5;
  border: 1px solid #ffd4dc;
}

.msg_state.read {
  color: #9ca3af;
  background: #f8fafc;
  border-color: #e5e7eb;
}

.msg_body {
  margin: 12px 0;
  display: grid;
  gap: 6px;
  line-height: 1.75;
  padding: 14px 16px;
  border-radius: 16px;
  background: #fafafb;
}

.actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

@media (max-width: 768px) {
  .msg_top,
  .msg_foot {
    flex-direction: column;
  }
}
</style>
