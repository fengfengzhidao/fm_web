import type {baseResponse} from "@/api/index";
import {useAxios} from "@/api/index";

export interface carCreateRequest {
    // 商品ID
    goodsID: number
    // 购买数量
    num: number
}

export interface carListRequest {
    // 购物车ID列表
    carIDList?: number[]
    // 用户优惠券ID列表
    couponIDList?: number[]
}

export interface carNumUpdateRequest {
    // 购物车ID
    carID: number
    // 商品数量
    num: number
}

export interface carCouponInfoType {
    // 用户优惠券ID
    id: number
    // 优惠券类型
    type: number
    // 优惠金额，单位分
    couponPrice: number
    // 使用门槛，单位分
    threshold: number
    // 关联商品ID
    goodsID?: number | null
    // 是否使用
    used?: boolean
}

export interface carGoodsInfoType {
    // 商品ID
    goodsID: number
    // 购物车ID
    carID: number
    // 封面图
    cover: string
    // 商品名称
    title: string
    // 单价，单位分
    price: number
    // 总价，单位分
    totalPrice: number
    // 实付价，单位分
    payPrice: number
    // 商品数量
    num: number
    // 是否勾选
    used: boolean
    // 商品优惠券
    couponInfo?: carCouponInfoType | null
}

export interface carListType {
    // 商品列表
    goodsList: carGoodsInfoType[]
    // 可用优惠券列表
    couponList: carCouponInfoType[]
    // 优惠后应付金额，单位分
    price: number
}

export function carCreateApi(data: carCreateRequest): Promise<baseResponse<string>> {
    return useAxios.post("/api/car", data)
}

export function carRemoveApi(idList: number[]): Promise<baseResponse<string>> {
    return useAxios.delete("/api/car", {data: {idList}})
}

export function carToCollectApi(idList: number[]): Promise<baseResponse<string>> {
    return useAxios.post("/api/car/collect", {idList})
}

export function carListApi(data?: carListRequest): Promise<baseResponse<carListType>> {
    return useAxios.post("/api/car/list", data || {})
}

export function carNumUpdateApi(data: carNumUpdateRequest): Promise<baseResponse<string>> {
    return useAxios.put("/api/car/num", data)
}
