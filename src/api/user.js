import { post, get } from '../utils/request'

// 用户中心 API：统一走 request.js 的 axios（自动带 token、自动处理业务码）
export const register = (data) => post('/api/user/register', data)
export const login = (data) => post('/api/user/login', data)
export const logout = () => post('/api/user/logout')
export const getMe = () => get('/api/user/me')
export const getHistory = () => get('/api/user/history')
export const getHistoryDetail = (sessionId) => get(`/api/user/history/${sessionId}`)
