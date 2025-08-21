// lib/axios.js
import axios from 'axios';

class AuthManager {
  constructor() {
    this.isRefreshing = false;
    this.failedQueue = [];
    this.axiosInstance = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL,
      withCredentials: true,
    });

    this.setupInterceptors();
  }

  setupInterceptors() {
    // Request interceptor
    this.axiosInstance.interceptors.request.use(
      (config) => {
        const token = this.getToken();
        if (token && !config.public) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error) => this.handleResponseError(error)
    );
  }

  async handleResponseError(error) {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      return this.handleUnauthorizedError(originalRequest);
    }

    if (error.response?.status === 403) {
      this.handleForbiddenError();
      return Promise.reject(error);
    }

    return Promise.reject(error);
  }

  async handleUnauthorizedError(originalRequest) {
    originalRequest._retry = true;

    if (this.isRefreshing) {
      return this.queueRequest(originalRequest);
    }

    this.isRefreshing = true;

    try {
      await this.refreshToken();
      this.isRefreshing = false;
      this.processQueue(null);
      return this.axiosInstance(originalRequest);
    } catch (refreshError) {
      this.isRefreshing = false;
      this.processQueue(refreshError);
      this.redirectToLogin();
      return Promise.reject(refreshError);
    }
  }

  handleForbiddenError() {
    if (typeof window !== 'undefined') {
      window.location.href = '/403';
    }
  }

  queueRequest(originalRequest) {
    return new Promise((resolve, reject) => {
      this.failedQueue.push({ resolve, reject });
    })
      .then(() => this.axiosInstance(originalRequest))
      .catch(err => Promise.reject(err));
  }

  processQueue(error) {
    this.failedQueue.forEach(prom => {
      if (error) {
        prom.reject(error);
      } else {
        prom.resolve();
      }
    });
    this.failedQueue = [];
  }

  async refreshToken() {
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`,
        {},
        { withCredentials: true }
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  redirectToLogin() {
    if (typeof window !== 'undefined') {
      window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
    }
  }

  getToken() {
    // Optional: Get token from cookies or storage if not using httpOnly
    return null;
  }
}

export const authManager = new AuthManager();
export default authManager.axiosInstance;