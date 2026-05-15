import api from "@/lib/api";

export const authService = {
  login: (data: any) => api.post("/auth/login", data),
  register: (data: any) => api.post("/auth/register", data),
  getProfile: () => api.get("/user/profile"),
};
