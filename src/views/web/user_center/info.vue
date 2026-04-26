<script setup lang="ts">
import {computed, nextTick, reactive, ref, watch} from "vue";
import {useRouter} from "vue-router";
import {Message} from "@arco-design/web-vue";
import {
  IconEdit,
  IconGift,
  IconLocation,
  IconOrderedList,
  IconStar,
  IconUpload,
} from "@arco-design/web-vue/es/icon";
import {Cropper} from "vue-advanced-cropper";
import "vue-advanced-cropper/dist/style.css";
import {imageUploadApi} from "@/api/image_api";
import {userInfoUpdateApi} from "@/api/user_api";
import {userStorei} from "@/stores/user_store";

const router = useRouter()
const store = userStorei()

const quickLinks = [
  {title: "我的订单", desc: "查看订单记录与详情", name: "web_user_center_order", icon: "order"},
  {title: "我的收藏", desc: "管理收藏商品", name: "web_user_center_collect", icon: "star"},
  {title: "我的地址", desc: "维护收货地址", name: "web_user_center_addr", icon: "location"},
  {title: "我的优惠券", desc: "查看可用优惠券", name: "web_user_center_coupon", icon: "gift"},
]

const roleText = computed(() => store.isAdmin ? "管理员" : "普通用户")
const displayName = computed(() => store.userInfo.nickName || store.userInfo.userName || "未命名用户")
const nicknameInput = ref(store.userInfo.nickName || "")
const editingNickname = ref(false)
const savingNickname = ref(false)
const nicknameInputRef = ref()
const fileInputRef = ref<HTMLInputElement | null>(null)
const cropperRef = ref<InstanceType<typeof Cropper> | null>(null)
const cropperVisible = ref(false)
const cropperLoading = ref(false)
const cropperImageSrc = ref("")
const pendingAvatarFile = ref<File | null>(null)

watch(() => store.userInfo.nickName, (val) => {
  if (!editingNickname.value) {
    nicknameInput.value = val || ""
  }
})

function startEditNickname() {
  nicknameInput.value = store.userInfo.nickName || store.userInfo.userName || ""
  editingNickname.value = true
  nextTick(() => {
    nicknameInputRef.value?.focus?.()
  })
}

async function submitNickname() {
  if (!editingNickname.value || savingNickname.value) {
    return
  }
  const nextName = nicknameInput.value.trim()
  const prevName = store.userInfo.nickName || ""
  editingNickname.value = false

  if (!nextName) {
    nicknameInput.value = prevName
    Message.warning("昵称不能为空")
    return
  }
  if (nextName === prevName) {
    nicknameInput.value = nextName
    return
  }

  savingNickname.value = true
  try {
    const res = await userInfoUpdateApi({
      nickname: nextName,
      avatar: store.userInfo.avatar,
    })
    if (res.code) {
      Message.error(res.msg)
      nicknameInput.value = prevName
      return
    }
    store.syncUserProfile({nickName: nextName})
    nicknameInput.value = nextName
    Message.success("昵称更新成功")
  } finally {
    savingNickname.value = false
  }
}

function handleNicknameKeydown(event: KeyboardEvent) {
  if (event.key === "Enter") {
    submitNickname()
    return
  }
  if (event.key === "Escape") {
    editingNickname.value = false
    nicknameInput.value = store.userInfo.nickName || store.userInfo.userName || ""
  }
}

function openAvatarPicker() {
  fileInputRef.value?.click()
}

function onAvatarFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) {
    return
  }
  if (!file.type.startsWith("image/")) {
    Message.error("请选择图片文件")
    input.value = ""
    return
  }
  const reader = new FileReader()
  reader.onload = () => {
    cropperImageSrc.value = typeof reader.result === "string" ? reader.result : ""
    pendingAvatarFile.value = file
    cropperVisible.value = true
    input.value = ""
  }
  reader.onerror = () => {
    Message.error("读取图片失败")
    input.value = ""
  }
  reader.readAsDataURL(file)
}

async function confirmAvatarCrop() {
  const result = cropperRef.value?.getResult()
  const canvas = result?.canvas
  if (!canvas || !pendingAvatarFile.value) {
    Message.error("请先调整裁剪区域")
    return
  }
  cropperLoading.value = true
  try {
    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, pendingAvatarFile.value?.type || "image/jpeg", 0.92)
    })
    if (!blob) {
      Message.error("裁剪图片失败")
      return
    }
    const file = new File([blob], pendingAvatarFile.value.name, {
      type: blob.type || pendingAvatarFile.value.type || "image/jpeg",
    })
    const uploadRes = await imageUploadApi(file)
    if (uploadRes.code) {
      Message.error(uploadRes.msg)
      return
    }
    const updateRes = await userInfoUpdateApi({
      nickname: store.userInfo.nickName || store.userInfo.userName,
      avatar: uploadRes.data,
    })
    if (updateRes.code) {
      Message.error(updateRes.msg)
      return
    }
    store.syncUserProfile({avatar: uploadRes.data})
    Message.success("头像更新成功")
    closeAvatarCropper()
  } finally {
    cropperLoading.value = false
  }
}

function closeAvatarCropper() {
  cropperVisible.value = false
  cropperImageSrc.value = ""
  pendingAvatarFile.value = null
  cropperLoading.value = false
}
</script>

