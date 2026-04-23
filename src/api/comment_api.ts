import type {baseResponse, listResponse, paramsType} from "@/api/index";
import {useAxios} from "@/api/index";

export interface commentCreateItem {
    // 订单商品ID
    orderGoodsID: number
    // 评论内容
    content: string
    // 满意度 1-5
    level: number
    // 评论图片
    images: string[]
}

export interface commentCreateRequest {
    // 评论列表
    list: commentCreateItem[]
}

export interface commentType {
    // 评论ID
    id: number
    // 创建时间
    createdAt: string
    // 更新时间
    updatedAt: string
    // 用户ID
    userID: number
    // 订单商品ID
    orderGoodsID: number
    // 订单ID
    orderID: number
    // 商品ID
    goodsID: number
    // 商品名称
    goodsTitle?: string
    // 用户昵称
    userNickname?: string
    // 评论内容
    content: string
    // 满意度 1-5
    level: number
    // 评论图片
    images: string[]
}

export interface commentLevelParams extends paramsType {
    // 商品ID
    goodsID: number
}

export interface commentLevelType {
    // 全部评论数
    allCount: number
    // 有图评论数
    imageCount: number
    // 好评数
    greatCount: number
    // 中评数
    middleCount: number
    // 差评数
    badCount: number
}

export interface goodsCommentType {
    // 评论内容
    content: string
    // 满意度 1-5
    level: number
    // 评论图片
    images: string[]
    // 用户昵称
    userNickname: string
    // 用户头像
    userAvatar: string
    // 创建时间
    createdAt: string
}

export interface goodsCommentListParams extends paramsType {
    // 商品ID
    goodsID: number
    // 是否只看有图
    isImages?: boolean
    // 评论类型：0 全部，1 好评，2 中评，3 差评
    commentType?: number
}

export function commentCreateApi(data: commentCreateRequest): Promise<baseResponse<string>> {
    return useAxios.post("/api/comment", data)
}

export function commentUserListApi(params?: paramsType): Promise<baseResponse<listResponse<commentType>>> {
    return useAxios.get("/api/comment/user", {params})
}

export function commentAdminListApi(params?: paramsType): Promise<baseResponse<listResponse<commentType>>> {
    return useAxios.get("/api/comment/admin", {params})
}

export function commentLevelApi(params: commentLevelParams): Promise<baseResponse<commentLevelType>> {
    return useAxios.get("/api/comment/level", {params})
}

export function goodsCommentListApi(params: goodsCommentListParams): Promise<baseResponse<listResponse<goodsCommentType>>> {
    return useAxios.get("/api/comment/goods", {params})
}
