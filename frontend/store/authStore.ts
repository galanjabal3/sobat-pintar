import { create } from "zustand";
import { persist } from "zustand/middleware";
import api from "@/lib/api";

interface User {
  id: string;
  name: string;
  email: string;
  level: string;
  points: number;
  streak: number;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
  fetchProfile: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      setAuth: (user, accessToken, refreshToken) => {
        if (typeof window !== "undefined") {
          localStorage.setItem("access_token", accessToken);
          localStorage.setItem("refresh_token", refreshToken);
        }
        set({ user, accessToken, refreshToken });
      },
      logout: () => {
        if (typeof window !== "undefined") {
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
        }
        set({ user: null, accessToken: null, refreshToken: null });
      },
      updateUser: (user) => set((state) => ({ 
        user: state.user ? { ...state.user, ...user } : null 
      })),
      fetchProfile: async () => {
        try {
          const res = await api.get("/user/profile");
          set({ user: res.data });
        } catch (err) {
          console.error("Failed to fetch profile:", err);
        }
      },
    }),
    {
      name: "auth-storage",
    }
  )
);
