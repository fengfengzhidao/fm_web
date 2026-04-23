import type {baseResponse, listResponse, paramsType} from "@/api/index";
import {useAxios} from "@/api/index";

export interface goodsActionRequest {
    // 商品ID
    goodsID: number
}

export interface lookGoodsType {
    // 足迹ID
    id: number
    // 创建时间
    createdAt: string
    // 更新时间
    updatedAt: string
    // 用户ID
    userID: number
    // 商品ID
    goodsID: number
    // 商品名称缓存
    goodsTitle: string
}

export interface collectGoodsType {
    // 收藏ID
    id: number
    // 创建时间
    createdAt: string
    // 更新时间
    updatedAt: string
    // 用户ID
    userID: number
    // 商品ID
    goodsID: number
    // 商品名称缓存
    goodsTitle: string
}

export interface addrRequest {
    // 收货人
    name: string
    // 手机号
    tel: string
    // 省市区地址
    addr: string
    // 详细地址
    detailAddr: string
}

export interface addrUpdateRequest extends addrRequest {
    // 地址ID
    id: number
}

export interface addrType extends addrUpdateRequest {
    // 创建时间
    createdAt: string
    // 更新时间
    updatedAt: string
    // 用户ID
    userID: number
    // 是否默认地址
    isDefault: boolean
}

export function lookGoodsApi(data: goodsActionRequest): Promise<baseResponse<string>> {
    return useAxios.post("/api/user_center/look", data)
}

export function lookGoodsListApi(params?: paramsType): Promise<baseResponse<listResponse<lookGoodsType>>> {
    return useAxios.get("/api/user_center/look", {params})
}

export function lookGoodsRemoveApi(idList: number[]): Promise<baseResponse<string>> {
    return useAxios.delete("/api/user_center/look", {data: {idList}})
}

export function collectGoodsApi(data: goodsActionRequest): Promise<baseResponse<string>> {
    return useAxios.post("/api/user_center/collect", data)
}

export function collectGoodsListApi(params?: paramsType): Promise<baseResponse<listResponse<collectGoodsType>>> {
    return useAxios.get("/api/user_center/collect", {params})
}

export function collectGoodsRemoveApi(idList: number[]): Promise<baseResponse<string>> {
    return useAxios.delete("/api/user_center/collect", {data: {idList}})
}

export function addrCreateApi(data: addrRequest): Promise<baseResponse<string>> {
    return useAxios.post("/api/user_center/addr", data)
}

export function addrListApi(): Promise<baseResponse<addrType[]>> {
    return useAxios.get("/api/user_center/addr")
}

export function addrUpdateApi(data: addrUpdateRequest): Promise<baseResponse<string>> {
    return useAxios.put("/api/user_center/addr", data)
}

export function addrRemoveApi(idList: number[]): Promise<baseResponse<string>> {
    return useAxios.delete("/api/user_center/addr", {data: {idList}})
}

export function addrDefaultApi(id: number | string): Promise<baseResponse<string>> {
    return useAxios.post(`/api/user_center/addr/default/${id}`)
}
