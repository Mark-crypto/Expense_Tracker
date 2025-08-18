import axios from "axios";

const axiosInstance = axios.create({
  baseURL: "http://localhost:5050/api",
  withCredentials: true,
});

axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        await axios.post(
          "http://localhost:5000/api/auth/refresh",
          {},
          { withCredentials: true }
        );
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        window.location.href = "/401";
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;

/*
import axios from "axios";

const axiosInstance = axios.create({
  baseURL: "http://localhost:5050/api",
  withCredentials: true,
});

// Add request interceptor to flag auth-required requests
axiosInstance.interceptors.request.use((config) => {
  config._requiresAuth = !config.public; // Mark if route requires auth
  return config;
});

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Skip interception for public routes
    if (!originalRequest._requiresAuth) {
      return Promise.reject(error);
    }

    // Handle 401 errors
    if (error.response?.status === 401) {
      if (!originalRequest._retry) {
        originalRequest._retry = true;
        try {
          await axiosInstance.post("/auth/refresh", {}, { withCredentials: true });
          return axiosInstance(originalRequest);
        } catch (refreshError) {
          // Redirect on refresh failure
          window.location.href = "/401";
          return Promise.reject(refreshError);
        }
      } else {
        // Already tried refresh - redirect immediately
        window.location.href = "/401";
      }
    }
    
    return Promise.reject(error);
  }
);

// Helper for public endpoints
export const publicAxios = axios.create({
  baseURL: "http://localhost:5050/api",
  withCredentials: true,
});
publicAxios.defaults.public = true;

export default axiosInstance;
*/
