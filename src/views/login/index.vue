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
    <div class="login_panel">
      <section class="brand_panel">
        <div class="brand_mark">枫</div>
        <div class="brand_copy">
          <div class="eyebrow">FENGFENG MALL</div>
          <h1>枫枫商城</h1>
          <p>登录后可查看订单、收藏、足迹、优惠券和消息，也可以直接进入前台浏览商品。</p>
        </div>

        <div class="feature_list">
          <article class="feature_item">
            <strong>商品浏览</strong>
            <span>搜索、详情、秒杀、购物车一体化</span>
          </article>
          <article class="feature_item">
            <strong>订单中心</strong>
            <span>确认订单、支付、收货、评价流程完整</span>
          </article>
          <article class="feature_item">
            <strong>个人后台</strong>
            <span>地址、优惠券、消息、收藏、足迹统一管理</span>
          </article>
        </div>
      </section>

      <section class="login_mask">
        <a-form ref="formRef" :model="form" :label-col-props="{span: 0}" :wrapper-col-props="{span:24}">
          <div class="title">用户登录</div>
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
    background: linear-gradient(135deg, rgba(15, 23, 42, .36), rgba(15, 23, 42, .08));
  }

  .login_panel {
    position: relative;
    z-index: 1;
    width: min(1120px, calc(100% - 32px));
    height: min(720px, calc(100vh - 32px));
    margin: 16px auto;
    display: grid;
    grid-template-columns: minmax(0, 1.2fr) 420px;
    overflow: hidden;
    border-radius: 28px;
    background: rgba(255, 255, 255, .88);
    backdrop-filter: blur(14px);
    box-shadow: 0 30px 80px rgba(15, 23, 42, .24);
    border: 1px solid rgba(255, 255, 255, .55);
  }

  .login_mask {
    display: flex;
    justify-content: center;
    align-items: center;
    background: rgba(255, 255, 255, .92);

    .arco-form {
      width: min(320px, calc(100% - 40px));
      padding: 0;
    }

    .title {
      font-size: 30px;
      font-weight: 800;
      color: var(--color-text-1);
      margin-bottom: 6px;
    }

    .sub_title {
      margin: 0 0 18px;
      color: var(--color-text-3);
      line-height: 1.7;
    }

    .tips {
      margin-top: 10px;
      color: var(--color-text-3);
      font-size: 13px;
      text-align: center;
    }
  }

  .brand_panel {
    padding: 54px;
    display: grid;
    align-content: center;
    gap: 26px;
    color: #fff;
    background:
      linear-gradient(160deg, rgba(29, 78, 216, .92), rgba(96, 165, 250, .72)),
      url(@/assets/img/bg.png) center / cover no-repeat;
    position: relative;

    &::after {
      content: "";
      position: absolute;
      inset: 0;
      background: linear-gradient(135deg, rgba(15, 23, 42, .16), rgba(15, 23, 42, 0));
    }
  }

  .brand_mark {
    position: relative;
    z-index: 1;
    width: 72px;
    height: 72px;
    border-radius: 22px;
    display: grid;
    place-items: center;
    font-size: 32px;
    font-weight: 800;
    background: rgba(255, 255, 255, .18);
    border: 1px solid rgba(255, 255, 255, .2);
    box-shadow: 0 16px 40px rgba(15, 23, 42, .18);
  }

  .brand_copy,
  .feature_list {
    position: relative;
    z-index: 1;
  }

  .eyebrow {
    color: rgba(255, 255, 255, .8);
    font-size: 13px;
    font-weight: 700;
    letter-spacing: .14em;
  }

  .brand_copy h1 {
    margin: 14px 0 12px;
    font-size: 48px;
    line-height: 1.05;
  }

  .brand_copy p {
    margin: 0;
    max-width: 420px;
    color: rgba(255, 255, 255, .86);
    line-height: 1.85;
  }

  .feature_list {
    display: grid;
    gap: 12px;
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .feature_item {
    padding: 16px 18px;
    border-radius: 18px;
    background: rgba(255, 255, 255, .12);
    border: 1px solid rgba(255, 255, 255, .14);
    backdrop-filter: blur(10px);

    strong,
    span {
      display: block;
    }

    strong {
      font-size: 16px;
      margin-bottom: 6px;
    }

    span {
      color: rgba(255, 255, 255, .78);
      line-height: 1.6;
      font-size: 13px;
    }
  }
}

@media (max-width: 1100px) {
  .login_view {
    .login_panel {
      grid-template-columns: 1fr;
      height: auto;
      min-height: calc(100vh - 32px);
    }

    .brand_panel {
      padding: 32px;
    }

    .feature_list {
      grid-template-columns: 1fr;
    }
  }
}

@media (max-width: 768px) {
  .login_view {
    height: auto;
    min-height: 100vh;

    .login_panel {
      width: calc(100% - 24px);
      margin: 12px auto;
      border-radius: 24px;
    }

    .brand_panel {
      padding: 24px;
    }

    .brand_copy h1 {
      font-size: 38px;
    }

    .login_mask {
      padding: 28px 0 32px;
    }
  }
}
</style>
