<script setup lang="ts">
import {onMounted, reactive, ref} from "vue";
import dayjs from "dayjs";
import F_list, {type columnType, type filterGroupType} from "@/components/admin/f_list.vue";
import {couponCreateApi, couponListApi, type couponType} from "@/api/coupon_api";
import {goodsOptionsApi} from "@/api/goods_api";
import {secKillAdminListApi, secKillCreateApi, type secKillType} from "@/api/sec_kill_api";
import {Message} from "@arco-design/web-vue";
import {dateTemFormat} from "@/utils/date";
import type {optionsType} from "@/api";

const couponListRef = ref<InstanceType<typeof F_list>>()
const secKillListRef = ref<InstanceType<typeof F_list>>()
const couponFormRef = ref()
const secKillFormRef = ref()
const couponVisible = ref(false)
const secKillVisible = ref(false)
const goodsOptions = ref<optionsType[]>([])

const couponColumns: columnType[] = [
  {title: "ID", dataIndex: "id", width: 80},
  {title: "标题", dataIndex: "title"},
  {title: "类型", slotName: "type", width: 120},
  {title: "优惠", slotName: "price", width: 160},
  {title: "发放/领取", slotName: "num", width: 120},
  {title: "有效期", slotName: "validity", width: 120},
  {title: "关联", slotName: "relation", width: 140},
  {title: "时间", slotName: "createdAt", width: 180},
  {title: "操作", slotName: "action", width: 110},
]

const secKillColumns: columnType[] = [
  {title: "ID", dataIndex: "id", width: 80},
  {title: "商品", slotName: "goods"},
  {title: "价格", slotName: "price", width: 150},
  {title: "库存", slotName: "inventory", width: 130},
  {title: "时间", slotName: "time", width: 260},
  {title: "创建时间", slotName: "createdAt", width: 180},
  {title: "操作", slotName: "action", width: 110},
]

const couponFilterGroup: filterGroupType[] = [
  {
    label: "优惠券类型", column: "type", width: 150, source: [
      {label: "节日", value: 1},
      {label: "新用户", value: 2},
      {label: "新商品", value: 3},
      {label: "商品", value: 4},
      {label: "普通", value: 5},
    ]
  }
]
const couponTypeOptions = couponFilterGroup[0].source as optionsType[]

const couponForm = reactive({
  title: "",
  type: 5,
  couponPriceYuan: 0,
  thresholdYuan: 0,
  validity: 24,
  num: 100,
  goodsID: undefined as number | undefined,
  festival: "",
})

const secKillForm = reactive({
  goodsID: undefined as number | undefined,
  killPriceYuan: 0,
  killInventory: 1,
  startTime: "",
})

const secKillTimePickerProps = {
  disabledMinutes: () => Array.from({length: 59}, (_, index) => index + 1),
  disabledSeconds: () => Array.from({length: 59}, (_, index) => index + 1),
}

function nextHourStart(): string {
  return dayjs().add(1, "hour").startOf("hour").format("YYYY-MM-DD HH:mm:ss")
}

function formatSecKillStartTime(value: unknown): string {
  if (!value) return ""
  const maybeDate = value as {toDate?: () => Date}
  const parsed = typeof maybeDate?.toDate === "function"
    ? dayjs(maybeDate.toDate())
    : dayjs(value as string | number | Date)
  if (!parsed.isValid()) {
    return ""
  }
  return parsed.startOf("hour").format("YYYY-MM-DDTHH:mm:ssZ")
}

function couponTypeName(type: number) {
  const map: Record<number, string> = {
    1: "节日",
    2: "新用户",
    3: "新商品",
    4: "商品",
    5: "普通",
  }
  return map[type] || "未知"
}

function openCoupon() {
  couponVisible.value = true
}

function openSecKill() {
  secKillForm.goodsID = undefined
  secKillForm.killPriceYuan = 0
  secKillForm.killInventory = 1
  secKillForm.startTime = nextHourStart()
  secKillVisible.value = true
}

