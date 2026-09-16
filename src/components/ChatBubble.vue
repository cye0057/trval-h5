<script setup>
defineProps({
  message: {
    type: Object,
    required: true,
  },
})

const formatTime = (iso) => {
  if (!iso) return ''
  const d = new Date(iso)
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${hh}:${mm}`
}
</script>

<template>
  <div class="message-item" :class="{ self: message.role === 'user' }">
    <div class="bubble-wrap">
      <div class="bubble">
        <div class="content">{{ message.content }}</div>
      </div>
      <div class="time">{{ formatTime(message.timestamp) }}</div>
    </div>
  </div>
</template>

<style scoped>
.message-item {
  display: flex;
  align-items: flex-start;
}

.message-item:not(.self) {
  justify-content: flex-start;
}

.message-item.self {
  justify-content: flex-end;
}

.bubble-wrap {
  max-width: 70%;
  display: flex;
  flex-direction: column;
}

.message-item.self .bubble-wrap {
  align-items: flex-end;
}

.message-item:not(.self) .bubble-wrap {
  align-items: flex-start;
}

.bubble {
  padding: 10px 14px;
  border-radius: 12px;
  word-break: break-word;
  white-space: pre-wrap;
  font-size: 15px;
  line-height: 1.5;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
}

.message-item:not(.self) .bubble {
  background: #fff;
  color: #333;
  border-top-left-radius: 4px;
}

.message-item.self .bubble {
  background: linear-gradient(135deg, #007AFF, #5AC8FA);
  color: #fff;
  border-top-right-radius: 4px;
}

.content {
  min-height: 1em;
}

.time {
  margin-top: 4px;
  font-size: 11px;
  color: #999;
}
</style>
