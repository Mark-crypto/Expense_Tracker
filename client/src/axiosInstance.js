import axios from "axios";
import { requestPin } from "@/lib/pin";
import { endSession } from "@/lib/session";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5050/api";

const axiosInstance = axios.create({
  baseURL: API_URL,
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

    // Behind the PIN: ask for it, then send the same request again. The server only uses 423
    // for this, which also covers downloads, whose error body arrives as a file.
    if (error.response?.status === 423 && !originalRequest._pinRetry) {
      try {
        await requestPin();
      } catch {
        return Promise.reject(error);
      }
      originalRequest._pinRetry = true;
      return axiosInstance(originalRequest);
    }

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

        // The sign-in ran out or was left idle: back to the login page, saying why.
        if (typeof window !== "undefined") endSession(refreshError.response?.data?.reason === "idle" ? "idle" : "expired");
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
  baseURL: API_URL,
  withCredentials: true,
});

publicAxios.interceptors.request.use((config) => {
  config.public = true;
  return config;
});

export default axiosInstance;
