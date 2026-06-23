const API_BASE_URL = 'https://taskflow-backend-c58w.onrender.com'

export const fetchAPI = async (endpoint, options = {}) => {
  const token = localStorage.getItem('tf_token')

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {})
  }

  const response = await fetch(`${API_BASE_URL}/api${endpoint}`, {
    ...options,
    headers
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.message || 'API request failed')
  }

  return data
}