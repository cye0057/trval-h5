<script setup>
import { reactive, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant';
import { getHotCities } from '../api/travel';



const formData = reactive({
  city: '',
  budget: null,
  days: null

})

const showCityPicker = ref(false)

const onConfirm = ({ selectedValues }) => {
  formData.city = selectedValues[0]
  showCityPicker.value = false
}
const onCancel = () => {
  showCityPicker.value = false
}

const columns = [
  {
    text: '北京',
    value: '北京'
  },
  {
    text: '上海',
    value: '上海'
  },
  {
    text: '广州',
    value: '广州'
  },
  {
    text: '深圳',
    value: '深圳'
  }
]

// 热门城市：运营数据存 MySQL(hot_city 表)，接口失败时用这份兜底保证首页不空
const hotCities = ref([])
const fallbackCities = ['北京', '上海', '广州', '深圳', '成都', '杭州', '西安', '重庆']

onMounted(async () => {
  try {
    const res = await getHotCities()
    hotCities.value = (res.data && res.data.length > 0) ? res.data : fallbackCities
  } catch (e) {
    hotCities.value = fallbackCities
  }
})

// 旅游规划提交
const handleSubmit = () => {
  console.log(formData)
  //校验
  if (!formData.city) {
    showToast('请选择城市');
    return;
  }
  //预算
  if (!formData.budget || formData.budget <= 100) {
    showToast('请输入大于100的预算');
    return;
  }
  //天数
  if (!formData.days || formData.days <= 0 || formData.days > 30) {
    showToast('请输入1~30天的天数');
    return;
  }
  router.push({
    path:'/detail',
    query: {
      city: formData.city,
      budget: formData.budget,
      days: formData.days
    }
  })
}

const router = useRouter()

// 选择城市
const selectCity = (city) => {
  formData.city = city
  showCityPicker.value = false
}
</script>


<template>
  <div class="page-container">
      <van-nav-bar title="智能旅游助手" left-arrow />
    
    <div class="page-content">
        <van-notice-bar
        left-icon="volume-o"
        text="基于AI的智能经典旅游助手,帮助您更方便地规划您的旅游行程。"
      />
      <div class="card" style="margin-top: 16px;">
        <div class="section-title">
          规划你的旅程
        </div>
        <van-field
        @click="showCityPicker = true"
        v-model="formData.city"
        label="目的地"
        placeholder="请选择城市"
        readonly
        is-link
        class="plan-field"
        />
        <van-field
        v-model="formData.budget"
        label="预算"
        placeholder="请输入预算（元）"
        type="number"
        class="plan-field"
        />
        <van-field
        v-model="formData.days"
        label="天数"
        placeholder="请输入天数"
        type="number"
        class="plan-field"
        />
        <van-button type="primary" size="large" round @click="handleSubmit">规划行程</van-button>
      </div>

      <div class="card">
        <div class="section-title">
          热门目的地
        </div>
        <van-grid :gutter="12" :column-num="4">
          <van-grid-item @click="selectCity(city)" v-for="city in hotCities" :key="city">
            <div class="city-item" :class="{ active: formData.city == city }">
              {{ city }}
            </div>
          </van-grid-item>
        </van-grid>
      </div>
    </div>
  </div>
  <van-popup
  round
  v-model:show="showCityPicker"
  position="bottom">
  <van-picker
    title="选择城市"
    :columns="columns"
    @confirm="onConfirm"
    @cancel="onCancel"
  />
  </van-popup>
  
</template>


<style scoped>
.page-container {
  min-height: 100vh;
  background: transparent;   /* 让 body 淡绿渐变透出 */
  padding-bottom: 120px;
}
.page-content {
  padding: 16px;
}
/* Soft UI 卡片：纯白 + 大圆角 + 大模糊柔影，无边框（参考图） */
.card {
  background-color: var(--van-white);
  border: none;
  border-radius: var(--app-card-radius);
  padding: 18px;
  margin-bottom: 14px;
  box-shadow: var(--app-shadow-soft);
}
.section-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--van-text-color);
  letter-spacing: var(--app-label-spacing);
  margin-bottom: 12px;
}
.plan-field {
  background-color: var(--van-white);
  border-radius: var(--app-field-radius);
  margin-bottom: 10px;
  box-shadow: var(--app-shadow-soft-sm);
}
.city-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}
.city-item {
  padding: 8px 12px;
  border-radius: var(--app-chip-radius);
  font-size: 14px;
  color: var(--van-text-color-2);
  background: var(--van-white);
  text-align: center;
  transition: transform var(--app-duration) ease, box-shadow var(--app-duration) ease, background var(--app-duration) ease;
  box-shadow: var(--app-shadow-soft-sm);
}
.city-item:active {
  transform: translateY(1px);
}
.city-item.active {
  background: var(--app-primary);
  color: #fff;
  box-shadow: var(--app-shadow-soft-sm);
}
</style>
