import type {baseResponse, listResponse, paramsType} from "@/api/index";
import {useAxios} from "@/api/index";

export interface couponCreateRequest {
    // 优惠券类型：1 通用，2 新用户，3 商品
    type: number
    // 优惠金额，单位分
    couponPrice: number
    // 使用门槛，单位分
    threshold: number
    // 有效期，单位小时
    validity: number
    // 发放数量
    num: number
    // 关联商品ID
    goodsID?: number
    // 节日名称
    festival?: string
}

export interface couponType extends couponCreateRequest {
    // 优惠券ID
    id: number
    // 创建时间
    createdAt: string
    // 更新时间
    updatedAt: string
    // 优惠券标题
    title: string
    // 已领取数量
    receive: number
}

export interface couponReceiveRequest {
    // 优惠券ID
    couponID: number
}

export interface userCouponType {
    // 用户优惠券ID
    id: number
    // 优惠券标题
    title: string
    // 优惠券类型：1 通用，2 新用户，3 商品
    type: number
    // 优惠金额，单位分
    couponPrice: number
    // 使用门槛，单位分
    threshold: number
    // 关联商品ID
    goodsID?: number | null
    // 优惠券ID
    couponID: number
    // 优惠券状态：2 未使用，3 已使用，4 已过期
    status: number
    // 有效期，单位小时
    validity: number
}

export interface userCouponListParams extends paramsType {
    // 优惠券状态：2 未使用，3 已使用，4 已过期
    status?: number
}

export function couponCreateApi(data: couponCreateRequest): Promise<baseResponse<string>> {
    return useAxios.post("/api/coupon", data)
}

export function couponListApi(params?: paramsType): Promise<baseResponse<listResponse<couponType>>> {
    return useAxios.get("/api/coupon", {params})
}

export function couponRemoveApi(idList: number[]): Promise<baseResponse<string>> {
    return useAxios.delete("/api/coupon", {data: {idList}})
}

export interface acceptableCouponType extends couponType {
    // 当前用户是否已领取
    isReceive: boolean
}

export function couponAcceptableListApi(params?: paramsType): Promise<baseResponse<listResponse<acceptableCouponType>>> {
    return useAxios.get("/api/coupon/acceptable", {params})
}

export function couponReceiveApi(data: couponReceiveRequest): Promise<baseResponse<string>> {
    return useAxios.post("/api/coupon/receive", data)
}

export function userCouponListApi(params?: userCouponListParams): Promise<baseResponse<listResponse<userCouponType>>> {
    return useAxios.get("/api/coupon/user", {params})
}
