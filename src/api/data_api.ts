import type {baseResponse, optionsType} from "@/api/index";
import {useAxios} from "@/api/index";

export function dataStatisticApi(): Promise<baseResponse<optionsType[]>> {
    return useAxios.get("/api/data/statistic")
}

export interface weatherType {
    "province": string
    "city": string
    "adcode": string
    "weather": string // 天气
    "temperature": string // 温度
    "winddirection": string
    "windpower": string
    "humidity": string
    "reporttime": string
    "temperature_float": string
    "humidity_float": string
}

export function dataWeatherApi(): Promise<baseResponse<weatherType>> {
    return useAxios.get("/api/data/weather")
}

export interface dataLoginStatisticType{
    dateList: string[]
    loginList: number[]
    signList: number[]
}
export function dataLoginStatisticApi():Promise<baseResponse<dataLoginStatisticType>>{
    return  useAxios.get("/api/data/user_trend")
}

export interface dataUserStatisticType {
    // 购物车商品数量
    carNum: number
    // 未读消息数量
    msgNum: number
    // 待付款订单数量
    obligation: number
    // 待发货订单数量
    pendingShipment: number
    // 待收货订单数量
    pendingPut: number
    // 待评价订单数量
    pendingComment: number
}

export function dataUserStatisticApi(): Promise<baseResponse<dataUserStatisticType>> {
    return useAxios.get("/api/data/user")
}

export interface dataSystemStatisticType extends dataUserStatisticType {
    // 用户数量
    userNum: number
    // 上架商品数量
    goodsNum: number
    // 秒杀商品数量
    secKillNum: number
    // 成功订单数量
    successOrderNum: number
    // 今日登录数量
    newLoginCount: number
}

export function dataSystemStatisticApi(): Promise<baseResponse<dataSystemStatisticType>> {
    return useAxios.get("/api/data/system")
}

export interface dataOrderTrendType {
    // 日期列表
    dateList: string[]
    // 订单数量列表
    countList: number[]
}

export function dataOrderTrendApi(): Promise<baseResponse<dataOrderTrendType>> {
    return useAxios.get("/api/data/order_trend")
}

export interface dataComputerType {
    // CPU使用率
    cpuPercent: number
    // 内存使用率
    memPercent: number
    // 磁盘使用率
    diskPercent: number
}

export function dataComputerApi(): Promise<baseResponse<dataComputerType>> {
    return useAxios.get("/api/data/computer")
}
