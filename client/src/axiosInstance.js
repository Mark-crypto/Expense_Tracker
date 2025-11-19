import axios from "axios";

const axiosInstance = axios.create({
  baseURL: "http://localhost:5050/api",
  withCredentials: true,
});

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

axiosInstance.interceptors.request.use(
  (config) => {
    if (config.public) {
      return config;
    }

    config.headers = config.headers || {};
    return config;
  },
  (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (originalRequest.public || originalRequest._retry) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => axiosInstance(originalRequest))
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        await axiosInstance.post(
          "/auth/refresh",
          {},
          {
            withCredentials: true,
            public: true,
          }
        );

        isRefreshing = false;
        processQueue(null);
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        isRefreshing = false;
        processQueue(refreshError);

        if (typeof window !== "undefined") {
          window.location.href = "/401";
        }
        return Promise.reject(refreshError);
      }
    }

    if (error.response?.status === 403) {
      if (typeof window !== "undefined") {
        window.location.href = "/403";
      }
      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);

export const publicAxios = axios.create({
  baseURL: "http://localhost:5050/api",
  withCredentials: true,
});

publicAxios.interceptors.request.use((config) => {
  config.public = true;
  return config;
});

export default axiosInstance;
