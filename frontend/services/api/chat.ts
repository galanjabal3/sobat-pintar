import api from "@/lib/api";

export const chatService = {
  createSession: () => api.post("/chat/sessions"),
  listSessions: () => api.get("/chat/sessions"),
  getSession: (id: string) => api.get(`/chat/sessions/${id}`),
  sendMessage: (id: string, data: any) => api.post(`/chat/sessions/${id}/messages`, data),
  deleteSession: (id: string) => api.delete(`/chat/sessions/${id}`),
};
