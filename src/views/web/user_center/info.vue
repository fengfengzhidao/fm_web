<script setup lang="ts">
import {computed, ref} from "vue";
import {useRouter} from "vue-router";
import {Message} from "@arco-design/web-vue";
import type {RequestOption, UploadRequest} from "@arco-design/web-vue";
import {
  IconEdit,
  IconGift,
  IconLocation,
  IconOrderedList,
  IconPlus,
  IconStar
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
const nicknameModalVisible = ref(false)
const nicknameValue = ref("")
const nicknameSubmitting = ref(false)
const avatarUploading = ref(false)
const cropperRef = ref<InstanceType<typeof Cropper> | null>(null)
const cropperVisible = ref(false)
const cropperLoading = ref(false)
const cropperImageSrc = ref("")

let pendingAvatarUpload:
  | {
      file: File
      option: RequestOption
      aborted: boolean
    }
  | null = null

function openNicknameModal() {
  nicknameValue.value = store.userInfo.nickName || ""
  nicknameModalVisible.value = true
}

async function saveProfile(payload: {nickname: string; avatar: string}, successMessage: string) {
  const res = await userInfoUpdateApi(payload)
  if (res.code) {
    Message.error(res.msg)
    return false
  }
  await store.saveUserInfo(store.userInfo.token)
  Message.success(successMessage)
  return true
}

async function submitNickname() {
  const nextNickname = nicknameValue.value.trim()
  if (!nextNickname) {
    Message.warning("请输入昵称")
    return false
  }
  nicknameSubmitting.value = true
  try {
    const ok = await saveProfile({
      nickname: nextNickname,
      avatar: store.userInfo.avatar || "",
    }, "昵称修改成功")
    if (ok) {
      nicknameModalVisible.value = false
    }
    return ok
  } finally {
    nicknameSubmitting.value = false
  }
}

function openAvatarCropper(file: File, option: RequestOption) {
  const isImage = /^image\/(png|jpeg|webp)$/.test(file.type)
  if (!isImage) {
    const msg = "仅支持 png、jpg、webp 图片"
    Message.warning(msg)
    option.onError(msg)
    return
  }
  const reader = new FileReader()
  reader.onload = () => {
    cropperImageSrc.value = typeof reader.result === "string" ? reader.result : ""
    pendingAvatarUpload = {
      file,
      option,
      aborted: false,
    }
    cropperVisible.value = true
  }
  reader.onerror = () => {
    const msg = "读取图片失败"
    Message.error(msg)
    option.onError(msg)
  }
  reader.readAsDataURL(file)
}

function createAvatarUploadRequest() {
  return (option: RequestOption): UploadRequest => {
    const file = option.fileItem.file
    if (!file) {
      const msg = "请选择头像图片"
      Message.warning(msg)
      option.onError(msg)
      return {}
    }

    openAvatarCropper(file, option)

    return {
      abort() {
        if (pendingAvatarUpload?.file === file) {
          pendingAvatarUpload.aborted = true
        }
      },
    }
  }
}

async function confirmAvatarCrop() {
  if (!pendingAvatarUpload || pendingAvatarUpload.aborted) {
    cropperVisible.value = false
    return true
  }

  const result = cropperRef.value?.getResult()
  const canvas = result?.canvas
  if (!canvas) {
    Message.warning("请先调整裁剪区域")
    return false
  }

  cropperLoading.value = true
  avatarUploading.value = true
  try {
    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, pendingAvatarUpload?.file.type || "image/jpeg", 0.92)
    })

    if (!blob) {
      Message.error("头像裁剪失败")
      return false
    }

    const currentUpload = pendingAvatarUpload
    const croppedFile = new File([blob], currentUpload.file.name, {
      type: blob.type || currentUpload.file.type || "image/jpeg",
    })

    const uploadRes = await imageUploadApi(croppedFile)
    if (uploadRes.code) {
      Message.error(uploadRes.msg)
      currentUpload.option.onError(uploadRes.msg)
      return false
    }

    const ok = await saveProfile({
      nickname: store.userInfo.nickName || store.userInfo.userName,
      avatar: uploadRes.data,
    }, "头像修改成功")
    if (!ok) {
      currentUpload.option.onError("头像保存失败")
      return false
    }

    currentUpload.option.onSuccess(uploadRes)
    cropperVisible.value = false
    cropperImageSrc.value = ""
    pendingAvatarUpload = null
    return true
  } catch (error) {
    console.error(error)
    Message.error("头像上传失败")
    pendingAvatarUpload?.option.onError(error)
    return false
  } finally {
    cropperLoading.value = false
    avatarUploading.value = false
  }
}

