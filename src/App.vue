<script setup>
import { ref } from 'vue'
import { useRoute } from 'vue-router';

const route = useRoute()

const active = ref(0)
</script>


<template>
  <router-view />
  <van-tabbar v-if="['/', '/chat', '/profile'].includes(route.path)" v-model="active">
  <van-tabbar-item to="/" icon="home-o">首页</van-tabbar-item>
  <van-tabbar-item to="/chat" icon="chat-o">对话</van-tabbar-item>
  <van-tabbar-item to="/profile" icon="user-o">我的</van-tabbar-item>
</van-tabbar>

</template>

<style>
/* 桌面端内容最大宽度居中，两侧留白；移动端满宽。
   透明底让 body 的淡绿渐变透出；不加路由 <transition>（out-in 快速切 tab 会白屏）。 */
#app {
  max-width: var(--app-max-width, 750px);
  margin: 0 auto;
  min-height: 100vh;
  min-height: 100dvh;
  background: transparent;
}
</style>
