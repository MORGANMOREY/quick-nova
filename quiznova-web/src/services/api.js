// Centralized API Service for QuizNova Web

const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace(/\/$/, '');
  }
  return 'http://localhost:5001';
};

export const API_BASE_URL = getApiBaseUrl();

/**
 * Standard request helper with JWT header attachment and response parsing.
 */
export async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem('quiznova_token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  try {
    const res = await fetch(url, {
      ...options,
      headers,
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data.message || `Request failed with status ${res.status}`);
    }

    return data;
  } catch (error) {
    console.error(`[API Error] ${endpoint}:`, error.message);
    throw error;
  }
}

// Auth API Endpoints
export const authApi = {
  login: (identifier, password) =>
    apiRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password }),
    }),

  register: (payload) =>
    apiRequest('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  googleLogin: (credential) =>
    apiRequest('/api/auth/google', {
      method: 'POST',
      body: JSON.stringify({ credential }),
    }),

  getMe: () => apiRequest('/api/auth/me'),

  updateMe: (updates) =>
    apiRequest('/api/auth/me', {
      method: 'PATCH',
      body: JSON.stringify(updates),
    }),

  changePassword: (currentPassword, newPassword) =>
    apiRequest('/api/auth/password', {
      method: 'PATCH',
      body: JSON.stringify({ currentPassword, newPassword }),
    }),

  forgotPassword: (email) =>
    apiRequest('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  resetPassword: (email, otp, newPassword) =>
    apiRequest('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email, otp, newPassword }),
    }),

  getAdminUsers: () => apiRequest('/api/auth/admin/users'),

  updateUserRole: (userId, role) =>
    apiRequest(`/api/auth/admin/users/${userId}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    }),
};

// Quizzes API Endpoints
export const quizApi = {
  getQuizzes: () => apiRequest('/api/quizzes'),

  getQuizById: (id) => apiRequest(`/api/quizzes/${id}`),

  createQuiz: (quizData) =>
    apiRequest('/api/quizzes', {
      method: 'POST',
      body: JSON.stringify(quizData),
    }),

  updateQuiz: (id, updates) =>
    apiRequest(`/api/quizzes/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    }),

  deleteQuiz: (id) =>
    apiRequest(`/api/quizzes/${id}`, {
      method: 'DELETE',
    }),
};

// Users / Gamification API Endpoints
export const userApi = {
  getLeaderboard: () => apiRequest('/api/leaderboard'),

  getHistory: (page = 1, limit = 20) =>
    apiRequest(`/api/users/history?page=${page}&limit=${limit}`),

  saveHistory: (historyData) =>
    apiRequest('/api/users/history', {
      method: 'POST',
      body: JSON.stringify(historyData),
    }),
};
