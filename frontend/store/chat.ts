import { create } from "zustand";
import api from "@/lib/axios";
import { getChatConnection } from "@/lib/signalr";
import type { AuthUser } from "@/store/auth";

export type ChatMessage = {
  id: string;
  senderId: number;
  senderName: string;
  receiverId: number;
  content: string;
  sentAt: string;
  isRead: boolean;
};

type ChatStore = {
  messages: ChatMessage[];
  users: AuthUser[];
  selectedUserId: number | null;
  isConnected: boolean;
  fetchUsers: () => Promise<void>;
  loadHistory: (otherUserId: number) => Promise<void>;
  sendMessage: (receiverId: number, content: string) => Promise<void>;
  selectUser: (userId: number) => void;
  onMessageReceived: (message: ChatMessage) => void;
  setConnected: (connected: boolean) => void;
};

export const useChatStore = create<ChatStore>((set, get) => ({
  messages: [],
  users: [],
  selectedUserId: null,
  isConnected: false,

  fetchUsers: async () => {
    try {
      const response = await api.get<AuthUser[]>("/api/auth/users");
      set({ users: response.data });
    } catch {}
  },

  loadHistory: async (otherUserId) => {
    try {
      const response = await api.get<ChatMessage[]>(`/api/chat/history/${otherUserId}`);
      set({ messages: response.data });
    } catch {}
  },

  sendMessage: async (receiverId, content) => {
    const connection = getChatConnection();
    await connection.invoke("SendMessage", receiverId, content);
  },

  selectUser: (userId) => {
    set({ selectedUserId: userId, messages: [] });
    get().loadHistory(userId);
  },

  onMessageReceived: (message) => {
    const { selectedUserId } = get();
    const isRelevant =
      message.senderId === selectedUserId || message.receiverId === selectedUserId;

    if (isRelevant) {
      set((state) => ({ messages: [...state.messages, message] }));
    }
  },

  setConnected: (connected) => set({ isConnected: connected }),
}));
