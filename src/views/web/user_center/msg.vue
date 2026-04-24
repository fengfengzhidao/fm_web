<script setup lang="ts">
import {onMounted, ref} from "vue";
import {Message} from "@arco-design/web-vue";
import {msgReadApi, msgUserListApi, msgUserRemoveApi, type msgType} from "@/api/msg_api";
import {dateTimeFormat} from "@/utils/date";

const loading = ref(false)
const list = ref<msgType[]>([])

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

onMounted(loadList)
</script>

<template>
  <div class="page_view">
    <div class="panel_head">
      <div>
        <div class="eyebrow">MESSAGE</div>
        <h2>消息通知</h2>
        <p>订单、商品和系统消息。</p>
      </div>
    </div>

    <a-spin :loading="loading">
      <div v-if="list.length" class="msg_list">
        <article v-for="item in list" :key="item.id" class="msg_card" :class="{read: item.isRead}">
          <div class="msg_top">
            <strong>{{ item.goodsTitle || `消息 #${item.id}` }}</strong>
            <a-tag :color="item.isRead ? 'gray' : 'blue'">{{ item.isRead ? '已读' : '未读' }}</a-tag>
          </div>
          <div class="msg_body">
            <div v-for="line in item.msgList" :key="line">{{ line }}</div>
          </div>
          <div class="msg_foot">
            <span>{{ dateTimeFormat(item.createdAt) }}</span>
            <div class="actions">
              <a-button v-if="!item.isRead" type="primary" @click="markRead(item)">标记已读</a-button>
              <a-popconfirm content="确定删除这条消息吗？" @ok="removeItem(item)">
                <a-button status="danger">删除</a-button>
              </a-popconfirm>
            </div>
          </div>
        </article>
      </div>
      <a-empty v-else description="暂无消息"/>
    </a-spin>
  </div>
</template>

<style scoped lang="less">
.page_view {
  display: grid;
  gap: 18px;
}

.panel_head h2 {
  margin: 8px 0 8px;
  font-size: 30px;
}

.panel_head p,
.msg_foot span {
  color: var(--color-text-2);
}

.eyebrow {
  color: #ff5d72;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: .08em;
}

.msg_list {
  display: grid;
  gap: 14px;
}

.msg_card {
  padding: 16px;
  border-radius: 20px;
  background: var(--color-fill-1);
  border: 1px solid var(--color-border-2);
}

.msg_card.read {
  opacity: .82;
}

.msg_top,
.msg_foot {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
}

.msg_body {
  margin: 12px 0;
  display: grid;
  gap: 6px;
  line-height: 1.75;
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
