<script setup lang="ts">
import {computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch} from "vue";
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
const introCanvasRef = ref<HTMLCanvasElement | null>(null)
const captchaText = ref("")

let introRaf = 0
let introResizeHandler: (() => void) | null = null
let introParticles: Array<{
  x: number
  y: number
  vx: number
  vy: number
  r: number
  alpha: number
}> = []

watch(visible, val => {
  if (!val) return
  form.username = ""
  form.password = ""
  refreshCaptcha()
  queueIntroDraw()
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

function initIntroParticles(width: number, height: number) {
  introParticles = Array.from({length: 42}, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    vx: (Math.random() - 0.5) * 0.6,
    vy: (Math.random() - 0.5) * 0.6,
    r: 1.2 + Math.random() * 2.6,
    alpha: 0.22 + Math.random() * 0.5,
  }))
}

function drawIntroFrame() {
  const canvas = introCanvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext("2d")
  if (!ctx) return
  const width = canvas.clientWidth || 300
  const height = canvas.clientHeight || 420

  canvas.width = Math.floor(width * window.devicePixelRatio)
  canvas.height = Math.floor(height * window.devicePixelRatio)
  ctx.scale(window.devicePixelRatio, window.devicePixelRatio)

  ctx.clearRect(0, 0, width, height)

  const gradient = ctx.createLinearGradient(0, 0, width, height)
  gradient.addColorStop(0, "#20123d")
  gradient.addColorStop(.45, "#5a285f")
  gradient.addColorStop(1, "#0d1127")
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, width, height)

  const glow = ctx.createRadialGradient(width * .5, height * .34, 10, width * .5, height * .34, width * .85)
  glow.addColorStop(0, "rgba(255, 135, 170, .55)")
  glow.addColorStop(.45, "rgba(116, 106, 255, .22)")
  glow.addColorStop(1, "rgba(0, 0, 0, 0)")
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, width, height)

  ctx.save()
  ctx.strokeStyle = "rgba(255, 255, 255, .08)"
  ctx.lineWidth = 1
  for (let i = 0; i < 6; i += 1) {
    const y = height * 0.18 + i * 34
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(width, y + Math.sin(Date.now() / 1200 + i) * 3)
    ctx.stroke()
  }
  ctx.restore()

  ctx.save()
  ctx.fillStyle = "rgba(255, 255, 255, .92)"
  introParticles.forEach(p => {
    p.x += p.vx
    p.y += p.vy
    if (p.x < -20) p.x = width + 20
    if (p.x > width + 20) p.x = -20
    if (p.y < -20) p.y = height + 20
    if (p.y > height + 20) p.y = -20
    ctx.globalAlpha = p.alpha
    ctx.beginPath()
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
    ctx.fill()
  })
  ctx.restore()

  ctx.save()
  ctx.strokeStyle = "rgba(255, 255, 255, .12)"
  ctx.lineWidth = 1
  for (let i = 0; i < introParticles.length; i += 1) {
    for (let j = i + 1; j < introParticles.length; j += 1) {
      const a = introParticles[i]
      const b = introParticles[j]
      const dx = a.x - b.x
      const dy = a.y - b.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist < 80) {
        ctx.globalAlpha = (1 - dist / 80) * 0.32
        ctx.beginPath()
        ctx.moveTo(a.x, a.y)
        ctx.lineTo(b.x, b.y)
        ctx.stroke()
      }
    }
  }
  ctx.restore()

  ctx.save()
  ctx.fillStyle = "rgba(255, 255, 255, .96)"
  ctx.font = "700 16px Arial"
  ctx.fillText("枫枫商城", 24, 34)
  ctx.font = "700 28px Arial"
  const lines = ["前台商城与用户中心", "联调项目"]
  ctx.fillText(lines[0], 24, 82)
  ctx.fillText(lines[1], 24, 118)
  ctx.font = "14px Arial"
  ctx.fillStyle = "rgba(255, 255, 255, .88)"
  ctx.fillText("商品浏览 · 搜索 · 秒杀 · 购物车 · 订单", 24, height - 76)
  ctx.fillText("用户中心 · 收藏 · 足迹 · 地址 · 优惠券", 24, height - 48)
  ctx.restore()

  introRaf = window.requestAnimationFrame(drawIntroFrame)
}

function queueIntroDraw() {
  cancelIntroAnimation()
  nextTick(() => {
    const canvas = introCanvasRef.value
    if (!canvas) return
    const parent = canvas.parentElement
    const width = parent?.clientWidth || 320
    const height = parent?.clientHeight || 420
    initIntroParticles(width, height)
    drawIntroFrame()
  })
}

function cancelIntroAnimation() {
  if (introRaf) {
    window.cancelAnimationFrame(introRaf)
    introRaf = 0
  }
  if (introResizeHandler) {
    window.removeEventListener("resize", introResizeHandler)
    introResizeHandler = null
  }
}

onMounted(() => {
  refreshCaptcha()
  introResizeHandler = () => {
    queueIntroDraw()
  }
  window.addEventListener("resize", introResizeHandler)
  if (visible.value) {
    queueIntroDraw()
  }
})

onBeforeUnmount(() => {
  cancelIntroAnimation()
})

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
          <canvas ref="introCanvasRef" class="intro_canvas"></canvas>
          <div class="intro_overlay"></div>
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
  overflow: hidden;
}

.intro_canvas,
.intro_overlay {
  position: absolute;
  inset: 0;
}

.intro_canvas {
  width: 100%;
  height: 100%;
  display: block;
}

.intro_overlay {
  background:
    linear-gradient(180deg, rgba(15, 23, 42, .06), rgba(15, 23, 42, .22));
  pointer-events: none;
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
    grid-template-columns: 1fr;
    border-radius: 0;
  }

  .modal_intro {
    min-height: 240px;
  }

  .modal_form {
    padding: 28px 22px 24px;
  }
}
</style>
