<script setup lang="ts">
import {reactive, ref} from "vue";
import type {emailLoginRequest} from "@/api/user_api";
import {emailLoginApi} from "@/api/user_api";
import {Message} from "@arco-design/web-vue";
import {userStorei} from "@/stores/user_store";
import router from "@/router";
import {useRoute} from "vue-router";
import WebHome from "@/views/web/web_home.vue";

const route = useRoute()
const userStore = userStorei()
const form = reactive<emailLoginRequest>({
  username: "",
  password: ""
})

const formRef = ref()

async function emailLogin() {
  const val = await formRef.value.validate()
  if (val) return
  const res = await emailLoginApi(form)
  if (res.code) {
    Message.error(res.msg)
    return
  }
  Message.success("登陆成功")



  // 如何获取用户信息 1. 直接解析token   2. 调用户信息接口
  await userStore.saveUserInfo(res.data)

  const redirect = route.query.redirect
  if (redirect) {
    router.push(redirect as string)
    return
  }
  router.push({
    name: "admin"
  })



}

</script>

<template>
  <div class="login_view">
    <div class="login_bg" aria-hidden="true">
      <web-home/>
    </div>

    <div class="login_backdrop"></div>

    <section class="login_modal">
      <div class="modal_art">
        <div class="art_overlay"></div>
      </div>
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
            <div class="code_img">验证码</div>
          </a-form-item>
          <a-form-item class="action_row">
            <a-button type="primary" @click="emailLogin" long>登陆</a-button>
          </a-form-item>
          <div class="tips">测试账号：admin / 1234</div>
        </a-form>
      </div>
    </section>
  </div>
</template>

<style lang="less">
.login_view {
  background: #f3f4f6;
  position: relative;
  height: 100vh;
  overflow: hidden;

  .login_bg {
    position: absolute;
    inset: 0;
    transform: scale(1.02);
    filter: blur(2px) saturate(.8) brightness(.96);
    pointer-events: none;
    opacity: .95;
  }

  .login_backdrop {
    content: "";
    position: absolute;
    inset: 0;
    background: rgba(243, 244, 246, .56);
    backdrop-filter: blur(2px);
  }

  .login_modal {
    position: absolute;
    left: 50%;
    top: 50%;
    width: min(560px, calc(100vw - 32px));
    min-height: 320px;
    z-index: 1;
    display: grid;
    grid-template-columns: 210px minmax(0, 1fr);
    overflow: hidden;
    border-radius: 16px;
    box-shadow: 0 24px 70px rgba(15, 23, 42, .24);
    border: 1px solid rgba(255, 255, 255, .72);
    background: rgba(255, 255, 255, .96);
    transform: translate(-50%, -50%);
  }

  .modal_art {
    position: relative;
    background:
      linear-gradient(160deg, rgba(255, 74, 102, .38), rgba(15, 23, 42, .72)),
      url(@/assets/img/bg.png) center / cover no-repeat;
    min-height: 320px;
  }

  .art_overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(180deg, rgba(15, 23, 42, .1), rgba(15, 23, 42, .28));
  }

  .modal_form {
    padding: 34px 32px 28px;
    background: rgba(255, 255, 255, .98);

    .arco-form {
      width: 100%;
      padding: 0;
      margin-top: 10px;
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
      margin-bottom: 16px;
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
      grid-template-columns: minmax(0, 1fr) 82px;
      gap: 10px;
      align-items: center;
    }

    .code_input {
      width: 100%;
    }

    .code_img {
      height: 34px;
      display: grid;
      place-items: center;
      border: 1px solid rgba(255, 93, 114, .42);
      color: #5b5b8d;
      font-size: 13px;
      background:
        linear-gradient(135deg, rgba(255, 93, 114, .08), rgba(255, 255, 255, 1));
      border-radius: 4px;
      letter-spacing: .08em;
    }

    .action_row {
      margin-top: 8px;
    }
  }
}

@media (max-width: 768px) {
  .login_view {
    height: auto;
    min-height: 100vh;

    .login_modal {
      width: 100%;
      min-height: 100vh;
      grid-template-columns: 1fr;
      border-radius: 0;
      left: 0;
      top: 0;
      transform: none;
      border: 0;
    }

    .modal_art {
      display: none;
    }

    .modal_form {
      padding: 30px 22px 24px;
    }
  }
}
</style>
