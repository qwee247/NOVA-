import axios from 'axios'
import { ElMessage } from 'element-plus'
import { mockAdapter } from '../mock/adapter'
export const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api', timeout: 8000,
  ...(import.meta.env.VITE_USE_MOCK !== 'false' ? { adapter: mockAdapter } : {}),
})
http.interceptors.request.use(config => {
  const token = localStorage.getItem('nova-token') || sessionStorage.getItem('nova-token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})
http.interceptors.response.use(response => response, error => {
  const message = error.response?.data?.message || error.message || '请求异常，请稍后重试'
  ElMessage.error(message)
  if (error.response?.status === 401 && error.config?.url !== '/auth/login') window.dispatchEvent(new Event('nova-unauthorized'))
  return Promise.reject(new Error(message))
})
