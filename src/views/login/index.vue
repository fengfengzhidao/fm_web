<script setup lang="ts">
import {reactive, ref} from "vue";
import type {emailLoginRequest} from "@/api/user_api";
import {emailLoginApi} from "@/api/user_api";
import {Message} from "@arco-design/web-vue";
import {userStorei} from "@/stores/user_store";
import router from "@/router";
import {useRoute} from "vue-router";

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
    <section class="login_mask">
      <a-form ref="formRef" :model="form" :label-col-props="{span: 0}" :wrapper-col-props="{span:24}">
        <div class="title">用户登陆</div>
        <p class="sub_title">请输入账号密码进入系统</p>
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
        <a-form-item>
          <a-button type="primary" @click="emailLogin" long>登陆</a-button>
        </a-form-item>
        <div class="tips">测试账号：admin / 1234</div>
      </a-form>
    </section>
  </div>
</template>

<style lang="less">
.login_view {
  background:
    radial-gradient(circle at top left, rgba(59, 130, 246, .18), transparent 30%),
    radial-gradient(circle at bottom right, rgba(255, 93, 114, .12), transparent 26%),
    url(@/assets/img/bg.png) 50% / cover no-repeat;
  position: relative;
  height: 100vh;
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(15, 23, 42, .26), rgba(15, 23, 42, .05));
  }

  .login_mask {
    position: absolute;
    right: 0;
    top: 0;
    width: min(420px, 100vw);
    height: 100vh;
    z-index: 1;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 32px 34px;
    background: linear-gradient(180deg, rgba(255, 255, 255, .38), rgba(255, 255, 255, .48));
    backdrop-filter: blur(12px);
    border-left: 1px solid rgba(255, 255, 255, .52);

    .arco-form {
      width: 100%;
      max-width: 320px;
      padding: 0;
    }

    .title {
      font-size: 28px;
      font-weight: 800;
      color: #1d4ed8;
      margin-bottom: 6px;
    }

    .sub_title {
      margin: 0 0 18px;
      color: rgba(75, 85, 99, .92);
      line-height: 1.7;
    }

    .tips {
      margin-top: 10px;
      color: var(--color-text-3);
      font-size: 13px;
      text-align: center;
    }
  }
}

@media (max-width: 768px) {
  .login_view {
    height: auto;
    min-height: 100vh;

    .login_mask {
      width: 100%;
      height: auto;
      min-height: 100vh;
      padding: 28px 20px 32px;
      border-left: 0;
      border-radius: 0;
      align-items: flex-start;
    }
  }
}
</style>
