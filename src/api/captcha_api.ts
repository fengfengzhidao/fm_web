import type {baseResponse} from "@/api/index";
import {useAxios} from "@/api/index";

export interface captchaGenerateType {
    // 图片验证码ID
    captchaID: string
    // base64图片验证码
    captcha: string
}

export function captchaGenerateApi(): Promise<baseResponse<captchaGenerateType>> {
    return useAxios.get("/api/captcha/generate")
}
