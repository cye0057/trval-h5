<script setup>
import { ref } from 'vue'
import { showToast, showConfirmDialog } from 'vant'
import { login, register, logout } from '../api/user'

const token = ref(localStorage.getItem('token') || '')
const user = ref(JSON.parse(localStorage.getItem('user') || 'null'))
const isLogin = () => !!token.value

// 登录表单
const loginForm = ref({ username: '', password: '' })
// 注册表单
const regForm = ref({ username: '', password: '', nickname: '' })
const submitting = ref(false)

const saveSession = (data) => {
  token.value = data.token
  user.value = { userCode: data.userCode, username: data.username, nickname: data.nickname }
  localStorage.setItem('token', data.token)
  localStorage.setItem('user', JSON.stringify(user.value))
}

const doLogin = async () => {
  if (!loginForm.value.username || !loginForm.value.password) {
    showToast('请填写用户名和密码')
    return
  }
  submitting.value = true
  try {
    const res = await login(loginForm.value)
    saveSession(res.data)
    showToast('登录成功')
  } finally {
    submitting.value = false
  }
}

const doRegister = async () => {
  if (!regForm.value.username || !regForm.value.password) {
    showToast('请填写用户名和密码')
    return
  }
  submitting.value = true
  try {
    const res = await register(regForm.value)
    // 后端注册即登录，省一次密码提交
    saveSession(res.data)
    showToast('注册成功，已自动登录')
  } finally {
    submitting.value = false
  }
}

const doLogout = async () => {
  try {
    await showConfirmDialog({ title: '退出登录', message: '退出后聊天记录仍保留7天，重新登录可回看' })
  } catch (e) {
    return // 用户取消
  }
  try {
    await logout()
  } catch (e) { /* 本地清除不依赖服务端结果 */ }
  token.value = ''
  user.value = null
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  showToast('已退出登录')
}
</script>

<template>
  <div class="demo-page">
    <div class="page-header" style="height: 46px;">
      <van-nav-bar title="个人中心" fixed />
    </div>

    <div class="block" style="margin-top: 46px;">
      <!-- 已登录：用户卡片（历史对话已移至对话页侧边栏，这里不再重复） -->
      <template v-if="isLogin()">
        <div class="user-card">
          <van-avatar :size="52" background="#1A2B3C">{{ (user.nickname || 'U')[0] }}</van-avatar>
          <div class="user-meta">
            <div class="user-name">{{ user.nickname }}</div>
            <div class="user-code">ID: {{ user.userCode }}</div>
          </div>
          <van-button size="small" plain type="danger" @click="doLogout">退出</van-button>
        </div>
        <van-notice-bar wrapable :scrollable="false"
          text="历史对话入口在「对话」页右上角『历史』按钮，7天内可回看" />
      </template>

      <!-- 未登录：登录/注册 tabs；游客仍可正常使用 AI 对话，只是没有历史 -->
      <template v-else>
        <van-notice-bar wrapable :scrollable="false"
          text="游客模式可直接使用AI对话（对话页）；登录后可在7天内回看历史对话" />
        <van-tabs>
          <van-tab title="登录">
            <van-form @submit="doLogin" class="form-block">
              <van-field v-model="loginForm.username" label="用户名" placeholder="登录名" required />
              <van-field v-model="loginForm.password" type="password" label="密码" placeholder="密码" required />
              <div style="margin: 16px;">
                <van-button round block type="primary" native-type="submit" :loading="submitting">登 录</van-button>
              </div>
            </van-form>
          </van-tab>
          <van-tab title="注册">
            <van-form @submit="doRegister" class="form-block">
              <van-field v-model="regForm.username" label="用户名" placeholder="2-32位" required />
              <van-field v-model="regForm.password" type="password" label="密码" placeholder="6-64位" required />
              <van-field v-model="regForm.nickname" label="昵称" placeholder="选填" />
              <div style="margin: 16px;">
                <van-button round block type="primary" native-type="submit" :loading="submitting">注 册</van-button>
              </div>
            </van-form>
          </van-tab>
        </van-tabs>
      </template>
    </div>
  </div>
</template>

<style scoped>
.demo-page {
  min-height: 100vh;
  background: transparent;
  padding-bottom: 60px;
}
.block {
  padding: 12px;
}
.form-block {
  margin-top: 12px;
}
.user-card {
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--van-white);
  border: none;
  border-radius: var(--app-card-radius);
  padding: 18px;
  box-shadow: var(--app-shadow-soft);
}
.user-meta {
  flex: 1;
}
.user-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--van-text-color);
}
.user-code {
  font-size: 12px;
  color: var(--van-text-color-3);
  margin-top: 4px;
}
</style>
