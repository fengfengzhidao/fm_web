<script setup lang="ts">
import {computed, reactive, ref, watch} from "vue";
import type {userRegisterRequest} from "@/api/user_api";
import {emailLoginApi, userRegisterApi} from "@/api/user_api";
import {Message} from "@arco-design/web-vue";
import {userStorei} from "@/stores/user_store";
import router from "@/router";
import {useRoute} from "vue-router";
import {captchaGenerateApi} from "@/api/captcha_api";

const store = userStorei()
const route = useRoute()
const authMode = ref<"login" | "register">("login")
const form = reactive<userRegisterRequest>({
  username: "",
  password: "",
  rePassword: "",
  captchaID: "",
  captchaCode: "",
})

const formRef = ref()
const visible = computed(() => store.loginModalVisible)
const captchaImage = ref("")
const confirmPasswordRules = [
  {required: true, message: "请再次输入密码"},
  {
    validator: (value: string, callback: (message?: string) => void) => {
      if (value !== form.password) {
        callback("两次输入的密码不一致")
        return
      }
      callback()
    }
  }
]

watch(visible, val => {
  if (!val) return
  authMode.value = "login"
  form.username = ""
  form.password = ""
  form.rePassword = ""
  form.captchaID = ""
  form.captchaCode = ""
  refreshCaptcha()
})

function closeLogin() {
  store.closeLoginModal()
}

async function refreshCaptcha() {
  try {
    const res = await captchaGenerateApi()
    if (res.code) {
      Message.error(res.msg)
      return
    }
    form.captchaID = res.data.captchaID
    captchaImage.value = res.data.captcha.startsWith("data:image")
      ? res.data.captcha
      : `data:image/png;base64,${res.data.captcha}`
  } catch (error) {
    console.error(error)
    Message.error("验证码加载失败")
  }
}

async function emailLogin() {
  const val = await formRef.value.validate()
  if (val) return
  const res = await emailLoginApi({
    username: form.username,
    password: form.password,
    captchaID: form.captchaID,
    captchaCode: form.captchaCode,
  })
  if (res.code) {
    Message.error(res.msg)
    refreshCaptcha()
    return
  }

  Message.success("登陆成功")
  await store.saveUserInfo(res.data)

  const redirect = store.loginRedirect || (typeof route.query.redirect === "string" ? route.query.redirect : "")
  store.closeLoginModal()
  if (redirect) {
    router.push(redirect)
  }
}

function switchMode(mode: "login" | "register") {
  authMode.value = mode
  formRef.value?.clearValidate?.()
  form.captchaCode = ""
  if (mode === "login") {
    form.rePassword = ""
  }
  refreshCaptcha()
}

async function submitRegister() {
  const val = await formRef.value.validate()
  if (val) return
  const res = await userRegisterApi(form)
  if (res.code) {
    Message.error(res.msg)
    refreshCaptcha()
    return
  }
  Message.success("注册成功，请登录")
  authMode.value = "login"
  form.rePassword = ""
  form.captchaCode = ""
  formRef.value?.clearValidate?.()
  refreshCaptcha()
}
</script>

<template>
  <transition name="login-fade">
    <div v-if="visible" class="login_overlay" @click.self="closeLogin">
      <section class="login_modal">
        <button class="close_btn" type="button" @click="closeLogin" aria-label="关闭登录弹窗">
          <icon-close/>
        </button>

        <div class="modal_form">
          <a-form ref="formRef" :model="form" :label-col-props="{span: 0}" :wrapper-col-props="{span:24}">
            <div class="brand_title">枫枫商城</div>
            <div class="title">{{ authMode === "login" ? "用户登陆" : "用户注册" }}</div>
            <a-form-item label="用户名" field="username" :rules="[{required:true,message:'请输入用户名'}]">
              <a-input placeholder="请输入用户名" v-model="form.username">
                <template #prefix>
                  <icon-user/>
                </template>
              </a-input>
            </a-form-item>
            <a-form-item label="密码" field="password" :rules="[{required:true,message:'请输入密码'}]">
              <a-input placeholder="请输入密码" type="password" v-model="form.password">
                <template #prefix>
                  <icon-lock/>
                </template>
              </a-input>
            </a-form-item>
            <a-form-item
                v-if="authMode === 'register'"
                label="确认密码"
                field="rePassword"
                :rules="confirmPasswordRules"
            >
              <a-input placeholder="请再次输入密码" type="password" v-model="form.rePassword">
                <template #prefix>
                  <icon-safe/>
                </template>
              </a-input>
            </a-form-item>
            <a-form-item class="code_row" field="captchaCode" :rules="[{required:true,message:'请输入验证码'}]">
              <a-input v-model="form.captchaCode" class="code_input" placeholder="验证码">
                <template #prefix>
                  <icon-safe/>
                </template>
              </a-input>
              <div class="code_img" @click="refreshCaptcha">
                <img v-if="captchaImage" :src="captchaImage" alt="验证码">
              </div>
            </a-form-item>
            <div class="mode_switch">
              <span>{{ authMode === "login" ? "没有账号？" : "已有账号？" }}</span>
              <button
                  class="switch_btn"
                  type="button"
                  @click="switchMode(authMode === 'login' ? 'register' : 'login')"
              >
                {{ authMode === "login" ? "去注册" : "去登录" }}
              </button>
            </div>
            <a-form-item class="action_row">
              <a-button type="primary" @click="authMode === 'login' ? emailLogin() : submitRegister()" long>
                {{ authMode === "login" ? "登陆" : "注册" }}
              </a-button>
            </a-form-item>
            <div class="tips">测试账号：admin / 1234</div>
          </a-form>
        </div>
      </section>
    </div>
  </transition>
