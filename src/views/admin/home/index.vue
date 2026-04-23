<script setup lang="ts">
import F_card from "@/components/common/f_card.vue";
import F_welcome from "@/components/admin/f_welcome.vue";
import F_quick_entrance from "@/components/admin/f_quick_entrance.vue";
import F_version from "@/components/common/f_version.vue";
import User_login_echarts from "@/components/echarts/user_login_echarts.vue";
import Order_trend_echarts from "@/components/echarts/order_trend_echarts.vue";
import System_resource_echarts from "@/components/echarts/system_resource_echarts.vue";
</script>

<template>
  <div class="home_view">
    <f_welcome></f_welcome>

    <div class="dashboard_grid">
      <div class="main_column">
        <f_card title="用户独立趋势">
          <user_login_echarts></user_login_echarts>
        </f_card>

        <div class="chart_row">
          <f_card title="下单统计">
            <order_trend_echarts></order_trend_echarts>
          </f_card>

          <f_card title="系统资源">
            <system_resource_echarts></system_resource_echarts>
          </f_card>
        </div>
      </div>

      <div class="side_column">
        <f_quick_entrance></f_quick_entrance>
        <f_version></f_version>
      </div>
    </div>
  </div>
</template>

<style lang="less">
.home_view {
  background-color: inherit !important;

  .dashboard_grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 320px;
    gap: 20px;
  }

  .main_column {
    min-width: 0;
    display: grid;
    gap: 20px;
  }

  .chart_row {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 20px;
  }

  .side_column {
    display: grid;
    gap: 20px;
    align-content: start;
  }

  @media (max-width: 1280px) {
    .dashboard_grid {
      grid-template-columns: 1fr;
    }

    .side_column {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (max-width: 960px) {
    .chart_row,
    .side_column {
      grid-template-columns: 1fr;
    }
  }
}
</style>
