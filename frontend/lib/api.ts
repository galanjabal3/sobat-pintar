import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    // Jika respon menggunakan format BaseResponse { success, message, data }
    // kita kembalikan field data-nya saja agar kompatibel dengan kode frontend lama
    if (response.data && response.data.success === true && response.data.data !== undefined) {
      return { ...response, data: response.data.data };
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = typeof window !== "undefined" ? localStorage.getItem("refresh_token") : null;

      if (refreshToken) {
        try {
          const response = await axios.post(`${API_URL}/auth/refresh`, {
            refresh_token: refreshToken,
          });

          // response.data is the BaseResponse from backend
          const { access_token } = response.data.data;
          
          if (typeof window !== "undefined") {
            localStorage.setItem("access_token", access_token);
          }

          // Update authStore agar state tetap sinkron
          const { useAuthStore } = await import("@/store/authStore");
          const currentState = useAuthStore.getState();
          if (currentState.user) {
            currentState.setAuth(currentState.user, access_token, refreshToken);
          }

          api.defaults.headers.common["Authorization"] = `Bearer ${access_token}`;
          originalRequest.headers["Authorization"] = `Bearer ${access_token}`;
          return api(originalRequest);
        } catch (refreshError) {
          // Refresh gagal, logout
          const { useAuthStore } = await import("@/store/authStore");
          useAuthStore.getState().logout();
          if (typeof window !== "undefined") {
            window.location.href = "/login";
          }
        }
      } else {
        // Tidak ada refresh token, langsung logout
        const { useAuthStore } = await import("@/store/authStore");
        useAuthStore.getState().logout();
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
      }
    }

    return Promise.reject(error);
  }
);

export default api;
