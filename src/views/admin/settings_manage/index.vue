<script setup lang="ts">
import {reactive} from "vue";
import {beian, enSlogan, ico, slogan, title} from "@/conf/global";
import {Message} from "@arco-design/web-vue";

const storageKey = "fm_site_config_preview"

const form = reactive({
  title,
  slogan,
  enSlogan,
  ico,
  beian,
  serverUrl: import.meta.env.VITE_SERVER_URL || "http://127.0.0.1:8080",
  loginCaptcha: true,
  allowRegister: true,
  showFooter: true,
})

function loadLocalConfig() {
  const local = localStorage.getItem(storageKey)
  if (!local) {
    return
  }
  try {
    Object.assign(form, JSON.parse(local))
  } catch (e) {
    console.log(e)
  }
}

function saveConfig() {
  localStorage.setItem(storageKey, JSON.stringify(form))
  Message.success("站点配置已保存到本地预览")
}

function resetConfig() {
  localStorage.removeItem(storageKey)
  Object.assign(form, {
    title,
    slogan,
    enSlogan,
    ico,
    beian,
    serverUrl: import.meta.env.VITE_SERVER_URL || "http://127.0.0.1:8080",
    loginCaptcha: true,
    allowRegister: true,
    showFooter: true,
  })
  Message.success("已恢复默认配置")
}

loadLocalConfig()
</script>

<template>
  <div class="settings_view">
    <div class="page_head">
      <div>
        <h2>站点配置</h2>
        <p>当前后端未提供站点配置保存接口，页面保存用于后台本地预览。</p>
      </div>
      <div class="actions">
        <a-button @click="resetConfig">恢复默认</a-button>
        <a-button type="primary" @click="saveConfig">保存配置</a-button>
      </div>
    </div>

    <div class="settings_grid">
      <div class="panel">
        <div class="panel_title">基础信息</div>
        <a-form :model="form" auto-label-width>
          <a-form-item field="title" label="后台标题">
            <a-input v-model="form.title"></a-input>
          </a-form-item>
          <a-form-item field="slogan" label="站点名称">
            <a-input v-model="form.slogan"></a-input>
          </a-form-item>
          <a-form-item field="enSlogan" label="英文名称">
            <a-input v-model="form.enSlogan"></a-input>
          </a-form-item>
          <a-form-item field="ico" label="站点图标">
            <a-input v-model="form.ico"></a-input>
          </a-form-item>
          <a-form-item field="beian" label="备案号">
            <a-input v-model="form.beian" placeholder="未配置"></a-input>
          </a-form-item>
        </a-form>
      </div>

      <div class="panel">
        <div class="panel_title">运行配置</div>
        <a-form :model="form" auto-label-width>
          <a-form-item field="serverUrl" label="后端地址">
            <a-input v-model="form.serverUrl"></a-input>
          </a-form-item>
          <a-form-item field="loginCaptcha" label="登录验证码">
            <a-switch v-model="form.loginCaptcha"></a-switch>
          </a-form-item>
          <a-form-item field="allowRegister" label="开放注册">
            <a-switch v-model="form.allowRegister"></a-switch>
          </a-form-item>
          <a-form-item field="showFooter" label="显示页脚">
            <a-switch v-model="form.showFooter"></a-switch>
          </a-form-item>
        </a-form>
      </div>

      <div class="panel preview_panel">
        <div class="panel_title">站点预览</div>
        <div class="preview">
          <img :src="form.ico" alt="logo">
          <div>
            <h3>{{ form.slogan }}</h3>
            <p>{{ form.enSlogan }}</p>
            <span>{{ form.title }}</span>
          </div>
        </div>
        <a-descriptions :column="1" bordered>
          <a-descriptions-item label="后端地址">{{ form.serverUrl }}</a-descriptions-item>
          <a-descriptions-item label="备案号">{{ form.beian || "未配置" }}</a-descriptions-item>
          <a-descriptions-item label="登录验证码">{{ form.loginCaptcha ? "开启" : "关闭" }}</a-descriptions-item>
          <a-descriptions-item label="开放注册">{{ form.allowRegister ? "开启" : "关闭" }}</a-descriptions-item>
        </a-descriptions>
      </div>
    </div>
  </div>
</template>

<style lang="less">
.settings_view {
  padding: 20px;

  .page_head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;

    h2 {
      margin: 0 0 6px;
      font-size: 22px;
    }

    p {
      margin: 0;
      color: @color-text-2;
    }

    .actions {
      display: flex;
      gap: 10px;
    }
  }

  .settings_grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
  }

  .panel {
    border: @f_border;
    border-radius: 5px;
    padding: 18px;
    background-color: var(--color-bg-1);
  }

  .panel_title {
    font-size: 16px;
    font-weight: 600;
    margin-bottom: 18px;
  }

  .preview_panel {
    grid-column: span 2;
  }

  .preview {
    display: flex;
    align-items: center;
    margin-bottom: 18px;

    img {
      width: 68px;
      height: 68px;
      border-radius: 5px;
      margin-right: 16px;
      background-color: var(--color-fill-2);
    }

    h3 {
      margin: 0 0 6px;
      font-size: 22px;
    }

    p,
    span {
      display: block;
      color: @color-text-2;
      margin: 0 0 4px;
    }
  }
}
</style>
