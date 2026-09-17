<script setup>
import { ref, nextTick, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { fetchStream } from '../utils/request'
import { getHistory, getHistoryDetail } from '../api/user'
import { getHotQuestions } from '../api/travel'
import { showToast } from 'vant'
import ChatBubble from '../components/ChatBubble.vue'

const route = useRoute()

// 生成会话id。不能直接用 crypto.randomUUID：它只在"安全上下文"（HTTPS 或 localhost）存在，
// 部署后经 http://局域网IP 访问时是 undefined，setup 里一调用就抛 TypeError，整个对话页白屏。
// crypto.getRandomValues 无此限制，用它兜底拼一个等价的 v4 UUID。
const genSessionId = () => {
  if (crypto.randomUUID) return crypto.randomUUID()
  const b = crypto.getRandomValues(new Uint8Array(16))
  b[6] = (b[6] & 0x0f) | 0x40   // version 4
  b[8] = (b[8] & 0x3f) | 0x80   // variant 10
  const hex = [...b].map((x) => x.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

//会话id:本标签页内固定,刷新延续,关标签页自动开新会话
let sessionId = sessionStorage.getItem('chatSessionId')
if (!sessionId) {
  sessionId = genSessionId()
  sessionStorage.setItem('chatSessionId', sessionId)
}

//用户输入
const inputMessage = ref('')

//是否正在流式响应
const isStreaming = ref(false)

//发送消息
const sendMessage = async () => {
  const msg = inputMessage.value.trim()
  if(!msg || isStreaming.value){
    return
  }
  //创建用户的会话信息
  addUserMessage(msg)
  inputMessage.value = ''
  //调用流式响应方法
  fetchAiResponse(msg)
}

const addUserMessage = (msg) => {
  messages.value.push({
    id:Date.now() + 1,
    role:'user',
    content:msg,
    timestamp: new Date().toISOString(),
  })
}

//获取流式响应
const fetchAiResponse = (userMsg) =>{
   //AI正在响应
   isStreaming.value = true
   //添加AI返回的信息
   messages.value.push({
      id:Date.now() + 2,
      role:'ai',
      content:'',
      timestamp: new Date().toISOString(),
   })

   let fullResponse = ''

   fetchStream('chat',{sessionId,message:userMsg},(chunk)=>{
     fullResponse += chunk
     //AI正在回复的信息
     const lastMsg = messages.value[messages.value.length - 1]
     if(lastMsg && lastMsg.role === 'ai'){
      lastMsg.content = fullResponse
     }
     //滚动到最底部
     scrollToBottom()
  },()=>{
    //AI响应完成
    isStreaming.value = false
    //滚动到最底部
    scrollToBottom()
  },(errMsg)=>{
    const lastMsg = messages.value[messages.value.length - 1]
     if(lastMsg && lastMsg.role === 'ai'){
      lastMsg.content = `抱歉AI助手出错了:${errMsg}`
     } 
     isStreaming.value = false
     showToast('AI回复失败')
     //滚动到最底部
     scrollToBottom()
  })
}

//常见问题标签：初始为空，onMounted 从 /api/hot/questions 拉运营数据；
//接口挂了就用这份兜底，保证空态页永远有事可点
const quickQuestions = ref([])
const fallbackQuestions = ['北京有哪些必去的景点', '上海美食推荐', '杭州周末去哪玩', '西安三日游怎么规划']

const loadHotQuestions = async () => {
  try {
    const res = await getHotQuestions()
    quickQuestions.value = (res.data && res.data.length > 0) ? res.data : fallbackQuestions
  } catch (e) {
    quickQuestions.value = fallbackQuestions
  }
}

// 点热门标签 = 填入输入框（不直接发送：让用户可先编辑，也保留"发送"的确认感）
const useQuestion = (q) => {
  inputMessage.value = q
}



//对话信息
const messages = ref([])

//聊天容器
const chatContainer= ref(null)

//滚动到最底部
const scrollToBottom = async () => {
  await nextTick()
  if (chatContainer.value) {
    chatContainer.value.scrollTop = chatContainer.value.scrollHeight
  }
}

watch(messages, scrollToBottom, { deep: true })

// ============ 历史侧边栏（收缩式抽屉） ============
const showSidebar = ref(false)
const historyList = ref([])
const historyLoading = ref(false)
// 模板表达式访问不到 localStorage 全局（不在Vue白名单），登录态要经 ref 暴露给渲染层
const isLoggedIn = ref(!!localStorage.getItem('token'))

// 每次拉开抽屉都重新拉列表：刚聊完的新会话要立刻出现，列表接口本身有Redis缓存不贵
const openSidebar = async () => {
  showSidebar.value = true
  if (!isLoggedIn.value) return // 游客侧栏只显示登录提示
  historyLoading.value = true
  try {
    const res = await getHistory()
    historyList.value = res.data || []
  } catch (e) {
    historyList.value = [] // 401时拦截器已清token并提示
  } finally {
    historyLoading.value = false
  }
}

// 历史回放恢复：从服务端拉回该会话全部消息（服务端有归属校验）
const restoreSession = async (sid) => {
  sessionId = sid
  sessionStorage.setItem('chatSessionId', sid)
  try {
    const res = await getHistoryDetail(sid)
    messages.value = (res.data || []).map((m, i) => ({
      id: i + 1,
      role: m.role === 'user' ? 'user' : 'ai',
      content: m.content,
      // 后端返回 "2026-09-16 12:47"，iOS Safari 不认空格分隔的日期，转成 ISO 格式
      timestamp: (m.createdAt || '').replace(' ', 'T'),
    }))
    scrollToBottom()
  } catch (e) {
    messages.value = []
  }
}

// 新建对话：换uuid、清屏。流式回复中禁止，避免旧流的增量写进新会话的界面
const newConversation = () => {
  if (isStreaming.value) {
    showToast('AI正在回复中，稍后再新建')
    return
  }
  sessionId = genSessionId()
  sessionStorage.setItem('chatSessionId', sessionId)
  // 标记"用户主动新建"：下次挂载跳过自动恢复，否则切首页再回来会被"最近会话"抢占
  sessionStorage.setItem('chatFresh', '1')
  messages.value = []
  showSidebar.value = false
}

// 侧栏里点某条历史
const pickSession = (sid) => {
  if (isStreaming.value) {
    showToast('AI正在回复中，稍后再切换')
    return
  }
  showSidebar.value = false
  restoreSession(sid)
}

onMounted(async () => {
  loadHotQuestions()
  // 用户主动点过"新建"：尊重空屏意图，本次挂载不自动恢复（标记用完即焚）
  if (sessionStorage.getItem('chatFresh')) {
    sessionStorage.removeItem('chatFresh')
    return
  }
  const sid = route.query.sid
  if (sid && typeof sid === 'string') {
    // Profile/侧栏点了指定历史
    restoreSession(sid)
    return
  }
  // 默认策略：登录用户回到对话页 = 自动续上最近一段会话
  // （路由无keep-alive，组件每次进入都重建，这个挂载钩子即"回来还在"的实现点）
  if (isLoggedIn.value) {
    try {
      const res = await getHistory()
      const list = res.data || []
      if (list.length > 0) {
        await restoreSession(list[0].sessionId)
      }
    } catch (e) {
      // 拉不到就保持现有会话内容，不影响使用
    }
  }
})
</script>

<template>
  <div class="page-container chat-page">
    <div class="page-header" style="height: 46px;">
      <van-nav-bar 
      title="AI旅游助手" 
      fixed
      >
        <!-- tabbar 页面里"返回"无意义（用户用底部tab导航），去掉；历史入口 icon+文字更醒目 -->
        <template #right>
          <div class="hist-btn" @click="openSidebar">
            <van-icon name="notes-o" size="16" />
            <span>历史</span>
          </div>
        </template>
      </van-nav-bar>
    </div>
    <div class="chat-container" ref="chatContainer">
        <!-- 还没进行对话的显示 -->
        <div v-if="messages.length === 0" class="chat-empty">
            <van-empty description="开始和AI助手对话吧!" />
            <div class="quick-questions">
                <div class="quick-title">大家都在问</div>
                <van-tag class="quick-tag" v-for="question in quickQuestions" :key="question" mark size="large" @click="useQuestion(question)">{{ question }}</van-tag>
            </div>
        </div>
        <!-- 有对话内容时的显示 -->  
        <div class="message-list" v-else>
          <ChatBubble v-for="msg in messages" :key="msg.id" :message="msg" />
          <div class="streaming-indicator" v-if="isStreaming">
              <van-loading type="spinner" size="20px" />
              <span>AI正在思考中...</span>
          </div>
        </div>
    </div>  
    <div class="chat-input-area">
      <van-field
        v-model="inputMessage"
        placeholder="输入你的问题..."
        :disabled="isStreaming"
        enterkeyhint="send"
        @keyup.enter="sendMessage"
      >
        <template #button>
          <van-button :disabled="!inputMessage.trim()" @click="sendMessage" size="small" type="primary">发送</van-button>
        </template>
      </van-field>
    </div>

    <!-- 历史会话侧边抽屉：点条目切换会话，顶部可新建 -->
    <van-popup
      v-model:show="showSidebar"
      position="left"
      :style="{ width: '78%', height: '100%' }"
    >
      <div class="sidebar">
        <div class="sidebar-header">
          <span class="sidebar-title">历史对话</span>
          <van-button size="small" type="primary" round icon="plus" @click="newConversation">新建对话</van-button>
        </div>
        <van-loading v-if="historyLoading" class="sidebar-loading" />
        <div v-else-if="!isLoggedIn" class="sidebar-tip">
          <van-empty image-size="80" description="登录后可在7天内回看、切换历史对话" />
        </div>
        <van-empty v-else-if="historyList.length === 0" image-size="80" description="还没有历史，聊一段试试" />
        <div v-else class="sidebar-list">
          <div
            v-for="item in historyList"
            :key="item.sessionId"
            class="sidebar-item"
            @click="pickSession(item.sessionId)"
          >
            <div class="sidebar-item-title">{{ item.title }}</div>
            <div class="sidebar-item-time">{{ item.updatedAt }}</div>
          </div>
        </div>
      </div>
    </van-popup>
  </div>
</template>

<style scoped>
.chat-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  height: 100dvh;
  padding-bottom: 50px;
  background: transparent;   /* 透出 body 淡绿渐变 */
}

/* flex:1 + min-height:0：替代写死的 630px，地址栏收起/桌面高度变化都不再撑破或留白 */
.chat-container {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 16px;
  padding-bottom: 60px;
}

.chat-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.quick-questions {
  margin-top: 32px;
  text-align: center;
}


 .quick-title {
  margin-bottom: 16px;
  font-size: 12px;
  color: var(--van-text-color-3);
  text-transform: uppercase;
  letter-spacing: var(--app-label-spacing);
}

.quick-tag {
  margin: 8px;
  cursor: pointer;
}

.message-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.streaming-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  color: var(--van-text-color-3);
  font-size: 14px;
}
 .chat-input-area {
  position: fixed;
  bottom: 50px;
  left: 0;
  right: 0;
  background: var(--van-white);
  padding: 8px 16px;
  box-shadow: var(--app-shadow-top);
  max-width: var(--app-max-width);
  margin: 0 auto;
}

.chat-input-area :deep(.van-field) {
  background: var(--van-white);
  border-radius: 999px;
  padding: 8px 16px;
  box-shadow: var(--app-shadow-soft-sm);
}

.sidebar {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--van-white);
}
.hist-btn {
  display: flex;
  align-items: center;
  gap: 3px;
  color: var(--app-primary);
  font-size: 14px;
}
.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 16px 12px;
  border-bottom: 1px solid var(--van-border-color);
}
.sidebar-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--van-text-color);
}
.sidebar-loading {
  margin: 24px auto;
}
.sidebar-list {
  flex: 1;
  overflow-y: auto;
}
.sidebar-item {
  padding: 12px 16px;
  border-bottom: 1px solid var(--van-border-color);
  transition: background var(--app-duration) ease;
}
.sidebar-item:active {
  background: var(--van-active-color);
}
.sidebar-item-title {
  font-size: 14px;
  color: var(--van-text-color);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.sidebar-item-time {
  font-size: 12px;
  color: var(--van-text-color-3);
  margin-top: 4px;
}
</style>
