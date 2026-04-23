<script setup lang="ts">
import F_nav from "@/components/web/f_nav.vue";
import F_footer from "@/components/web/f_footer.vue";
import F_main from "@/components/web/f_main.vue";

const categories = [
  {name: "数码家电", desc: "手机、电脑、智能设备"},
  {name: "品质生活", desc: "家居、清洁、日用好物"},
  {name: "服饰运动", desc: "潮流穿搭、户外装备"},
  {name: "食品生鲜", desc: "零食饮品、产地直采"},
]

const products = [
  {name: "云感降噪耳机", tag: "新品", price: "299", color: "#1d6d8f"},
  {name: "恒温养生壶", tag: "热卖", price: "189", color: "#9d4f2f"},
  {name: "轻量通勤背包", tag: "精选", price: "159", color: "#476a42"},
  {name: "鲜萃冷泡礼盒", tag: "限时", price: "89", color: "#a0607b"},
]
</script>

<template>
  <div class="web_home_view">
    <f_nav no-scroll></f_nav>
    <f_main>
      <section class="mall_hero">
        <div class="hero_content">
          <div class="eyebrow">FENGFENG MALL</div>
          <h1>枫枫商城</h1>
          <p>面向商城业务的前台入口已就绪，后台管理系统沿用 fengfeng_admin 模板并保留登录、权限、菜单与 mock 数据能力。</p>
          <div class="hero_actions">
            <a-button type="primary" size="large">
              <template #icon>
                <icon-shopping-cart/>
              </template>
              逛精选
            </a-button>
            <router-link :to="{name: 'admin'}">
              <a-button size="large">
                <template #icon>
                  <icon-dashboard/>
                </template>
                进后台
              </a-button>
            </router-link>
          </div>
        </div>
        <div class="hero_panel">
          <div class="panel_top">
            <span>今日上新</span>
            <strong>48</strong>
          </div>
          <div class="panel_goods">
            <div class="goods_img"></div>
            <div>
              <div class="goods_name">智能生活精选套装</div>
              <div class="goods_meta">家电 / 数码 / 日用</div>
            </div>
          </div>
        </div>
      </section>

      <section id="categories" class="mall_section">
        <div class="section_head">
          <h2>商品分类</h2>
          <span>覆盖商城核心经营类目</span>
        </div>
        <div class="category_grid">
          <div class="category_item" v-for="item in categories" :key="item.name">
            <div class="category_icon">
              <icon-apps/>
            </div>
            <h3>{{ item.name }}</h3>
            <p>{{ item.desc }}</p>
          </div>
        </div>
      </section>

      <section id="featured" class="mall_section featured_section">
        <div class="section_head">
          <h2>精选商品</h2>
          <span>为后续商品接口、购物车与订单流程预留展示位</span>
        </div>
        <div class="product_grid">
          <div class="product_card" v-for="item in products" :key="item.name">
            <div class="product_cover" :style="{backgroundColor: item.color}">
              <span>{{ item.tag }}</span>
            </div>
            <div class="product_body">
              <h3>{{ item.name }}</h3>
              <div class="price">¥{{ item.price }}</div>
            </div>
          </div>
        </div>
      </section>
    </f_main>
    <f_footer></f_footer>
  </div>
</template>

<style scoped lang="less">
.web_home_view {
  color: var(--color-text-1);
}

.mall_hero {
  min-height: 560px;
  padding: 96px max(24px, calc((100% - 1200px) / 2)) 64px;
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(320px, .7fr);
  align-items: center;
  gap: 48px;
  background:
      linear-gradient(90deg, rgba(17, 28, 38, .86), rgba(17, 28, 38, .52)),
      url("@/assets/img/home_bg.png") center / cover no-repeat;
  color: #fff;
}

.hero_content {
  max-width: 680px;

  .eyebrow {
    font-size: 14px;
    font-weight: 600;
    letter-spacing: 0;
    margin-bottom: 18px;
    color: #9ee8cf;
  }

  h1 {
    margin: 0;
    font-size: 54px;
    line-height: 1.08;
    font-weight: 800;
  }

  p {
    margin-top: 22px;
    max-width: 620px;
    font-size: 18px;
    line-height: 1.8;
    color: rgba(255, 255, 255, .84);
  }
}

.hero_actions {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-top: 34px;

  a {
    text-decoration: none;
  }
}

.hero_panel {
  width: 100%;
  border-radius: 8px;
  padding: 28px;
  background: rgba(255, 255, 255, .92);
  color: #1f2933;
  box-shadow: 0 24px 70px rgba(0, 0, 0, .22);
}

.panel_top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;

  span {
    color: #5d6673;
  }

  strong {
    font-size: 42px;
    color: #0f766e;
  }
}

.panel_goods {
  display: grid;
  grid-template-columns: 120px 1fr;
  gap: 18px;
  align-items: center;
}

.goods_img {
  aspect-ratio: 1;
  border-radius: 8px;
  background:
      radial-gradient(circle at 35% 30%, #f7d27d 0 18%, transparent 19%),
      linear-gradient(135deg, #0f766e, #2f5f8f);
}

.goods_name {
  font-size: 20px;
  font-weight: 700;
}

.goods_meta {
  margin-top: 8px;
  color: #667085;
}

.mall_section {
  padding: 64px max(24px, calc((100% - 1200px) / 2));
  background: var(--color-bg-1);
}

.featured_section {
  background: var(--color-fill-1);
}

.section_head {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 28px;

  h2 {
    margin: 0;
    font-size: 30px;
  }

  span {
    color: var(--color-text-2);
  }
}

.category_grid,
.product_grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 20px;
}

.category_item,
.product_card {
  border-radius: 8px;
  background: var(--color-bg-1);
  border: 1px solid var(--color-border-2);
}

.category_item {
  min-height: 176px;
  padding: 26px;

  .category_icon {
    width: 44px;
    height: 44px;
    border-radius: 8px;
    display: grid;
    place-items: center;
    color: #fff;
    background: #0f766e;
    font-size: 22px;
  }

  h3 {
    margin: 22px 0 10px;
    font-size: 20px;
  }

  p {
    color: var(--color-text-2);
    line-height: 1.7;
  }
}

.product_card {
  overflow: hidden;
}

.product_cover {
  height: 180px;
  padding: 18px;
  display: flex;
  align-items: flex-start;
  justify-content: flex-end;

  span {
    border-radius: 8px;
    padding: 6px 12px;
    background: rgba(255, 255, 255, .9);
    color: #1f2933;
    font-weight: 600;
  }
}

.product_body {
  padding: 18px;

  h3 {
    margin: 0 0 12px;
    font-size: 18px;
  }

  .price {
    color: #c2410c;
    font-size: 22px;
    font-weight: 700;
  }
}

@media (max-width: 900px) {
  .mall_hero {
    grid-template-columns: 1fr;
    min-height: auto;
    padding-top: 72px;
  }

  .hero_content h1 {
    font-size: 42px;
  }

  .category_grid,
  .product_grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 560px) {
  .mall_hero,
  .mall_section {
    padding-left: 16px;
    padding-right: 16px;
  }

  .hero_content {
    h1 {
      font-size: 34px;
    }

    p {
      font-size: 16px;
    }
  }

  .hero_panel {
    padding: 20px;
  }

  .panel_goods {
    grid-template-columns: 88px 1fr;
  }

  .section_head {
    align-items: flex-start;
    flex-direction: column;
  }

  .category_grid,
  .product_grid {
    grid-template-columns: 1fr;
  }
}
</style>
