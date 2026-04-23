import type {baseResponse} from "@/api/index";
import {useAxios} from "@/api/index";

export function imageUploadApi(file: File): Promise<baseResponse<string>> {
    const formData = new FormData()
    formData.append("file", file)
    return useAxios.post("/api/images/upload", formData)
}
