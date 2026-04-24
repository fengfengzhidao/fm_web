import type {baseResponse, listResponse, paramsType} from "@/api/index";
import {useAxios} from "@/api/index";
import type {orderPayType} from "@/api/order_api";

export interface secKillCreateRequest {
    // 商品ID
    goodsID: number
    // 秒杀价，单位分
    killPrice: number
    // 秒杀库存
    killInventory: number
    // 开始时间
    startTime: string
}

export interface secKillType extends secKillCreateRequest {
    // 秒杀ID
    id: number
    // 创建时间
    createdAt: string
    // 更新时间
    updatedAt: string
    // 已购买数量
    buyNum: number
    // 结束时间
    endTime: string
    // 商品名称
    title?: string
    // 封面图
    cover?: string
    // 原价，单位分
    price?: number
}

export interface secKillInfoType {
    // 商品ID
    goodsID: number
    // 商品名称
    title: string
    // 封面图
    cover: string
    // 原价，单位分
    price: number
    // 秒杀价，单位分
    killPrice: number
    // 秒杀库存
    killInventory: number
    // 已购买数量
    buyNum: number
    // 开始时间
    startTime: string
    // 结束时间
    endTime: string
}

export interface secKillListParams extends paramsType {
    // 秒杀时间分组，格式：YYYY-MM-DD-HH
    date?: string
}

export interface secKillRequest {
    // 秒杀时间分组，格式：YYYY-MM-DD-HH
    date: string
    // 商品ID
    goodsID: number
}

export interface secKillDetailRequest {
    // 秒杀购买凭证
    key: string
}

export interface secKillResponseType {
    // 秒杀购买凭证
    key: string
}

export interface secKillDetailType extends secKillInfoType {
}

export interface secKillOrderRequest extends secKillDetailRequest {
    // 地址ID
    addrID: number
    // 支付方式
    payType: number
    // 订单备注
    note?: string
}

export function secKillCreateApi(data: secKillCreateRequest): Promise<baseResponse<string>> {
    return useAxios.post("/api/sec_kill", data)
}

export function secKillAdminListApi(params?: paramsType): Promise<baseResponse<listResponse<secKillType>>> {
    return useAxios.get("/api/sec_kill", {params})
}

export function secKillRemoveApi(idList: number[]): Promise<baseResponse<string>> {
    return useAxios.delete("/api/sec_kill", {data: {idList}})
}

export interface secKillDateItem {
    // 秒杀码段，格式：YYYY-MM-DD HH:00:00
    date: string
}

export function secKillDateListApi(): Promise<baseResponse<secKillDateItem[]>> {
    return useAxios.get("/api/sec_kill/date")
}

export function secKillListApi(params?: secKillListParams): Promise<baseResponse<secKillInfoType[]>> {
    return useAxios.get("/api/sec_kill/list", {params})
}

export function secKillApi(data: secKillRequest): Promise<baseResponse<secKillResponseType>> {
    return useAxios.post("/api/sec_kill/user", data)
}

export function secKillDetailApi(data: secKillDetailRequest): Promise<baseResponse<secKillDetailType>> {
    return useAxios.post("/api/sec_kill/detail", data)
}

export function secKillOrderApi(data: secKillOrderRequest): Promise<baseResponse<orderPayType>> {
    return useAxios.post("/api/sec_kill/order", data)
}
