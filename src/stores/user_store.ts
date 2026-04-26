import {ref, computed} from 'vue'
import {defineStore} from 'pinia'
import {userInfoApi, userLogoutApi} from "@/api/user_api";
import {Message} from "@arco-design/web-vue";
import {parseToken} from "@/utils/parse_token";
import router from "@/router";

interface userInfoType {
    userID: number
    nickName: string
    userName: string
    avatar: string
    role: number
    token: string
}

interface userStoreType {
    userInfo: userInfoType
    loginModalVisible: boolean
    loginRedirect: string
}


export const userStorei = defineStore('userStore', {
    state: (): userStoreType => {
        return {
            userInfo: {
                userID: 0,
                nickName: "",
                userName: "",
                avatar: "",
                role: 0,
                token: "",
            },
            loginModalVisible: false,
            loginRedirect: "",
        }
    },
    actions: {
        openLoginModal(redirect = "") {
            this.loginRedirect = redirect
            this.loginModalVisible = true
        },
        closeLoginModal() {
            this.loginModalVisible = false
            this.loginRedirect = ""
        },
         async saveUserInfo(token: string) {
            // 传一个token过来，然后重新去调用户信息接口
            this.userInfo.token = token
            const payLoad = parseToken(token)
            this.userInfo.userID = payLoad.userID || payLoad.user_id || 0
            this.userInfo.role = payLoad.roleID || payLoad.role || 0

             const res = await userInfoApi()
             if (res.code) {
                 Message.error(res.msg)
                 return
             }

             this.userInfo = {
                 userID: res.data.id,
                 nickName: res.data.nickname,
                 userName: res.data.username,
                 avatar: res.data.avatar,
                 role: res.data.roleID,
                 token: token,
             }
             // 持久化
             localStorage.setItem("userInfo", JSON.stringify(this.userInfo))
        },
        loadUserInfo() {
            const val = localStorage.getItem("userInfo")
            if (!val) {
                return
            }
            try {
                this.userInfo = JSON.parse(val)
            } catch (e) {
                console.log(e)
                console.log(val)
                return;
            }

            // 判断token有没有过期
            const payLoad = parseToken(this.userInfo.token) // exp的时间是秒
            const nowTime = new Date().getTime() // 单位是毫秒
            if (payLoad.exp * 1000 - nowTime <= 0) {
                Message.warning("token已过期")
                localStorage.removeItem("userInfo")
                router.push({name: "web"})
                return;
            }
        },
        async userLogout() {
            await userLogoutApi()
            localStorage.removeItem("userInfo")
            this.userInfo = {
                userID: 0,
                nickName: "",
                userName: "",
                avatar: "",
                role: 0,
                token: "",
            }
            Message.success("用户注销成功")
            router.push({name: "web_home"})
        }

    },
    getters: {
        isLogin(): boolean {
            return this.userInfo.userID !== 0
        },
        isAdmin(): boolean {
            return this.userInfo.role == 1
        }
    }
})
