import axios from 'axios';

const RAW_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

const API_BASE_URL = RAW_BASE_URL.endsWith('/') ? RAW_BASE_URL : `${RAW_BASE_URL}/`;

const api = axios.create({
    baseURL: API_BASE_URL,
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });

    failedQueue = [];
};

/**
 * 1. Request Interceptor
 * Attaches the access token to every outgoing request.
 */
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("access_token");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

/**
 * 2. Response Interceptor
 * If a request fails with 401 (Unauthorized), it attempts to refresh the token.
 */
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Skip interceptor for login and refresh endpoints to avoid infinite loops
        if (originalRequest.url.includes('/auth/login') || originalRequest.url.includes('/auth/refresh')) {
            return Promise.reject(error);
        }

        // If error is 401 and we haven't tried to refresh for this specific request yet
        if (error.response?.status === 401 && !originalRequest._retry) {

            // If we are already refreshing, queue this request
            if (isRefreshing) {
                return new Promise(function (resolve, reject) {
                    failedQueue.push({ resolve, reject });
                }).then(token => {
                    originalRequest.headers.Authorization = `Bearer ${token}`;
                    return api(originalRequest);
                }).catch(err => {
                    return Promise.reject(err);
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            const refreshToken = localStorage.getItem("refresh_token");

            if (refreshToken) {
                try {
                    // Use a clean axios instance (not 'api') to avoid infinite loops
                    const response = await axios.post(`${API_BASE_URL}api/auth/refresh`, {
                        token: refreshToken
                    });

                    const { accessToken, refreshToken: newRefreshToken } = response.data;

                    localStorage.setItem("access_token", accessToken);
                    if (newRefreshToken) {
                        localStorage.setItem("refresh_token", newRefreshToken);
                    }
                    originalRequest.headers.Authorization = `Bearer ${accessToken}`;

                    processQueue(null, accessToken);
                    return api(originalRequest);

                } catch (refreshError) {
                    processQueue(refreshError, null);
                    console.error("Session expired. Logging out.");
                    localStorage.clear();

                    if (window.location.pathname !== "/login") {
                        window.location.href = "/login";
                    }
                    return Promise.reject(refreshError);
                } finally {
                    isRefreshing = false;
                }
            }
        }

        return Promise.reject(error);
    }
);

export default api;