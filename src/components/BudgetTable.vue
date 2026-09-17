<template>
  <div class="budget-table">
    <van-cell-group :border="false">
      <van-cell
        v-for="(value, key) in budgetItems"
        :key="key"
        :title="getLabel(key)"
        :value="value || '—'"
        :border="false"
      />
    </van-cell-group>
    <div class="budget-total">
      <span>总计</span>
      <span class="total-amount">¥{{ total }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  data: {
    type: Object,
    default: () => ({})
  },
  total: {
    type: [Number, String],
    default: 0
  }
})

const labelMap = {
  accommodation: '住宿',
  transportation: '交通',
  transport: '交通',
  food: '餐饮',
  tickets: '门票',
  other: '其他',
}

const getLabel = (key) => labelMap[key] || key

const budgetItems = computed(() => {
  return {
    accommodation: props.data.accommodation || '',
    transportation: props.data.transportation || props.data.transport || '',
    food: props.data.food || '',
    tickets: props.data.tickets || '',
    other: props.data.other || '',
  }
})
</script>

<style scoped>
.budget-table {
  margin-top: 8px;
}

.budget-total {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  font-size: 16px;
  font-weight: 600;
  color: var(--van-text-color);
  border-top: 1px solid var(--van-border-color);
  margin-top: 4px;
}

.total-amount {
  color: var(--van-danger-color);
  font-size: 18px;
}
</style>
