import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:8000',
  timeout: 90000, // 90s for AI calls
})

export const uploadStatement = (file) => {
  const form = new FormData()
  form.append('file', file)
  return api.post('/api/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

export const getTransactions = (params = {}) =>
  api.get('/api/transactions', { params })

export const clearTransactions = () => api.delete('/api/transactions')

export const getDashboard = () => api.get('/api/analytics/dashboard')

export const getForecast = () => api.get('/api/analytics/forecast')

export const getAnomalies = () => api.get('/api/analytics/anomalies')

export const sendChatMessage = (message) =>
  api.post('/api/chat', { message })

export const getChatHistory = () => api.get('/api/chat/history')

export const clearChatHistory = () => api.delete('/api/chat/history')

export default api
