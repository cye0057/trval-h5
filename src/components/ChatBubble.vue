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
  border-radius: var(--app-bubble-radius);
  word-break: break-word;
  white-space: pre-wrap;
  font-size: 15px;
  line-height: 1.5;
  box-shadow: var(--app-shadow-soft-sm);
  transition: transform var(--app-duration) ease, box-shadow var(--app-duration) ease;
}

.message-item:not(.self) .bubble {
  background: var(--van-white);
  color: var(--van-text-color);
  border: none;
  border-top-left-radius: 6px;
}

.message-item.self .bubble {
  background: linear-gradient(135deg, var(--app-primary-dark), var(--app-primary));
  color: #fff;
  border: none;
  border-top-right-radius: 6px;
}

.content {
  min-height: 1em;
}

.time {
  margin-top: 4px;
  font-size: 11px;
  color: var(--van-text-color-3);
}
</style>
