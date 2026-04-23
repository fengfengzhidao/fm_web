import {type baseResponse, type listResponse, type optionsType, type paramsType, useAxios} from "@/api/index";


export interface emailLoginRequest {
    username: string
    password: string
    captchaID?: string
    captchaCode?: string
}

export function emailLoginApi(data: emailLoginRequest): Promise<baseResponse<string>> {
    return useAxios.post("/api/users/login", data)
}


export interface userInfoType {
    "id": number
    "createdAt": string
    "updatedAt": string
    "nickname": string
    "username": string
    "avatar": string
    "addr": string
    "ip": string
    "roleID": number
}

export function userInfoApi(): Promise<baseResponse<userInfoType>> {
    return useAxios.get("/api/users/detail")
}

export function userLogoutApi(): Promise<baseResponse<string>> {
    return useAxios.post("/api/users/logout")
}

export interface userListType {
    "id": number
    "created_at": string
    "nick_name": string
    "user_name": string
    "avatar": string
    "email": string
    "tel": string
    "addr": string
    "token": string
    "ip": string
    "role": string
    "sign_status": string
    "integral": number
    "sign": string
    "link": string
    "role_id": number
}

export function userListApi(params?: paramsType): Promise<baseResponse<listResponse<userListType>>> {
    return useAxios.get("/api/users", {params})
}


export function articleCategoryOptionsApi(params?: paramsType): Promise<baseResponse<optionsType[]>> {
    return useAxios.get("/api/categorys")
}
