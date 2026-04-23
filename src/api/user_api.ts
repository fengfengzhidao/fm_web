import {type baseResponse, type listResponse, type optionsType, type paramsType, useAxios} from "@/api/index";


export interface emailLoginRequest {
    // 用户名
    username: string
    // 密码
    password: string
    // 图片验证码ID
    captchaID?: string
    // 图片验证码
    captchaCode?: string
}

export function emailLoginApi(data: emailLoginRequest): Promise<baseResponse<string>> {
    return useAxios.post("/api/users/login", data)
}

export interface userRegisterRequest extends emailLoginRequest {
    // 确认密码
    rePassword: string
}

export function userRegisterApi(data: userRegisterRequest): Promise<baseResponse<string>> {
    return useAxios.post("/api/users/register", data)
}

export interface userInfoType {
    // 用户ID
    "id": number
    // 创建时间
    "createdAt": string
    // 更新时间
    "updatedAt": string
    // 昵称
    "nickname": string
    // 用户名
    "username": string
    // 头像
    "avatar": string
    // 地址
    "addr": string
    // 登录IP
    "ip": string
    // 角色ID：1 管理员，2 普通用户
    "roleID": number
}

export function userInfoApi(): Promise<baseResponse<userInfoType>> {
    return useAxios.get("/api/users/detail")
}

export function userLogoutApi(): Promise<baseResponse<string>> {
    return useAxios.post("/api/users/logout")
}

export interface userListType {
    // 用户ID
    id: number
    // 创建时间
    createdAt: string
    // 更新时间
    updatedAt: string
    // 用户名
    username: string
    // 昵称
    nickname: string
    // 头像
    avatar: string
    // 角色ID：1 管理员，2 普通用户
    roleID: number
    // 登录IP
    ip?: string
    // 地址
    addr?: string
}

export function userListApi(params?: paramsType): Promise<baseResponse<listResponse<userListType>>> {
    return useAxios.get("/api/users", {params})
}

export function userRemoveApi(idList: number[]): Promise<baseResponse<string>> {
    return useAxios.delete("/api/users", {data: {idList}})
}

export interface userPwdUpdateRequest {
    // 旧密码
    oldPassword: string
    // 新密码
    password: string
    // 确认新密码
    rePassword: string
}

export function userPwdUpdateApi(data: userPwdUpdateRequest): Promise<baseResponse<string>> {
    return useAxios.put("/api/users/pwd", data)
}

export interface userInfoUpdateRequest {
    // 昵称
    nickname: string
    // 头像
    avatar: string
}

export function userInfoUpdateApi(data: userInfoUpdateRequest): Promise<baseResponse<string>> {
    return useAxios.put("/api/users/info", data)
}

export interface userAdminInfoUpdateRequest extends userInfoUpdateRequest {
    // 用户ID
    userID: number
    // 角色ID：1 管理员，2 普通用户
    roleID: number
}

export function userAdminInfoUpdateApi(data: userAdminInfoUpdateRequest): Promise<baseResponse<string>> {
    return useAxios.put("/api/users/info/admin", data)
}


export function articleCategoryOptionsApi(params?: paramsType): Promise<baseResponse<optionsType[]>> {
    return useAxios.get("/api/categorys")
}
