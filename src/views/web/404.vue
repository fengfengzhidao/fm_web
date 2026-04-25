<script setup lang="ts">
import router from "@/router";

function goHome(){
  router.push({name: "web"})
}
</script>

<template>
  <div class="notfound_view">
    <section class="notfound_shell">
      <div class="copy_block">
        <div class="eyebrow">NOT FOUND</div>
        <h1>页面暂时走丢了</h1>
        <p>你访问的页面可能已下线、地址有误，或者还没有完成配置。先回到首页继续浏览商品会更稳。</p>
        <div class="btn">
          <a-button type="primary" @click="goHome">返回首页</a-button>
        </div>
      </div>

      <div class="art_block">
        <img src="@/assets/img/404.svg" alt="">
      </div>
    </section>
  </div>
</template>

<style  lang="less">
.notfound_view{
  min-height: calc(100vh - 72px);
  display: grid;
  place-items: center;
  padding: 32px 24px 40px;
  background:
    linear-gradient(180deg, #f5f5f6 0, #f5f5f6 420px, #f2f3f5 420px, #f2f3f5 100%);
}

.notfound_shell {
  width: min(1180px, 100%);
  min-height: 560px;
  display: grid;
  grid-template-columns: minmax(280px, 420px) minmax(0, 1fr);
  gap: 24px;
  padding: 28px;
  border-radius: 24px;
  background: #fff;
  box-shadow: 0 20px 45px rgba(17, 24, 39, .05);
}

.copy_block,
.art_block {
  border-radius: 20px;
  border: 1px solid #eceef2;
  background: linear-gradient(180deg, #fffafb, #fff);
}

.copy_block {
  padding: 32px 28px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.eyebrow {
  color: #ff647c;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: .12em;
}

.copy_block h1 {
  margin: 12px 0 14px;
  color: #111827;
  font-size: 42px;
  line-height: 1.08;
}

.copy_block p {
  color: #6b7280;
  font-size: 14px;
  line-height: 1.9;
}

.btn{
  margin-top: 18px;
}

.art_block {
  display: grid;
  place-items: center;
  padding: 24px;

  img{
    width: min(100%, 520px);
    display: block;
  }
}

@media (max-width: 900px) {
  .notfound_view {
    padding-left: 16px;
    padding-right: 16px;
  }

  .notfound_shell {
    grid-template-columns: 1fr;
    padding: 18px;
    border-radius: 18px;
  }

  .copy_block h1 {
    font-size: 32px;
  }
}

@media (max-width: 640px) {
  .copy_block,
  .art_block {
    padding-left: 16px;
    padding-right: 16px;
  }

  .copy_block h1 {
    font-size: 28px;
  }
}
</style>
