import request from '../utils/request'

export const recommendTravel = (data) => {
  return request.post('/api/travel/recommend', data)
}

// 运营位数据（无需登录，游客可见）
export const getHotQuestions = () => request.get('/api/hot/questions')
export const getHotCities = () => request.get('/api/hot/cities')
