import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

let refreshPromise: Promise<void> | null = null;
let isRedirectingToLogin = false;

function isAuthRequest(url?: string): boolean {
  if (!url) return false;

  return url.startsWith("/auth/");
}

async function refreshSession() {
  if (!refreshPromise) {
    refreshPromise = axios
      .post(`${API_URL}/auth/refresh`, undefined, { withCredentials: true })
      .then(() => undefined)
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

async function clearSessionAndRedirect() {
  if (isRedirectingToLogin) return;

  isRedirectingToLogin = true;
  await axios.post(`${API_URL}/auth/logout`, undefined, { withCredentials: true }).catch(() => undefined);
  const { useAuthStore } = await import("@/store/authStore");
  useAuthStore.getState().logout();
  if (typeof window !== "undefined" && window.location.pathname !== "/login") {
    window.location.href = "/login";
  }
}

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

    if (!originalRequest) {
      return Promise.reject(error);
    }

    const shouldSkipRefresh = isAuthRequest(originalRequest?.url);

    if (error.response?.status === 401 && !shouldSkipRefresh && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        await refreshSession();
        return api(originalRequest);
      } catch {
        await clearSessionAndRedirect();
      }
    }

    return Promise.reject(error);
  }
);

export default api;
