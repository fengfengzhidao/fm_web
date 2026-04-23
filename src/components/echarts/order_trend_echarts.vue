<script setup lang="ts">
import * as echarts from "echarts";
import {onBeforeUnmount, onMounted, reactive, ref, watch} from "vue";
import {Message} from "@arco-design/web-vue";
import {dataOrderTrendApi, type dataOrderTrendType} from "@/api/data_api";
import {theme} from "@/components/common/f_theme";

type EChartsOption = echarts.EChartsOption;

const chartRef = ref<HTMLDivElement | null>(null)
let myChart: echarts.ECharts | null = null

const data = reactive<dataOrderTrendType>({
  dateList: [],
  countList: [],
})

async function getData() {
  const res = await dataOrderTrendApi()
  if (res.code) {
    Message.error(res.msg)
    return
  }
  Object.assign(data, res.data)
}

function buildOption(): EChartsOption {
  const textColor = getComputedStyle(document.body).getPropertyValue("--color-text-1")
  const lineColor = getComputedStyle(document.body).getPropertyValue("--color-neutral-2")

  return {
    color: ["#165dff"],
    title: {
      text: "下单统计",
      subtext: "近 7 天下单量",
      textStyle: {color: textColor},
      subtextStyle: {color: lineColor},
    },
    tooltip: {trigger: "axis"},
    grid: {
      left: "3%",
      right: "4%",
      bottom: "3%",
      containLabel: true,
    },
    xAxis: {
      type: "category",
      data: data.dateList,
      axisLabel: {color: textColor},
      axisLine: {lineStyle: {color: lineColor}},
    },
    yAxis: {
      type: "value",
      axisLabel: {color: textColor},
      splitLine: {lineStyle: {color: lineColor}},
    },
    series: [
      {
        name: "订单量",
        type: "bar",
        data: data.countList,
        barMaxWidth: 28,
        itemStyle: {
          borderRadius: [8, 8, 0, 0],
        },
        emphasis: {
          focus: "series",
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

onMounted(async () => {
  await getData()
  if (!chartRef.value) {
    return
  }
  myChart = echarts.init(chartRef.value)
  renderChart()
  window.addEventListener("resize", resizeChart)
})

watch(() => theme.value, renderChart)
watch(() => [data.dateList.join("|"), data.countList.join(",")], renderChart)

onBeforeUnmount(() => {
  window.removeEventListener("resize", resizeChart)
  myChart?.dispose()
  myChart = null
})
</script>

<template>
  <div ref="chartRef" class="order_trend_echarts"></div>
</template>

<style lang="less">
.order_trend_echarts {
  width: 100%;
  height: 320px;
}
</style>
