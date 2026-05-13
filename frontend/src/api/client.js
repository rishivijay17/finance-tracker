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

export const getDashboard = (sessionId = null) =>
  api.get('/api/analytics/dashboard', {
    params: sessionId != null ? { session_id: sessionId } : {},
  })

export const getCurrency = () => api.get('/api/analytics/currency')

export const getForecast = (sessionId = null) =>
  api.get('/api/analytics/forecast', {
    params: sessionId != null ? { session_id: sessionId } : {},
  })

export const getAnomalies = (sessionId = null) =>
  api.get('/api/analytics/anomalies', {
    params: sessionId != null ? { session_id: sessionId } : {},
  })

export const getHealthScore = (sessionId = null) =>
  api.get('/api/analytics/health-score', {
    params: sessionId != null ? { session_id: sessionId } : {},
  })

export const getInsights = (sessionId = null) =>
  api.get('/api/analytics/insights', {
    params: sessionId != null ? { session_id: sessionId } : {},
  })

export const getRecurring = (sessionId = null) =>
  api.get('/api/analytics/recurring', {
    params: sessionId != null ? { session_id: sessionId } : {},
  })

export const getSessions = () => api.get('/api/sessions')

export const deleteSession = (sessionId) => api.delete(`/api/sessions/${sessionId}`)

export const sendChatMessage = (message) =>
  api.post('/api/chat', { message })

export const getChatHistory = () => api.get('/api/chat/history')

export const clearChatHistory = () => api.delete('/api/chat/history')

export default api
