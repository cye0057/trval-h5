<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showToast } from 'vant'
import { recommendTravel } from '../api/travel'
import Spotltem from '../components/Spotltem.vue'
import BudgetTable from '../components/BudgetTable.vue'

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const error = ref(false)
const errorMsg = ref('')

const city = ref('')
const budget = ref(null)
const days = ref(null)

//旅游推荐详情数组
const tripData = ref(null)
//激活的天数
const activDays = ref([])

const fetchData = async () => {
  loading.value = true
  error.value = false
  try {
    city.value = route.query.city || ''
    budget.value = route.query.budget ? Number(route.query.budget) : null
    days.value = route.query.days ? Number(route.query.days) : null

    if (!city.value || !budget.value || !days.value) {
      showToast('参数不完整')
      return
    }

    const data = {
      city: city.value,
      budget: budget.value,
      days: days.value,
    }
    const res = await recommendTravel(data)
    const result = res.data || res
    //后端返回 success:false 说明 AI 返回内容解析失败
    if (result && result.success === false) {
      error.value = true
      errorMsg.value = result.error || 'AI 生成结果解析失败，请重试'
    } else {
      tripData.value = result
    }
  } catch (e) {
    error.value = true
    errorMsg.value = e.message || '请求失败'
    console.error('请求失败:', e)
  } finally {
    loading.value = false
  }
}

const goBack = () => {
  router.back()
}

const goToChat = () => {
  router.push({ name: 'chat' })
}

onMounted(fetchData)
</script>

<template>
    <div class="page-container">
        <van-nav-bar title="推荐结果" left-arrow @click-left="goBack"/>
        <div class="page-content">
            <div v-if="loading" class="loading-container">
                <van-loading size="48px" type="spinner" />
                <div class="loading-text">AI 正在生成行程，请耐心等待...</div>
            </div>
            <div v-else-if="error">
                <van-empty :description="errorMsg || '请求失败'">
                     <van-button @click="fetchData" round type="primary" class="bottom-button">重新生成</van-button>
                </van-empty>
            </div>
            <template v-else-if="tripData && tripData.success !== false && tripData.dailyItinerary">
               <div class="card overflow-card">
                  <h2>{{ tripData.city }} . {{ tripData.days }}天的行程</h2>
               </div>
               <van-collapse v-model="activDays">
               <van-collapse-item
               v-for="day in tripData.dailyItinerary"
               :key="day.day"
               :title="'第' + day.day + '天'"
               :name="day.day">
               <div class="day-schedule">
                  <div class="schedule-section">
                     <div class="section-label morning">上午</div>
                     <spotltem :data="day.morning"/>
                  </div>
                  <div class="schedule-section">
                     <div class="section-label afternoon">下午</div>
                     <spotltem :data="day.afternoon"/>
                  </div>
                  <div class="schedule-section">
                     <div class="section-label evening">晚上</div>
                     <spotltem :data="day.evening"/>
                  </div>
               </div>
               </van-collapse-item>
               </van-collapse>
               <div class="card budget-card">
                  <div class="seciton-title">预算明细</div>
                  <BudgetTable :data="tripData.budgetBreakdown" :total="tripData.totalBudget"/>
               </div>
               <div class="card tips-card">
                  <div class="seciton-title">温馨提示</div>
                  <ul class="tips-list">
                     <li v-for="tip in tripData.tips" :key="tip">{{ tip }}</li>
                  </ul>
               </div>
               <div class="card warnings-card">
                  <div class="seciton-title">注意事项</div>
                  <ul class="warnings-list">
                     <li v-for="warning in tripData.warnings" :key="warning">{{ warning }}</li>
                  </ul>
               </div>
            </template>
        </div>
        <div v-if="tripData && tripData.success !== false && tripData.dailyItinerary" class="detail-footer">
            <van-button @click="goToChat" type="primary" size="large" round class="primary-button">咨询Ai助手</van-button>
        </div>
    </div>
</template>

<style scoped>
 .page-container{
   min-height: 100vh;
   background-color: #f5f5f5;
   padding-bottom: 70px;
 }
 .card{
   background-color: #fff;
   border-radius: 8px;
   padding: 16px;
   margin-bottom: 12px;
   box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
 }

 .section-title{
    font-size: 16px;
    font-weight: 600;
    color: #333;
    margin-bottom: 12px;
 }

 .page-content{
    padding: 16px;
 }

 .overflow-card{
    padding: 0;
 }

 .trip-budget {
    font-size: 16px;
    font-weight: 600;
    color: #ee0a24;
 }

 .trip-collapse{
    margin-top: 16px;
 }

 .day-schedule{
    padding: 8px 0;
 }

 .schedule-section{
    margin-bottom: 16px;
 }

 .schedule-section:last-child{
    margin-bottom: 0;
 }

 .section-label{
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 14px;
    font-weight: 600;
    display: inline-block;
    margin-right: 8px;
 }

 .section-label.morning{
    background: #fff;
    color: #e6ad33;
 }

 .section-label.afternoon{
    background: #fff;
    color: #4179da;
 }

 .section-label.evening{
    background: #e1d9da;
    color: #52c41a;
 }

 .budget-card,
 .tips-card,
 .warnings-card{
   margin-bottom: 16px;
 }

 .tips-list,
 .warnings-list{
    list-style: none;
    padding: 0;
    margin: 0;
 }
 
 .tips-list li,
 .warnings-list li{
    padding-bottom: 8px 0;
    color: #666;
    font-size: 14px;
    border-bottom: 1px solid #f7f7f7;
 }

 .tips-list li:last-child,
 .warnings-list li:last-child{
    border-bottom: none;
 }

 .detail-footer{
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 12px 16px;
    background: #fff;
    box-shadow: 0 -2px 4px rgba(0, 0, 0, 0.05);
    max-width: 750px;
    margin: 0 auto;
 }

 .loading-container{
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 80px 16px;
 }

 .loading-text{
    margin-top: 16px;
    font-size: 14px;
    color: #999;
 }

 .error-card{
    text-align: center;
    padding: 40px 16px;
 }
</style>
