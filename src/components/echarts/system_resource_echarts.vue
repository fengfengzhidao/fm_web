<script setup lang="ts">
import * as echarts from "echarts";
import {onBeforeUnmount, onMounted, reactive, ref, watch} from "vue";
import {Message} from "@arco-design/web-vue";
import {dataComputerApi, type dataComputerType} from "@/api/data_api";
import {theme} from "@/components/common/f_theme";

type EChartsOption = echarts.EChartsOption;

const cpuRef = ref<HTMLDivElement | null>(null)
const memRef = ref<HTMLDivElement | null>(null)
const diskRef = ref<HTMLDivElement | null>(null)

let cpuChart: echarts.ECharts | null = null
let memChart: echarts.ECharts | null = null
let diskChart: echarts.ECharts | null = null

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

function makeOption(title: string, value: number, color: string): EChartsOption {
  const textColor = getComputedStyle(document.body).getPropertyValue("--color-text-1")
  const subColor = getComputedStyle(document.body).getPropertyValue("--color-text-2")

  return {
    title: {
      text: title,
      left: "center",
      top: 8,
      textStyle: {
        color: textColor,
        fontSize: 14,
      },
    },
    tooltip: {
      formatter: "{b}: {c}%",
    },
    series: [
      {
        type: "gauge",
        startAngle: 220,
        endAngle: -40,
        min: 0,
        max: 100,
        radius: "92%",
        center: ["50%", "60%"],
        axisLine: {
          lineStyle: {
            width: 14,
            color: [[value / 100, color], [1, "#e5e6eb"]],
          },
        },
        axisTick: {show: false},
        splitLine: {show: false},
        axisLabel: {show: false},
        pointer: {show: false},
        progress: {
          show: true,
          roundCap: true,
          width: 14,
        },
        detail: {
          valueAnimation: true,
          formatter: "{value}%",
          color: textColor,
          fontSize: 24,
          offsetCenter: [0, "45%"],
        },
        title: {
          offsetCenter: [0, "76%"],
          color: subColor,
          fontSize: 12,
        },
        data: [{value: Number(value.toFixed(1)), name: title}],
      },
    ],
  }
}

function renderChart() {
  cpuChart?.setOption(makeOption("CPU", data.cpuPercent, "#165dff"), true)
  memChart?.setOption(makeOption("内存", data.memPercent, "#00b42a"), true)
  diskChart?.setOption(makeOption("磁盘", data.diskPercent, "#f77234"), true)
}

function resizeChart() {
  cpuChart?.resize()
  memChart?.resize()
  diskChart?.resize()
}

onMounted(async () => {
  await getData()
  if (!cpuRef.value || !memRef.value || !diskRef.value) {
    return
  }
  cpuChart = echarts.init(cpuRef.value)
  memChart = echarts.init(memRef.value)
  diskChart = echarts.init(diskRef.value)
  renderChart()
  window.addEventListener("resize", resizeChart)
})

watch(() => theme.value, renderChart)
watch(() => [data.cpuPercent, data.memPercent, data.diskPercent], renderChart)

onBeforeUnmount(() => {
  window.removeEventListener("resize", resizeChart)
  cpuChart?.dispose()
  memChart?.dispose()
  diskChart?.dispose()
  cpuChart = null
  memChart = null
  diskChart = null
})
</script>

<template>
  <div class="system_resource_echarts">
    <div class="chart_box">
      <div ref="cpuRef" class="chart"></div>
    </div>
    <div class="chart_box">
      <div ref="memRef" class="chart"></div>
    </div>
    <div class="chart_box">
      <div ref="diskRef" class="chart"></div>
    </div>
  </div>
</template>

<style lang="less">
.system_resource_echarts {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;

  .chart_box {
    background-color: var(--color-fill-1);
    border-radius: 8px;
    padding: 10px;
  }

  .chart {
    width: 100%;
    height: 220px;
  }
}
</style>
