import type {baseResponse, listResponse, paramsType} from "@/api/index";
import {useAxios} from "@/api/index";

export interface msgListParams extends paramsType {
    // 是否已读
    isRead?: boolean
}

export interface msgType {
    // 消息ID
    id: number
    // 创建时间
    createdAt: string
    // 更新时间
    updatedAt: string
    // 用户ID
    userID: number
    // 订单ID
    orderID: number
    // 商品ID
    goodsID: number
    // 商品名称
    goodsTitle?: string
    // 订单商品ID
    orderGoodsID: number
    // 消息内容列表
    msgList: string[]
    // 是否已读
    isRead: boolean
}

export function msgUserListApi(params?: msgListParams): Promise<baseResponse<listResponse<msgType>>> {
    return useAxios.get("/api/msg/user", {params})
}

export function msgUserRemoveApi(idList: number[]): Promise<baseResponse<string>> {
    return useAxios.delete("/api/msg/user", {data: {idList}})
}

export function msgAdminListApi(params?: paramsType): Promise<baseResponse<listResponse<msgType>>> {
    return useAxios.get("/api/msg/admin", {params})
}

export function msgAdminRemoveApi(idList: number[]): Promise<baseResponse<string>> {
    return useAxios.delete("/api/msg/admin", {data: {idList}})
}

export function msgReadApi(id: number | string): Promise<baseResponse<string>> {
    return useAxios.get(`/api/msg/read/${id}`)
}
