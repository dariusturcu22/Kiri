import { create } from "zustand";
import api from "@/lib/axios";

export type AuthUser = {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
};

// Backend includes the JWT token in login/register responses so the frontend
// can set the cookie client-side. This is a fallback for mobile Chrome, which
// silently drops server-side Set-Cookie headers when the TLS cert is untrusted.
type AuthResponse = AuthUser & { token?: string };

function setClientCookie(token: string, expiryHours = 2) {
  const expires = new Date(Date.now() + expiryHours * 60 * 60 * 1000).toUTCString();
  document.cookie = `kiri_token=${token}; path=/; SameSite=Lax; expires=${expires}`;
}

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
    const response = await api.post<AuthResponse>("/api/auth/login", {
      email,
      password,
    });
    const { token, ...userData } = response.data;
    if (token) setClientCookie(token);
    set({ user: userData as AuthUser });
  },

  register: async (data) => {
    const response = await api.post<AuthResponse>("/api/auth/register", data);
    const { token, ...userData } = response.data;
    if (token) setClientCookie(token);
    set({ user: userData as AuthUser });
  },

  logout: async () => {
    await api.post("/api/auth/logout");
    document.cookie = "kiri_token=; path=/; max-age=0";
    set({ user: null });
  },
}));