</template>

<style lang="less">
.login_overlay {
  position: fixed;
  inset: 0;
  z-index: 3000;
  display: grid;
  place-items: center;
  padding: 24px;
  background: rgba(15, 23, 42, .22);
  backdrop-filter: blur(6px);
}

.login_modal {
  position: relative;
  width: min(440px, 100%);
  overflow: hidden;
  border-radius: 18px;
  background: var(--web-surface);
  border: 1px solid var(--web-border);
  box-shadow: 0 26px 80px rgba(15, 23, 42, .28);
}

.close_btn {
  position: absolute;
  right: 14px;
  top: 14px;
  z-index: 2;
  width: 34px;
  height: 34px;
  border: 0;
  border-radius: 999px;
  display: grid;
  place-items: center;
  color: #fff;
  background: rgba(15, 23, 42, .22);
  cursor: pointer;
}

.modal_form {
  padding: 34px 32px 28px;
  background: var(--web-surface);

  .arco-form {
    width: 100%;
    padding: 0;
    margin-top: 8px;
  }

  .brand_title {
    font-size: 22px;
    font-weight: 800;
    color: var(--web-brand);
    text-align: center;
    margin-bottom: 8px;
  }

  .title {
    font-size: 28px;
    font-weight: 800;
    color: var(--web-brand);
    text-align: center;
    margin-bottom: 20px;
  }

  .tips {
    margin-top: 6px;
    color: var(--color-text-3);
    font-size: 12px;
    text-align: center;
  }

  :deep(.arco-form-item) {
    margin-bottom: 14px;
  }

  :deep(.arco-input) {
    border-radius: 2px;
  }

  .code_row {
    margin-top: 2px;

    :deep(.arco-form-item-content) {
      display: flex;
      align-items: center;
      width: 100%;
    }
  }

  .code_input {
    flex: 1 1 auto;

    :deep(.arco-input-wrapper) {
      height: 36px;
    }
  }

  .code_img {
    height: 36px;
    width: 200px;
    margin-left: 10px;
    flex: 0 0 200px;
    border: 1px solid rgba(255, 93, 114, .42);
    background: var(--web-soft-grad);
    border-radius: 4px;
    cursor: pointer;
    display: grid;
    place-items: center;
    user-select: none;

    img {
      width: auto;
      max-width: 100%;
      height: 36px;
      display: block;
      object-fit: contain;
      border-radius: 4px;
      margin-left: auto;
    }
  }

  .mode_switch {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 6px;
    margin: 2px 0 10px;
    color: var(--color-text-3);
    font-size: 13px;
  }

  .switch_btn {
    padding: 0;
    border: 0;
    background: transparent;
    color: var(--web-brand);
    font-weight: 700;
    cursor: pointer;
  }

  .action_row {
    margin-top: 0;
  }
}

.login-fade-enter-active,
.login-fade-leave-active {
  transition: opacity .18s ease;
}

.login-fade-enter-from,
.login-fade-leave-to {
  opacity: 0;
}

@media (max-width: 768px) {
  .login_overlay {
    padding: 0;
    align-items: stretch;
  }

  .login_modal {
    width: 100%;
    min-height: 100vh;
    border-radius: 0;
  }

  .modal_form {
    padding: 28px 22px 24px;
  }
}
</style>
