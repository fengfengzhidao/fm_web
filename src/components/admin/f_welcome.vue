<script setup lang="ts">
import {computed} from "vue";
import {userStorei} from "@/stores/user_store";

interface Props {
  showWeather?: boolean
  showStatistics?: boolean
  noHelp?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showWeather: false,
  showStatistics: false,
  noHelp: false,
})
const store = userStorei()

const welcomeTitle = computed(() => {
  const now = new Date()
  const h = now.getHours()
  if (h < 9 && h >= 6) {
    return "早安"
  }
  if (h >= 9 && h < 12) {
    return "上午好"
  }
  if (h >= 12 && h < 14) {
    return "中午好"
  }
  if (h >= 14 && h < 16) {
    return "下午好"
  }
  if (h >= 16 && h < 20) {
    return "傍晚好"
  }
  if (h >= 20 && h < 24) {
    return "晚安"
  }
  return "早安"
})

</script>

<template>
  <div class="f_welcome">
    <div class="title">{{ welcomeTitle }} {{ store.userInfo.nickName }}，请开始一天的工作吧</div>
    <div v-if="props.showWeather" class="weather">
      天气信息暂不可用
    </div>
    <div v-if="props.showStatistics" class="statistics">
      <a-statistic animation title="统计信息" :value="0" show-group-separator/>
    </div>
    <div class="extra" v-if="!props.noHelp">
      欢迎使用FengfengAdmin后台系统，可查看 <a href="">系统帮助</a> 以便更好的使用本系统
    </div>
  </div>
</template>

<style lang="less">
.f_welcome {
  width: 100%;
  background-color: var(--color-bg-1);
  border-radius: 5px;
  margin-bottom: 20px;
  background-image: url("@/assets/img/home_bg.png");
  background-size: 500px;
  background-repeat: no-repeat;
  background-position: right center;
  padding: 40px 20px;
  color: var(--color-text-2);

  .title {
    font-size: 22px;
    color: var(--color-text-1);
  }

  .weather {
    margin-top: 20px;
  }

  .statistics {
    margin-top: 20px;

    .arco-statistic {
      margin-right: 30px;

      &:last-child {
        margin-right: 0;
      }
    }
  }

  .extra {
    margin-top: 20px;

    a {
      text-decoration: none;
      color: @primary-6;
    }
  }
}
</style>
