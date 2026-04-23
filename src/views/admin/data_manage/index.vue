<script setup lang="ts">
import {onMounted, reactive, ref} from "vue";
import {
  dataComputerApi,
  type dataComputerType,
  dataLoginStatisticApi,
  type dataLoginStatisticType,
  dataOrderTrendApi,
  type dataOrderTrendType,
  dataSystemStatisticApi,
  type dataSystemStatisticType,
} from "@/api/data_api";
import {Message} from "@arco-design/web-vue";
import {IconApps, IconClockCircle, IconMessage, IconStorage, IconSubscribe, IconUser} from "@arco-design/web-vue/es/icon";
import type {Component} from "vue";

interface StatItem {
  label: string
  key: keyof dataSystemStatisticType
  icon: Component
  color: string
}

const loading = ref(false)
const system = reactive<Partial<dataSystemStatisticType>>({})
const computer = reactive<Partial<dataComputerType>>({})
const orderTrend = reactive<dataOrderTrendType>({
  dateList: [],
  countList: [],
})
const loginTrend = reactive<dataLoginStatisticType>({
  dateList: [],
  loginList: [],
  signList: [],
})
const showWeatherPanel = false

const statList: StatItem[] = [
  {label: "用户数量", key: "userNum", icon: IconUser, color: "#165dff"},
  {label: "上架商品", key: "goodsNum", icon: IconApps, color: "#00b42a"},
  {label: "秒杀商品", key: "secKillNum", icon: IconClockCircle, color: "#f77234"},
  {label: "成功订单", key: "successOrderNum", icon: IconStorage, color: "#722ed1"},
  {label: "今日登录", key: "newLoginCount", icon: IconUser, color: "#0fc6c2"},
  {label: "购物车商品", key: "carNum", icon: IconSubscribe, color: "#ff7d00"},
  {label: "未读消息", key: "msgNum", icon: IconMessage, color: "#f53f3f"},
  {label: "待评价订单", key: "pendingComment", icon: IconMessage, color: "#86909c"},
]

async function request<T>(fn: () => Promise<{ code: number, msg: string, data: T }>, assign: (data: T) => void) {
  const res = await fn()
  if (res.code) {
    Message.error(res.msg)
    return
  }
  assign(res.data)
}

async function getData() {
  loading.value = true
  try {
    await Promise.all([
      request(dataSystemStatisticApi, (data) => Object.assign(system, data)),
      request(dataComputerApi, (data) => Object.assign(computer, data)),
      request(dataOrderTrendApi, (data) => Object.assign(orderTrend, data)),
      request(dataLoginStatisticApi, (data) => Object.assign(loginTrend, data)),
    ])
  } finally {
    loading.value = false
  }
}

function percent(value?: number) {
  return Number(value || 0).toFixed(1)
}

onMounted(getData)
</script>

