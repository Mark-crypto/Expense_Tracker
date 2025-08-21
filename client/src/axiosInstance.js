import axios from "axios";

const axiosInstance = axios.create({
  baseURL: "http://localhost:5050/api",
  withCredentials: true,
});

// State for token refresh management
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Request interceptor to add auth headers if needed
axiosInstance.interceptors.request.use(
  (config) => {
    // Skip auth for public endpoints (you can define this per request)
    if (config.public) {
      return config;
    }

    // Add any additional headers if needed
    config.headers = config.headers || {};
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Skip interception for public routes or already retried requests
    if (originalRequest.public || originalRequest._retry) {
      return Promise.reject(error);
    }

    // Handle 401 - Unauthorized (token expired/invalid)
    if (error.response?.status === 401) {
      if (isRefreshing) {
        // Queue the request while token is being refreshed
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => axiosInstance(originalRequest))
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Attempt to refresh token
        await axiosInstance.post(
          "/auth/refresh",
          {},
          {
            withCredentials: true,
            public: true, // Mark refresh endpoint as public if needed
          }
        );

        isRefreshing = false;
        processQueue(null);
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        isRefreshing = false;
        processQueue(refreshError);

        // Redirect to unauthorized page
        if (typeof window !== "undefined") {
          window.location.href = "/401";
        }
        return Promise.reject(refreshError);
      }
    }

    // Handle 403 - Forbidden (insufficient permissions)
    if (error.response?.status === 403) {
      if (typeof window !== "undefined") {
        // Redirect to forbidden page or show appropriate message
        window.location.href = "/403";
      }
      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);

// Helper for public endpoints
export const publicAxios = axios.create({
  baseURL: "http://localhost:5050/api",
  withCredentials: true,
});

// Mark public requests
publicAxios.interceptors.request.use((config) => {
  config.public = true;
  return config;
});

export default axiosInstance;
