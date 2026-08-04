import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request Interceptor: Automatically inject Bearer access token if present
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response Interceptor: Automatically refresh expired access tokens using the refresh token
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Direct error checks to prevent loop or handle missing parts
        if (error.response && error.response.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            const refreshToken = localStorage.getItem('refresh_token') || sessionStorage.getItem('refresh_token');

            if (refreshToken) {
                try {
                    // Perform refreshing via non-intercepted Call to avoid recursive loops
                    const refreshRes = await axios.post(`${API_URL}/api/auth/refresh/`, {
                        refresh: refreshToken,
                    });

                    if (refreshRes.status === 200 && refreshRes.data.access) {
                        const newAccess = refreshRes.data.access;
                        const newRefresh = refreshRes.data.refresh;

                        const storage = localStorage.getItem('refresh_token') ? localStorage : sessionStorage;
                        storage.setItem('access_token', newAccess);
                        if (newRefresh) {
                            storage.setItem('refresh_token', newRefresh);
                        }

                        // Retry original request with new config header
                        originalRequest.headers.Authorization = `Bearer ${newAccess}`;
                        return api(originalRequest);
                    }
                } catch (refreshError) {
                    // Refresh verification timed out or was invalid; raise signout triggers
                    localStorage.removeItem('access_token');
                    localStorage.removeItem('refresh_token');
                    sessionStorage.removeItem('access_token');
                    sessionStorage.removeItem('refresh_token');
                    // Dispatch a custom event to notify AppContext or routing layer to log out
                    window.dispatchEvent(new Event('auth_session_expired'));
                }
            }
        }

        return Promise.reject(error);
    }
);

// Auth Services
export const authAPI = {
    register: (payload) => api.post('/api/auth/register/', payload),
    login: (payload) => api.post('/api/auth/login/', payload),
    logout: (refresh) => api.post('/api/auth/logout/', { refresh }),
    googleLogin: (payload) => api.post('/api/auth/google-login/', payload),
    forgotPassword: (email) => api.post('/api/auth/forgot-password/', { email }),
    verifyResetOTP: (email, otp) => api.post('/api/auth/verify-reset-otp/', { email, otp }),
    resetPassword: (payload) => api.post('/api/auth/reset-password/', payload),
    verifyEmail: (token) => api.get(`/api/auth/verify-email/?token=${token}`),
    resendVerification: (email) => api.post('/api/auth/resend-verification/', { email }),
};

// Assessment Services
export const assessmentAPI = {
    getLatest: () => api.get('/api/assessment/'),
    save: (data) => api.post('/api/assessment/', data),
    update: (data) => api.put('/api/assessment/', data),
    retake: () => api.post('/api/assessment/retake/'),
};

// User Profile Services
export const profileAPI = {
    get: (todayStr) => api.get(`/api/profile/${todayStr ? `?today=${todayStr}` : ''}`),
    update: (data) => api.put('/api/profile/', data),
};

// Mood Services
export const moodAPI = {
    submit: (data) => api.post('/api/mood/', data),
    getHistory: () => api.get('/api/mood/history/'),
};

// Journal Services
export const journalAPI = {
    getAll: () => api.get('/api/journal/'),
    getById: (id) => api.get(`/api/journal/${id}/`),
    create: (data) => api.post('/api/journal/', data),
    update: (id, data) => api.put(`/api/journal/${id}/`, data),
    delete: (id) => api.delete(`/api/journal/${id}/`),
};

// Wellness Activities Services
export const activitiesAPI = {
    getAll: () => api.get('/api/activities/'),
    getById: (id) => api.get(`/api/activities/${id}/`),
    getFeedback: () => api.get('/api/activity-feedback/'),
    submitFeedback: (payload) => api.post('/api/activity-feedback/', payload),
};

// Recommendation Services
export const recommendationAPI = {
    getToday: () => api.get('/api/recommendation/today/'),
    getHistory: () => api.get('/api/recommendation/history/'),
};

// Insights Services
export const insightsAPI = {
    getAnalytics: () => api.get('/api/insights/'),
    getProgress: (todayStr) => api.get(`/api/progress/${todayStr ? `?today=${todayStr}` : ''}`),
};

// AI Services
export const aiAPI = {
    getSentiment: (text) => api.post('/api/ai/sentiment/', { text }),
    getEmotion: (text) => api.post('/api/ai/emotion/', { text }),
    getKeywords: (text) => api.post('/api/ai/keywords/', { text }),
    getCrisis: (text) => api.post('/api/ai/crisis/', { text }),
    getPrediction: () => api.get('/api/ai/prediction/'),
    getInsights: () => api.get('/api/ai/insights/'),
};

export default api;

