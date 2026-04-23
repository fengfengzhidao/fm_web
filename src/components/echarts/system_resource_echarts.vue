<script setup lang="ts">
import * as echarts from "echarts";
import {nextTick, onBeforeUnmount, onMounted, reactive, ref, watch} from "vue";
import {Message} from "@arco-design/web-vue";
import {dataComputerApi, type dataComputerType} from "@/api/data_api";
import {theme} from "@/components/common/f_theme";

type EChartsOption = echarts.EChartsOption;

const chartRef = ref<HTMLDivElement | null>(null)
let myChart: echarts.ECharts | null = null
let resizeObserver: ResizeObserver | null = null

const data = reactive<dataComputerType>({
  cpuPercent: 0,
  memPercent: 0,
  diskPercent: 0,
})

async function getData() {
  const res = await dataComputerApi()
  if (res.code) {
    Message.error(res.msg)
    return
  }
  Object.assign(data, res.data)
}

function buildOption(): EChartsOption {
  const textColor = getComputedStyle(document.body).getPropertyValue("--color-text-1")
  const subColor = getComputedStyle(document.body).getPropertyValue("--color-text-2")
  const lineColor = getComputedStyle(document.body).getPropertyValue("--color-neutral-2")

  return {
    grid: {
      left: "8%",
      right: "8%",
      top: "10%",
      bottom: "8%",
      containLabel: true,
    },
    xAxis: {
      type: "value",
      min: 0,
      max: 100,
      axisLabel: {
        color: subColor,
        formatter: "{value}%",
      },
      splitLine: {
        lineStyle: {
          color: lineColor,
        },
      },
    },
    yAxis: {
      type: "category",
      data: ["存储", "内存", "CPU"],
      axisLabel: {
        color: textColor,
        margin: 16,
      },
      axisLine: {
        lineStyle: {
          color: lineColor,
        },
      },
      axisTick: {
        show: false,
      },
    },
    series: [
      {
        type: "bar",
        data: [Number(data.diskPercent || 0), Number(data.memPercent || 0), Number(data.cpuPercent || 0)],
        barWidth: 28,
        itemStyle: {
          color: "#2f7af6",
          borderRadius: [0, 6, 6, 0],
        },
        label: {
          show: false,
        },
      },
    ],
  }
}

function renderChart() {
  myChart?.setOption(buildOption(), true)
}

function resizeChart() {
  myChart?.resize()
}

function initChart() {
  const el = chartRef.value
  if (!el || myChart) {
    return
  }
  if (el.clientWidth === 0 || el.clientHeight === 0) {
    return
  }
  myChart = echarts.init(el)
  renderChart()
  window.addEventListener("resize", resizeChart)
}

function observeChartSize() {
  const el = chartRef.value
  if (!el) {
    return
  }
  resizeObserver?.disconnect()
  resizeObserver = new ResizeObserver(() => {
    if (!myChart) {
      initChart()
      return
    }
    resizeChart()
  })
  resizeObserver.observe(el)
}

onMounted(async () => {
  await getData()
  await nextTick()
  initChart()
  observeChartSize()
})

watch(() => theme.value, renderChart)
watch(() => [data.cpuPercent, data.memPercent, data.diskPercent], renderChart)

onBeforeUnmount(() => {
  window.removeEventListener("resize", resizeChart)
  resizeObserver?.disconnect()
  resizeObserver = null
  myChart?.dispose()
  myChart = null
})
</script>

<template>
  <div ref="chartRef" class="system_resource_echarts"></div>
</template>

<style lang="less">
.system_resource_echarts {
  width: 100%;
  height: 320px;
}
</style>
