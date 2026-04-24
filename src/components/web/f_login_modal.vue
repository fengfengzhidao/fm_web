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

watch(visible, val => {
  if (!val) return
  form.username = ""
  form.password = ""
})

function closeLogin() {
  store.closeLoginModal()
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

        <div class="modal_intro">
          <div class="intro_overlay"></div>
          <div class="intro_content">
            <div class="intro_brand">枫枫商城</div>
            <h3>前台商城与用户中心联调项目</h3>
            <p>
              这是一个围绕商品浏览、搜索、秒杀、购物车、订单和用户中心搭建的商城前台，
              直接连真实接口，不做空页面。
            </p>

            <ul class="intro_list">
              <li>前台：首页、搜索、商品详情、秒杀、购物车、确认订单</li>
              <li>用户中心：订单、收藏、足迹、地址、优惠券、消息</li>
              <li>登录后可继续原页面流程，不会被打断到其他路由</li>
            </ul>
          </div>
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
  width: min(720px, 100%);
  min-height: 420px;
  overflow: hidden;
  display: grid;
  grid-template-columns: 1fr 1.1fr;
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

.modal_intro {
  position: relative;
  background:
    linear-gradient(160deg, rgba(255, 93, 114, .24), rgba(15, 23, 42, .74)),
    url(@/assets/img/bg.png) center / cover no-repeat;
  color: #fff;
  overflow: hidden;
}

.intro_overlay {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(180deg, rgba(15, 23, 42, .08), rgba(15, 23, 42, .34));
}

.intro_content {
  position: relative;
  z-index: 1;
  padding: 42px 34px 34px;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  height: 100%;
}

.intro_brand {
  display: inline-flex;
  width: fit-content;
  padding: 7px 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, .18);
  font-size: 12px;
  letter-spacing: .08em;
}

.intro_content h3 {
  margin: 18px 0 12px;
  font-size: 27px;
  line-height: 1.35;
}

.intro_content p {
  margin: 0;
  line-height: 1.8;
  color: rgba(255, 255, 255, .92);
}

.intro_list {
  margin: 20px 0 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 10px;

  li {
    padding-left: 18px;
    position: relative;
    line-height: 1.6;
    color: rgba(255, 255, 255, .94);
  }

  li::before {
    content: "";
    position: absolute;
    left: 0;
    top: .65em;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #fff;
    opacity: .92;
  }
}

.modal_form {
  padding: 34px 30px 28px;
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
    grid-template-columns: 1fr;
    border-radius: 0;
  }

  .modal_intro {
    min-height: 240px;
  }

  .intro_content {
    padding: 30px 22px;
  }

  .intro_content h3 {
    font-size: 22px;
  }

  .modal_form {
    padding: 28px 22px 24px;
  }
}
</style>