async function createCoupon(done: (closed: boolean) => void) {
  const error = await couponFormRef.value.validate()
  if (error) {
    done(false)
    return
  }
  const res = await couponCreateApi({
    title: couponForm.title,
    type: couponForm.type,
    couponPrice: Math.round(couponForm.couponPriceYuan * 100),
    threshold: Math.round(couponForm.thresholdYuan * 100),
    validity: couponForm.validity,
    num: couponForm.num,
    goodsID: couponForm.goodsID,
    festival: couponForm.festival || undefined,
  })
  if (res.code) {
    Message.error(res.msg)
    done(false)
    return
  }
  Message.success(res.msg)
  couponListRef.value?.getList()
  done(true)
}

async function createSecKill(done: (closed: boolean) => void) {
  const error = await secKillFormRef.value.validate()
  if (error) {
    done(false)
    return
  }
  const startTime = formatSecKillStartTime(secKillForm.startTime)
  if (!startTime) {
    Message.error("开始时间格式错误")
    done(false)
    return
  }
  const res = await secKillCreateApi({
    goodsID: secKillForm.goodsID as number,
    killPrice: Math.round(secKillForm.killPriceYuan * 100),
    killInventory: secKillForm.killInventory,
    startTime,
  })
  if (res.code) {
    Message.error(res.msg)
    done(false)
    return
  }
  Message.success(res.msg)
  secKillListRef.value?.getList()
  done(true)
}

async function initGoodsOptions() {
  const res = await goodsOptionsApi()
  if (res.code) {
    Message.error(res.msg)
    return
  }
  goodsOptions.value = res.data
}

onMounted(initGoodsOptions)
</script>