<template>
  <div class="info_view">
    <div class="panel_head">
      <div class="eyebrow">PROFILE</div>
      <h2>个人中心</h2>
    </div>

    <div class="profile_card">
      <div class="avatar_editor">
        <a-avatar :size="88" :image-url="store.userInfo.avatar || '/logo.png'"/>
        <button class="avatar_edit_btn" type="button" @click="openAvatarPicker">
          <IconUpload/>
          <span>上传头像</span>
        </button>
        <input
          ref="fileInputRef"
          class="hidden_file_input"
          type="file"
          accept="image/*"
          @change="onAvatarFileChange"
        >
      </div>

      <div class="profile_body">
        <div class="name_row">
          <a-input
            v-if="editingNickname"
            ref="nicknameInputRef"
            v-model="nicknameInput"
            class="nickname_input"
            :max-length="16"
            @blur="submitNickname"
            @keydown="handleNicknameKeydown"
          />
          <strong v-else>{{ displayName }}</strong>
          <button class="name_edit_btn" type="button" @click="startEditNickname">
            <IconEdit/>
          </button>
        </div>
        <span>用户名：{{ store.userInfo.userName || "-" }}</span>
        <span>角色：{{ roleText }}</span>
        <span>用户ID：{{ store.userInfo.userID || "-" }}</span>
      </div>
    </div>

    <div class="profile_actions">
      <a-popconfirm content="确定退出当前登录状态吗？" @ok="store.userLogout()">
        <a-button status="danger">退出登录</a-button>
      </a-popconfirm>
    </div>

    <div class="quick_grid">
      <button v-for="item in quickLinks" :key="item.name" class="quick_card" @click="router.push({name: item.name})">
        <span class="card_icon">
          <IconOrderedList v-if="item.icon === 'order'"/>
          <IconStar v-else-if="item.icon === 'star'"/>
          <IconLocation v-else-if="item.icon === 'location'"/>
          <IconGift v-else/>
        </span>
        <div class="quick_text">
          <strong class="quick_name">{{ item.title }}</strong>
          <span class="quick_desc">{{ item.desc }}</span>
        </div>
      </button>
    </div>

    <a-modal
      v-model:visible="cropperVisible"
      title="裁剪头像"
      width="720px"
      :ok-loading="cropperLoading"
      @ok="confirmAvatarCrop"
      @cancel="closeAvatarCropper"
    >
      <div class="cropper_modal">
        <div class="cropper_tip">请按 1:1 裁剪头像，前台个人中心和导航头像都会按正方形展示。</div>
        <Cropper
          v-if="cropperImageSrc"
          ref="cropperRef"
          class="avatar_cropper"
          :src="cropperImageSrc"
          :stencil-props="{aspectRatio: 1}"
          image-restriction="stencil"
        />
      </div>
    </a-modal>
  </div>
</template>

<style scoped lang="less">
.info_view {
  display: grid;
  gap: 18px;
}

.eyebrow {
  color: #ff647c;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: .12em;
}

.panel_head h2 {
  margin: 10px 0 8px;
  color: var(--web-text);
  font-size: 32px;
  line-height: 1.1;
}

.panel_head p,
.profile_body span,
.quick_card span:last-child {
  color: var(--web-text-soft);
}

.panel_head p {
  margin: 0;
  font-size: 14px;
  line-height: 1.8;
}

.profile_card {
  display: flex;
  gap: 18px;
  align-items: center;
  padding: 22px;
  border-radius: 16px;
  background: var(--web-soft-grad);
  border: 1px solid var(--web-border);
}

.avatar_editor {
  position: relative;
  display: grid;
  justify-items: center;
  gap: 10px;
}

.avatar_edit_btn {
  appearance: none;
  border: 1px solid var(--web-border);
  background: var(--web-surface);
  color: var(--web-text);
  border-radius: 999px;
  padding: 7px 12px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  font-size: 12px;
}

.hidden_file_input {
  display: none;
}

.profile_body {
  display: grid;
  gap: 6px;
}

.name_row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.profile_body strong {
  color: var(--web-text);
  font-size: 24px;
}

.nickname_input {
  width: 220px;
}

.name_edit_btn {
  width: 28px;
  height: 28px;
  border-radius: 999px;
  border: 1px solid var(--web-border);
  background: var(--web-surface);
  color: var(--web-text-soft);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.profile_body span {
  font-size: 13px;
}

.quick_grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.profile_actions {
  display: flex;
  justify-content: flex-start;
}

.quick_card {
  text-align: left;
  appearance: none;
  padding: 18px;
  border-radius: 14px;
  border: 1px solid var(--web-border);
  background: var(--web-soft-bg);
  cursor: pointer;
  transition: .18s ease;
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr);
  column-gap: 14px;
  align-items: center;
  min-height: 108px;
  line-height: 1;

  &:hover {
    border-color: #ffccd5;
    background: var(--web-brand-soft);
    transform: translateY(-1px);
  }
}

.card_icon {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  align-self: center;
  flex-shrink: 0;
  background: var(--web-soft-grad);
  border: 1px solid var(--web-border);
  color: #ff637a;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, .9);

  :deep(svg) {
    width: 20px;
    height: 20px;
    display: block;
  }
}

.quick_text {
  min-width: 0;
  min-height: 44px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 8px;
}

.quick_name,
.quick_desc {
  display: block;
}

.quick_name {
  color: var(--web-text);
  font-size: 16px;
}

.quick_desc {
  color: var(--web-text-soft);
  font-size: 12px;
  line-height: 1.7;
}

.cropper_modal {
  display: grid;
  gap: 14px;
}

.cropper_tip {
  color: var(--web-text-soft);
  font-size: 13px;
}

.avatar_cropper {
  height: 420px;
  border-radius: 14px;
  overflow: hidden;
  background: var(--web-soft-bg);
}

@media (max-width: 768px) {
  .profile_card {
    flex-direction: column;
    align-items: flex-start;
  }

  .quick_grid {
    grid-template-columns: 1fr;
  }

  .nickname_input {
    width: min(220px, 100%);
  }
}
</style>
