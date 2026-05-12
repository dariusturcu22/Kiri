import { create } from "zustand";
import api from "@/lib/axios";

export type ActionLog = {
  id: number;
  userId: number;
  userRole: string;
  actionType: string;
  actionDetails: string;
  timestamp: string;
  ipAddress: string;
  success: boolean;
};

export type SuspiciousUser = {
  id: number;
  userId: number;
  userEmail: string;
  userRole: string;
  detectionReason: string;
  detectedAt: string;
  isResolved: boolean;
  resolvedAt: string | null;
};

type LogsResponse = {
  logs: ActionLog[];
  total: number;
  page: number;
  pageSize: number;
};

type AdminStore = {
  logs: ActionLog[];
  totalLogs: number;
  currentPage: number;
  suspiciousUsers: SuspiciousUser[];
  isLoadingLogs: boolean;
  isLoadingSuspicious: boolean;
  fetchLogs: (page?: number) => Promise<void>;
  fetchSuspiciousUsers: () => Promise<void>;
  resolveUser: (id: number) => Promise<void>;
};

export const useAdminStore = create<AdminStore>((set, get) => ({
  logs: [],
  totalLogs: 0,
  currentPage: 1,
  suspiciousUsers: [],
  isLoadingLogs: false,
  isLoadingSuspicious: false,

  fetchLogs: async (page = 1) => {
    set({ isLoadingLogs: true });
    try {
      const response = await api.get<LogsResponse>(`/api/admin/logs?page=${page}&pageSize=50`);
      set({
        logs: response.data.logs,
        totalLogs: response.data.total,
        currentPage: page,
      });
    } finally {
      set({ isLoadingLogs: false });
    }
  },

  fetchSuspiciousUsers: async () => {
    set({ isLoadingSuspicious: true });
    try {
      const response = await api.get<SuspiciousUser[]>("/api/admin/suspicious-users");
      set({ suspiciousUsers: response.data });
    } finally {
      set({ isLoadingSuspicious: false });
    }
  },

  resolveUser: async (id) => {
    await api.put(`/api/admin/suspicious-users/${id}/resolve`);
    set((state) => ({
      suspiciousUsers: state.suspiciousUsers.map((u) =>
        u.id === id ? { ...u, isResolved: true, resolvedAt: new Date().toISOString() } : u
      ),
    }));
  },
}));
