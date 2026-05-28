import { create } from "zustand";
import { persist } from "zustand/middleware";
import api from "@/lib/api";

interface User {
  id: string;
  name: string;
  email: string;
  level: string;
  email_verified?: boolean;
  avatar_url?: string | null;
  avatar_public_id?: string | null;
  points: number;
  streak: number;
}

interface AuthState {
  user: User | null;
  setAuth: (user: User) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
  fetchProfile: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      setAuth: (user) => {
        if (typeof window !== "undefined") {
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
        }
        set({ user });
      },
      logout: () => {
        if (typeof window !== "undefined") {
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
        }
        set({ user: null });
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
      partialize: (state) => ({ user: state.user }),
    }
  )
);