<template>
  <div class="data_manage_view">
    <div class="page_head">
      <div>
        <h2>数据统计</h2>
        <p>后台核心数据、趋势和服务器状态</p>
      </div>
      <a-button type="primary" @click="getData">刷新数据</a-button>
    </div>

    <a-spin :loading="loading" tip="加载中...">
      <div class="stat_grid">
        <div class="stat_card" v-for="item in statList" :key="item.key">
          <div class="icon" :style="{backgroundColor: item.color}">
            <component :is="item.icon"></component>
          </div>
          <div>
            <div class="label">{{ item.label }}</div>
            <div class="value">{{ system[item.key] ?? 0 }}</div>
          </div>
        </div>
      </div>

      <div class="panel_grid">
        <div class="panel">
          <div class="panel_title">订单趋势</div>
          <div class="trend_list">
            <div class="trend_item" v-for="(date, index) in orderTrend.dateList" :key="date">
              <span>{{ date }}</span>
              <a-progress
                  :percent="Math.min((orderTrend.countList[index] || 0) / Math.max(...orderTrend.countList, 1), 1)"
                  :show-text="false"></a-progress>
              <strong>{{ orderTrend.countList[index] || 0 }}</strong>
            </div>
          </div>
        </div>

        <div class="panel">
          <div class="panel_title">用户趋势</div>
          <div class="trend_list">
            <div class="trend_item" v-for="(date, index) in loginTrend.dateList" :key="date">
              <span>{{ date }}</span>
              <a-progress
                  :percent="Math.min((loginTrend.loginList[index] || 0) / Math.max(...loginTrend.loginList, 1), 1)"
                  :show-text="false"
                  color="#00b42a"></a-progress>
              <strong>登录 {{ loginTrend.loginList[index] || 0 }} / 注册 {{ loginTrend.signList[index] || 0 }}</strong>
            </div>
          </div>
        </div>

        <div class="panel">
          <div class="panel_title">服务器资源</div>
          <div class="resource_item">
            <span>CPU</span>
            <a-progress :percent="(computer.cpuPercent || 0) / 100" :color="'#165dff'"></a-progress>
            <strong>{{ percent(computer.cpuPercent) }}%</strong>
          </div>
          <div class="resource_item">
            <span>内存</span>
            <a-progress :percent="(computer.memPercent || 0) / 100" :color="'#00b42a'"></a-progress>
            <strong>{{ percent(computer.memPercent) }}%</strong>
          </div>
          <div class="resource_item">
            <span>磁盘</span>
            <a-progress :percent="(computer.diskPercent || 0) / 100" :color="'#f77234'"></a-progress>
            <strong>{{ percent(computer.diskPercent) }}%</strong>
          </div>
        </div>

        <div v-if="showWeatherPanel" class="panel">
          <div class="panel_title">天气信息</div>
          <div class="weather_box">
            <div class="weather_main">-</div>
            <div class="weather_temp">-°C</div>
            <div class="weather_meta">天气信息暂不可用</div>
          </div>
        </div>
      </div>
    </a-spin>
  </div>
</template>

<style lang="less">
.data_manage_view {
  padding: 20px;

  .page_head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20px;

    h2 {
      margin: 0 0 6px;
      font-size: 22px;
    }

    p {
      margin: 0;
      color: @color-text-2;
    }
  }

  .stat_grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 16px;
    margin-bottom: 16px;
  }

  .stat_card,
  .panel {
    border: @f_border;
    border-radius: 5px;
    background-color: var(--color-bg-1);
  }

  .stat_card {
    display: flex;
    align-items: center;
    padding: 18px;

    .icon {
      width: 46px;
      height: 46px;
      color: #fff;
      border-radius: 5px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 22px;
      margin-right: 14px;
    }

    .label {
      color: @color-text-2;
      margin-bottom: 6px;
    }

    .value {
      color: @color-text-1;
      font-size: 24px;
      font-weight: 600;
    }
  }

  .panel_grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
  }

  .panel {
    padding: 18px;
    min-height: 260px;
  }

  .panel_title {
    font-size: 16px;
    font-weight: 600;
    margin-bottom: 16px;
  }

  .trend_item,
  .resource_item {
    display: grid;
    grid-template-columns: 110px minmax(0, 1fr) 120px;
    gap: 12px;
    align-items: center;
    margin-bottom: 12px;
    color: @color-text-2;

    strong {
      color: @color-text-1;
      font-weight: 500;
      text-align: right;
    }
  }

  .resource_item {
    grid-template-columns: 60px minmax(0, 1fr) 70px;
  }

  .weather_box {
    color: @color-text-2;

    .weather_main {
      color: @color-text-1;
      font-size: 28px;
      font-weight: 600;
      margin-bottom: 8px;
    }

    .weather_temp {
      color: #165dff;
      font-size: 42px;
      font-weight: 600;
      margin-bottom: 20px;
    }

    .weather_meta {
      margin-bottom: 10px;
    }
  }
}
</style>
