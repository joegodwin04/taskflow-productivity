export const API_BASE_URL =
  import.meta.env.VITE_API_URL || '';

export const fetchAPI = async (endpoint, options = {}) => {
  const token = localStorage.getItem('tf_token') || sessionStorage.getItem('tf_token');

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  // 10 second timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(`${API_BASE_URL}/api${endpoint}`, {
      ...options,
      headers,
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    const data = await response.json();

    if (response.status === 401) {
      // Dispatch custom event to trigger global logout in App.jsx
      window.dispatchEvent(new CustomEvent('auth:expired'));
      throw new Error(data.message || 'Session expired. Please log in again.');
    }

    if (!response.ok) {
      throw new Error(data.message || 'API request failed');
    }

    return data;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Request timed out. Please check your connection and try again.');
    }
    throw error;
  }
};