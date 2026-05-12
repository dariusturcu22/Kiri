import { create } from "zustand";
import api from "@/lib/axios";

export type AuthUser = {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
};

type AuthStore = {
  user: AuthUser | null;
  isLoading: boolean;
  fetchMe: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
};

export type RegisterData = {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  role: string;
};

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isLoading: true,

  fetchMe: async () => {
    try {
      const response = await api.get<AuthUser>("/api/auth/me");
      set({ user: response.data, isLoading: false });
    } catch {
      set({ user: null, isLoading: false });
    }
  },

  login: async (email, password) => {
    const response = await api.post<AuthUser>("/api/auth/login", {
      email,
      password,
    });
    set({ user: response.data });
  },

  register: async (data) => {
    const response = await api.post<AuthUser>("/api/auth/register", data);
    set({ user: response.data });
  },

  logout: async () => {
    await api.post("/api/auth/logout");
    set({ user: null });
  },
}));
