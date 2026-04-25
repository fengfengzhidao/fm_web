<script setup lang="ts">
import {computed, reactive, ref, watch} from "vue";
import type {emailLoginRequest} from "@/api/user_api";
import {emailLoginApi} from "@/api/user_api";
import {Message} from "@arco-design/web-vue";
import {userStorei} from "@/stores/user_store";
import router from "@/router";
import {useRoute} from "vue-router";

const store = userStorei()
const route = useRoute()
const form = reactive<emailLoginRequest>({
  username: "",
  password: ""
})

const formRef = ref()
const visible = computed(() => store.loginModalVisible)
const captchaText = ref("")

watch(visible, val => {
  if (!val) return
  form.username = ""
  form.password = ""
  refreshCaptcha()
})

function closeLogin() {
  store.closeLoginModal()
}

function randomCaptchaText(length = 4) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  let result = ""
  for (let i = 0; i < length; i += 1) {
    result += chars[Math.floor(Math.random() * chars.length)]
  }
  return result
}

function refreshCaptcha() {
  captchaText.value = randomCaptchaText()
}

async function emailLogin() {
  const val = await formRef.value.validate()
  if (val) return
  const res = await emailLoginApi(form)
  if (res.code) {
    Message.error(res.msg)
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
            <div class="title">用户登陆</div>
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
            <a-form-item class="code_row">
              <a-input class="code_input" placeholder="验证码"/>
              <div class="code_img" @click="refreshCaptcha">
                <span>{{ captchaText }}</span>
              </div>
            </a-form-item>
            <a-form-item class="action_row">
              <a-button type="primary" @click="emailLogin" long>登陆</a-button>
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
  background: #fff;
  border: 1px solid rgba(255, 255, 255, .7);
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
  background: rgba(255, 255, 255, .98);

  .arco-form {
    width: 100%;
    padding: 0;
    margin-top: 8px;
  }

  .brand_title {
    font-size: 22px;
    font-weight: 800;
    color: #ff5d72;
    text-align: center;
    margin-bottom: 8px;
  }

  .title {
    font-size: 28px;
    font-weight: 800;
    color: #ff5d72;
    text-align: center;
    margin-bottom: 20px;
  }

  .tips {
    margin-top: 6px;
    color: var(--color-text-3);
    font-size: 12px;
    text-align: left;
  }

  :deep(.arco-form-item) {
    margin-bottom: 14px;
  }

  :deep(.arco-input) {
    border-radius: 2px;
  }

  .code_row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 96px;
    column-gap: 12px;
    align-items: center;
    margin-top: 2px;
  }

  .code_input {
    width: 100%;
  }

  .code_img {
    height: 36px;
    width: 100%;
    border: 1px solid rgba(255, 93, 114, .42);
    background:
      linear-gradient(135deg, rgba(255, 93, 114, .08), rgba(255, 255, 255, 1));
    border-radius: 4px;
    cursor: pointer;
    display: grid;
    place-items: center;
    color: #5b5b8d;
    font-weight: 700;
    letter-spacing: .16em;
    user-select: none;
  }

  .action_row {
    margin-top: 8px;
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