<template>
  <div class="activity_manage_view">
    <a-tabs default-active-key="coupon">
      <a-tab-pane key="coupon" title="优惠券">
        <f_list
            ref="couponListRef"
            :url="couponListApi"
            :columns="couponColumns"
            :filter-group="couponFilterGroup"
            add-label="创建优惠券"
            search-placeholder="搜索优惠券"
            no-edit
            @add="openCoupon">
          <template #type="{record}:{record: couponType}">
            <a-tag>{{ couponTypeName(record.type) }}</a-tag>
          </template>
          <template #price="{record}:{record: couponType}">
            <div class="stack_cell">
              <span>优惠 ¥{{ (record.couponPrice / 100).toFixed(2) }}</span>
              <span>门槛 ¥{{ (record.threshold / 100).toFixed(2) }}</span>
            </div>
          </template>
          <template #num="{record}:{record: couponType}">
            {{ record.num }} / {{ record.receive }}
          </template>
          <template #validity="{record}:{record: couponType}">
            {{ record.validity }} 小时
          </template>
          <template #relation="{record}:{record: couponType}">
            <span v-if="record.goodsID">商品 {{ record.goodsID }}</span>
            <span v-else-if="record.festival">{{ record.festival }}</span>
            <span v-else class="muted">无</span>
          </template>
          <template #createdAt="{record}:{record: couponType}">
            {{ dateTemFormat(record.createdAt) }}
          </template>
        </f_list>
      </a-tab-pane>

      <a-tab-pane key="secKill" title="秒杀">
        <f_list
            ref="secKillListRef"
            :url="secKillAdminListApi"
            :columns="secKillColumns"
            add-label="创建秒杀"
            search-placeholder="搜索秒杀"
            no-edit
            @add="openSecKill">
          <template #goods="{record}:{record: secKillType}">
            <div class="goods_cell">
              <a-image v-if="record.cover" :src="record.cover" :width="44" :height="44" fit="cover"></a-image>
              <div>
                <strong>{{ record.title || `商品 ${record.goodsID}` }}</strong>
                <span>商品ID：{{ record.goodsID }}</span>
              </div>
            </div>
          </template>
          <template #price="{record}:{record: secKillType}">
            <div class="stack_cell">
              <span>秒杀 ¥{{ (record.killPrice / 100).toFixed(2) }}</span>
              <span>原价 ¥{{ ((record.price || 0) / 100).toFixed(2) }}</span>
            </div>
          </template>
          <template #inventory="{record}:{record: secKillType}">
            {{ record.buyNum }} / {{ record.killInventory }}
          </template>
          <template #time="{record}:{record: secKillType}">
            <div class="stack_cell">
              <span>{{ dateTemFormat(record.startTime) }}</span>
              <span>{{ dateTemFormat(record.endTime) }}</span>
            </div>
          </template>
          <template #createdAt="{record}:{record: secKillType}">
            {{ dateTemFormat(record.createdAt) }}
          </template>
        </f_list>
      </a-tab-pane>
    </a-tabs>

    <a-modal v-model:visible="couponVisible" title="创建优惠券" :on-before-ok="createCoupon">
      <a-form ref="couponFormRef" :model="couponForm" auto-label-width>
        <a-form-item field="title" label="标题">
          <a-input v-model="couponForm.title" placeholder="可选"></a-input>
        </a-form-item>
        <a-form-item field="type" label="类型" :rules="[{required: true, message: '请选择优惠券类型'}]">
          <a-select v-model="couponForm.type" :options="couponTypeOptions"></a-select>
        </a-form-item>
        <a-form-item field="couponPriceYuan" label="优惠金额" :rules="[{required: true, message: '请输入优惠金额'}]">
          <a-input-number v-model="couponForm.couponPriceYuan" :min="0.01" :precision="2" placeholder="单位：元"></a-input-number>
        </a-form-item>
        <a-form-item field="thresholdYuan" label="使用门槛">
          <a-input-number v-model="couponForm.thresholdYuan" :min="0" :precision="2" placeholder="单位：元"></a-input-number>
        </a-form-item>
        <a-form-item field="validity" label="有效期" :rules="[{required: true, message: '请输入有效期'}]">
          <a-input-number v-model="couponForm.validity" :min="1" placeholder="单位：小时"></a-input-number>
        </a-form-item>
        <a-form-item field="num" label="发放数量" :rules="[{required: true, message: '请输入发放数量'}]">
          <a-input-number v-model="couponForm.num" :min="1"></a-input-number>
        </a-form-item>
        <a-form-item v-if="couponForm.type === 4" field="goodsID" label="关联商品">
          <a-select v-model="couponForm.goodsID" :options="goodsOptions" placeholder="选择商品"></a-select>
        </a-form-item>
        <a-form-item v-if="couponForm.type === 1" field="festival" label="节日名称">
          <a-input v-model="couponForm.festival" placeholder="例如：端午节"></a-input>
        </a-form-item>
      </a-form>
    </a-modal>

    <a-modal v-model:visible="secKillVisible" title="创建秒杀" :on-before-ok="createSecKill">
      <a-form ref="secKillFormRef" :model="secKillForm" auto-label-width>
        <a-form-item field="goodsID" label="商品" :rules="[{required: true, message: '请选择商品'}]">
          <a-select v-model="secKillForm.goodsID" :options="goodsOptions" placeholder="选择商品"></a-select>
        </a-form-item>
        <a-form-item field="killPriceYuan" label="秒杀价" :rules="[{required: true, message: '请输入秒杀价'}]">
          <a-input-number v-model="secKillForm.killPriceYuan" :min="0.01" :precision="2" placeholder="单位：元"></a-input-number>
        </a-form-item>
        <a-form-item field="killInventory" label="秒杀库存" :rules="[{required: true, message: '请输入秒杀库存'}]">
          <a-input-number v-model="secKillForm.killInventory" :min="1"></a-input-number>
        </a-form-item>
        <a-form-item field="startTime" label="开始时间" :rules="[{required: true, message: '请选择开始时间'}]">
          <a-date-picker
            v-model="secKillForm.startTime"
            show-time
            :time-picker-props="secKillTimePickerProps"
            value-format="YYYY-MM-DD HH:mm:ss"
            format="YYYY-MM-DD HH:mm:ss"
            placeholder="选择开始时间"
            style="width: 100%"
          ></a-date-picker>
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<style lang="less">
.activity_manage_view {
  .arco-tabs-content {
    padding-top: 0;
  }

  .stack_cell {
    display: flex;
    flex-direction: column;
    line-height: 1.7;
    color: @color-text-2;
  }

  .goods_cell {
    display: flex;
    align-items: center;
    gap: 10px;

    strong,
    span {
      display: block;
      line-height: 1.6;
    }

    span {
      color: @color-text-2;
    }
  }

  .muted {
    color: @color-text-3;
  }

  .arco-image {
    border-radius: 4px;
    overflow: hidden;
  }
}
</style>
