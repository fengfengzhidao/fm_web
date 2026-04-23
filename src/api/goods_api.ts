import type {baseResponse, listResponse, optionsType, paramsType} from "@/api/index";
import {useAxios} from "@/api/index";

export interface goodsSubConfigType {
    // 配置项名称
    title: string
    // 配置项图片
    image: string
}

export interface goodsConfigType {
    // 配置组名称
    title: string
    // 配置项列表
    subList: goodsSubConfigType[]
}

export interface goodsCreateRequest {
    // 商品名称
    title: string
    // 商品视频地址
    videoPath?: string
    // 商品主图
    images: string[]
    // 商品价格，单位分
    price: number
    // 商品库存，不传表示无限库存
    inventory?: number
    // 商品分类
    category: string
    // 商品简介
    abstract: string
    // 商品高级配置
    goodsConfigList: goodsConfigType[]
}

export interface goodsUpdateRequest extends goodsCreateRequest {
    // 商品ID
    id: number
}

export interface goodsType {
    // 商品ID
    id: number
    // 创建时间
    createdAt: string
    // 更新时间
    updatedAt: string
    // 商品名称
    title: string
    // 商品视频地址
    videoPath?: string
    // 商品主图
    images: string[]
    // 商品价格，单位分
    price: number
    // 商品库存，null 表示无限库存
    inventory?: number | null
    // 商品分类
    category: string
    // 商品简介
    abstract: string
    // 商品高级配置
    goodsConfigList: goodsConfigType[]
    // 商品状态：1 上架，2 下架
    status: number
    // 浏览量
    lookCount: number
    // 评论量
    commentCount: number
    // 销量
    salesNum: number
}

export interface goodsIndexType {
    // 商品ID
    id: number
    // 封面图
    cover: string
    // 商品名称
    title: string
    // 商品价格，单位分
    price: number
    // 销量
    salesNum: number
}

export interface goodsOptionType {
    // 商品ID
    id: number
    // 封面图
    cover: string
    // 商品名称
    title: string
}

export interface goodsDetailCouponType {
    // 优惠券ID
    couponID: number
    // 优惠金额，单位分
    couponPrice: number
    // 使用门槛，单位分
    threshold: number
    // 当前用户是否已领取
    isReceive: boolean
}

export interface goodsDetailType extends goodsType {
    // 当前用户是否已收藏
    isCollect: boolean
    // 是否有商品优惠券
    isGoodCoupon: boolean
    // 商品优惠券信息
    goodsDetailCoupon?: goodsDetailCouponType | null
}

export interface goodsListParams extends paramsType {
    // 是否只查询秒杀商品
    secKill?: boolean
    // 商品分类
    category?: string
}

export interface goodsIndexParams extends paramsType {
    // 商品分类
    category?: string
    // 排序：price desc、price asc、sales_num asc、sales_num desc
    order?: string
}

export function goodsCreateApi(data: goodsCreateRequest): Promise<baseResponse<string>> {
    return useAxios.post("/api/goods", data)
}

export function goodsUpdateApi(data: goodsUpdateRequest): Promise<baseResponse<string>> {
    return useAxios.put("/api/goods", data)
}

export function goodsAdminListApi(params?: goodsListParams): Promise<baseResponse<listResponse<goodsType>>> {
    return useAxios.get("/api/goods/admin", {params})
}

export function goodsAdminRemoveApi(idList: number[]): Promise<baseResponse<string>> {
    return useAxios.delete("/api/goods/admin", {data: {idList}})
}

export function goodsDetailApi(id: number | string): Promise<baseResponse<goodsDetailType>> {
    return useAxios.get(`/api/goods/${id}`)
}

export function goodsCategoryListApi(): Promise<baseResponse<optionsType[]>> {
    return useAxios.get("/api/goods/category")
}

export function goodsCategoryOptionsApi(): Promise<baseResponse<optionsType[]>> {
    return goodsCategoryListApi()
}

export interface goodsStatusUpdateRequest {
    // 商品ID
    id: number
    // 商品状态：1 上架，2 下架
    status: number
}

export function goodsStatusUpdateApi(data: goodsStatusUpdateRequest): Promise<baseResponse<string>> {
    return useAxios.put("/api/goods/status", data)
}

export function goodsAdminOptionsApi(): Promise<baseResponse<goodsOptionType[]>> {
    return useAxios.get("/api/goods/options/admin")
}

export function goodsIndexListApi(params?: goodsIndexParams): Promise<baseResponse<listResponse<goodsIndexType>>> {
    return useAxios.get("/api/goods/index", {params})
}

export function goodsOptionsApi(): Promise<baseResponse<optionsType[]>> {
    return goodsAdminOptionsApi().then((res) => ({
        ...res,
        data: res.data?.map((item) => ({label: item.title, value: item.id})) || []
    }))
}
