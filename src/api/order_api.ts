import type {baseResponse, listResponse, paramsType} from "@/api/index";
import {useAxios} from "@/api/index";
import type {addrType} from "@/api/user_center_api";

export interface orderGoodsRequest {
    // 商品ID
    goodsID: number
    // 购买数量
    num: number
    // 备注
    note?: string
}

export interface orderConfirmRequest {
    // 下单商品列表
    orderGoodsList: orderGoodsRequest[]
    // 用户优惠券ID列表
    couponIDList?: number[]
}

export interface orderConfirmGoodsType {
    // 商品ID
    goodsID: number
    // 封面图
    cover: string
    // 商品名称
    title: string
    // 实际价格，单位分
    price: number
    // 库存，null 表示无限库存
    inventory?: number | null
    // 购买数量
    num: number
    // 商品状态
    status: number
}

export interface orderConfirmCouponType {
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
}

export interface orderConfirmType {
    // 商品列表
    goodsList: orderConfirmGoodsType[]
    // 优惠券列表
    couponList: orderConfirmCouponType[]
    // 优惠后金额，单位分
    price: number
}

export interface orderPayRequest extends orderConfirmRequest {
    // 地址ID
    addrID: number
    // 支付方式
    payType: number
    // 购物车ID列表
    carIDList?: number[]
}

export interface orderPayType {
    // 订单号
    no: string
    // 支付地址
    payUrl?: string
}

export interface orderStatusParams extends paramsType {
    // 订单号
    no: string
}

export interface orderNoteUpdateRequest {
    // 订单商品ID
    orderGoodsID: number
    // 备注
    note: string
}

export interface orderAdminListParams extends paramsType {
    // 订单号
    no?: string
    // 用户ID
    userID?: number
    // 订单状态
    status?: number
}

export interface orderUserListParams extends paramsType {
    // 订单号
    no?: string
    // 商品名称
    goodsTitle?: string
}

export interface orderAdminGoodsType {
    // 商品ID
    goodsID: number
    // 商品封面
    goodsCover: string
    // 商品名称
    goodsTitle: string
    // 发货状态
    status: number
    // 订单商品ID
    orderGoodsID: number
}

export interface orderAdminType {
    // 订单ID
    id: number
    // 创建时间
    createdAt: string
    // 更新时间
    updatedAt: string
    // 删除时间
    deletedAt?: string | null
    // 用户ID
    userID: number
    // 地址ID
    addrID: number
    // 支付方式
    payType: number
    // 订单金额，单位分
    price: number
    // 优惠金额，单位分
    coupon: number
    // 订单号
    no: string
    // 订单状态
    status: number
    // 支付时间
    payTime?: string | null
    // 支付地址
    payUrl: string
    // 购物车ID列表
    carIDList: number[]
    // 秒杀购买凭证
    pzKey: string
    // 用户昵称
    userNickname: string
    // 订单商品列表
    orderGoodsList: orderAdminGoodsType[]
}

export interface orderUserGoodsType {
    // 商品ID
    goodsID: number
    // 商品封面
    goodsCover: string
    // 商品名称
    goodsTitle: string
    // 商品价格，单位分
    goodsPrice: number
    // 数量
    num: number
    // 备注
    note: string
    // 订单商品ID
    orderGoodsID: number
}

export interface orderUserType {
    // 订单ID
    id: number
    // 创建时间
    createdAt: string
    // 订单号
    no: string
    // 订单状态
    status: number
    // 订单金额，单位分
    price: number
    // 优惠金额，单位分
    couponPrice: number
    // 订单商品列表
    orderGoodsList: orderUserGoodsType[]
}

export interface orderSendOutGoodsRequest {
    // 订单商品ID
    orderGoodsID: number
    // 运单号
    waybillNumber: string
    // 发货消息
    message: string
}

export interface orderRevGoodsRequest {
    // 订单ID
    orderID: number
}

export interface orderDetailGoodsType {
    // 商品ID
    goodsID: number
    // 订单商品ID
    orderGoodsID: number
    // 封面图
    cover: string
    // 商品名称
    title: string
    // 商品价格，单位分
    price: number
    // 数量
    num: number
    // 备注
    note: string
}

export interface orderDetailCouponType {
    // 优惠金额，单位分
    couponPrice: number
    // 优惠券类型
    type: number
}

export interface orderDetailType extends orderAdminType {
    // 商品列表
    goodsList: orderDetailGoodsType[]
    // 优惠券列表
    couponList: orderDetailCouponType[]
    // 地址信息
    addrInfo: addrType
}

export interface orderCallbackRequest {
    // 订单号
    no: string
}

export interface orderPayPageParams extends paramsType {
    // 订单号
    no: string
}

export interface orderPayPageType {
    // 订单号
    no: string
    // 订单金额，单位分
    price: number
}

export function orderConfirmApi(data: orderConfirmRequest): Promise<baseResponse<orderConfirmType>> {
    return useAxios.post("/api/order/confirm", data)
}

export function orderPayApi(data: orderPayRequest): Promise<baseResponse<orderPayType>> {
    return useAxios.post("/api/order/pay", data)
}

export interface orderStatusType {
    // 订单状态
    status: number
}

export function orderStatusApi(params: orderStatusParams): Promise<baseResponse<orderStatusType>> {
    return useAxios.get("/api/order/status", {params})
}

export function orderNoteUpdateApi(data: orderNoteUpdateRequest): Promise<baseResponse<string>> {
    return useAxios.put("/api/order/note", data)
}

export function orderAdminListApi(params?: orderAdminListParams): Promise<baseResponse<listResponse<orderAdminType>>> {
    return useAxios.get("/api/order/admin", {params})
}

export function orderAdminRemoveApi(idList: number[]): Promise<baseResponse<string>> {
    return useAxios.delete("/api/order/admin", {data: {idList}})
}

export function orderUserListApi(params?: orderUserListParams): Promise<baseResponse<listResponse<orderUserType>>> {
    return useAxios.get("/api/order/user", {params})
}

export function orderUserRemoveApi(idList: number[]): Promise<baseResponse<string>> {
    return useAxios.delete("/api/order/user", {data: {idList}})
}

export function orderSendOutGoodsApi(data: orderSendOutGoodsRequest): Promise<baseResponse<string>> {
    return useAxios.post("/api/order/send_out_goods", data)
}

export function orderRevGoodsApi(data: orderRevGoodsRequest): Promise<baseResponse<string>> {
    return useAxios.post("/api/order/rev_goods", data)
}

export function orderDetailApi(id: number | string): Promise<baseResponse<orderDetailType>> {
    return useAxios.get(`/api/order/detail/${id}`)
}

export function orderCallbackApi(data: orderCallbackRequest): Promise<baseResponse<string>> {
    return useAxios.post("/api/order/callback", data)
}

export function orderPayPageApi(params: orderPayPageParams): Promise<baseResponse<orderPayPageType>> {
    return useAxios.get("/api/order/pay/page", {params})
}
