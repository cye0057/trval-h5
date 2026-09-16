import axios from 'axios'
import { showToast } from 'vant'

const service = axios.create({
  baseURL: '/',
  timeout: 120000,
  headers: {
    'Content-Type': 'application/json',
  },
})

service.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    console.error('Request error:', error)
    return Promise.reject(error)
  }
)

service.interceptors.response.use(
  (response) => {
    const res = response.data
    //后端统一返回体字段是 messages（复数）；之前读 message 导致 toast 永远显示默认文案
    const bizMsg = res.messages || res.message
    if (res.code !== undefined && res.code !== 0 && res.code !== 200) {
      if (res.code === 401) {
        //登录态失效：清本地token，游客模式继续可用；Profile 页的登录框会自然重新出现
        localStorage.removeItem('token')
        localStorage.removeItem('user')
      }
      showToast(bizMsg || '请求失败')
      return Promise.reject(new Error(bizMsg || 'Error'))
    }
    return res
  },
  (error) => {
    const message = error.code === 'ECONNABORTED'
      ? '请求超时，请检查网络'
      : error.response?.data?.messages || error.response?.data?.message || error.message || '网络异常，请稍后重试'
    showToast(message)
    return Promise.reject(error)
  }
)

  export const post = (url, data = {}) => {
    return service.post(url, data)
  }

  export const get = (url, params = {}) => {
    return service.get(url, { params })
  }

//处理流式接口
export async function fetchStream(url,data,onChunk,onComplete,onError){
  //终止的请求控制器
  const controller = new AbortController()

  //fetch 不走 axios 拦截器，必须手动补 Authorization——否则登录用户的对话也会被后端当游客，历史不落库
  const headers = { 'Content-Type': 'application/json' }
  const token = localStorage.getItem('token')
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`/api/travel/${url}`,{
    method:'POST',
    headers,
    body:JSON.stringify(data),
    signal:controller.signal,
  })

  if (!response.ok) {                    // 新增：非 2xx 直接走错误回调
  const text = await response.text().catch(() => '')
  onError(`请求失败 ${response.status}：${text.slice(0, 100)}`)
  return
}

  //创建响应体可读流读取器
  const reader = response.body.getReader()
  //把二进制数据解码为字符串
  const decoder = new TextDecoder()

  while(true){
    const {done,value} = await reader.read()
    if(done){break}
    const chunk = decoder.decode(value,{stream:true})
    console.log(chunk)
    const lines = chunk.split('\n').filter(line => line.trim())
    for (const line of lines){
      if(line.startsWith('data:')){
        const jsonStr = line.substring(5)
        try{
            if(jsonStr){
            const jsonData = JSON.parse(jsonStr)
            
            if(jsonData.type === 'chunk'){
              //分片的数据
              onChunk(jsonData.content)
            }else if(jsonData.done){
              //完成
              onComplete()
            }else if(jsonData.error){
              //错误
              onError(jsonData.error)
            }
          }
        }catch(error){
          onError('流式数据解析异常')
        }

      }
     }
    }
  return controller.abort()
}

export default service