function cancelAvatarCrop() {
  cropperVisible.value = false
  cropperLoading.value = false
  cropperImageSrc.value = ""
  pendingAvatarUpload = null
}
</script>

<template>
  <div class="info_view">
    <div class="panel_head">
      <div class="eyebrow">PROFILE</div>
      <h2>个人中心</h2>
    </div>

    <div class="profile_card">
      <a-upload
        class="avatar_upload"
        accept="image/png,image/jpeg,image/webp"
        :show-file-list="false"
        :custom-request="createAvatarUploadRequest()"
      >
        <template #upload-button>
          <button class="avatar_trigger" type="button" :disabled="avatarUploading">
            <a-avatar :size="88" :image-url="store.userInfo.avatar || '/logo.png'"/>
            <span class="avatar_edit_mask">
              <IconPlus/>
              点击换头像
            </span>
          </button>
        </template>
      </a-upload>
      <div class="profile_body">
        <div class="nickname_row">
          <strong>{{ store.userInfo.nickName || store.userInfo.userName || "未命名用户" }}</strong>
          <a-button class="nickname_edit_btn" type="text" size="mini" @click="openNicknameModal">
            <template #icon>
              <IconEdit/>
            </template>
            修改
          </a-button>
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
      v-model:visible="nicknameModalVisible"
      title="修改昵称"
      :confirm-loading="nicknameSubmitting"
      :on-before-ok="submitNickname"
    >
      <a-input
        v-model="nicknameValue"
        :max-length="20"
        allow-clear
        placeholder="请输入新的昵称"
      />
    </a-modal>

    <a-modal
      v-model:visible="cropperVisible"
      title="裁剪头像"
      :width="760"
      :mask-closable="false"
      :confirm-loading="cropperLoading"
      :on-before-ok="confirmAvatarCrop"
      @cancel="cancelAvatarCrop"
    >
      <div class="cropper_modal">
        <div class="cropper_tip">请按 1:1 裁剪头像，保存后会同步更新个人中心、评论和导航里的头像展示。</div>
        <Cropper
          v-if="cropperImageSrc"
          ref="cropperRef"
          class="avatar_cropper"
          :src="cropperImageSrc"
          image-restriction="stencil"
          :stencil-props="{aspectRatio: 1}"
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

.avatar_upload {
  flex-shrink: 0;
}

.avatar_trigger {
  position: relative;
  width: 88px;
  height: 88px;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
  border-radius: 50%;
  overflow: hidden;
}

.avatar_trigger:disabled {
  cursor: not-allowed;
}

.avatar_edit_mask {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  color: #fff;
  font-size: 12px;
  background: rgba(255, 99, 122, .72);
  opacity: 0;
  transition: .2s ease;
}

.avatar_trigger:hover .avatar_edit_mask,
.avatar_trigger:focus-visible .avatar_edit_mask {
  opacity: 1;
}

.profile_body {
  display: grid;
  gap: 6px;
}

.nickname_row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.profile_body strong {
  color: var(--web-text);
  font-size: 24px;
}

.nickname_edit_btn {
  padding: 0 10px;
  border-radius: 999px;
  color: #ff5f77;
  background: rgba(255, 95, 119, .1);
  border: 1px solid rgba(255, 95, 119, .2);
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
  gap: 12px;
}

.cropper_tip {
  color: var(--web-text-soft);
  font-size: 13px;
  line-height: 1.7;
}

.avatar_cropper {
  height: 420px;
  background: #0f172a;
  border-radius: 12px;
  overflow: hidden;
}

@media (max-width: 768px) {
  .profile_card {
    flex-direction: column;
    align-items: flex-start;
  }

  .quick_grid {
    grid-template-columns: 1fr;
  }

  .avatar_cropper {
    height: 300px;
  }
}
</style>
