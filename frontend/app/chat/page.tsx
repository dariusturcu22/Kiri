"use client";

import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import ChatWindow from "@/components/ChatWindow";
import { useChatStore } from "@/store/chat";
import { useAuthStore } from "@/store/auth";
import { startChatConnection, stopChatConnection, getChatConnection } from "@/lib/signalr";
import type { ChatMessage } from "@/store/chat";

export default function ChatPage() {
  const { users, selectedUserId, fetchUsers, selectUser, onMessageReceived, setConnected } =
    useChatStore();
  const currentUser = useAuthStore((s) => s.user);
  const [showChat, setShowChat] = useState(false);

  useEffect(() => {
    fetchUsers();
    const conn = getChatConnection();
    conn.on("MessageReceived", (message: ChatMessage) => onMessageReceived(message));
    conn.onreconnected(() => setConnected(true));
    conn.onclose(() => setConnected(false));
    startChatConnection().then(() => setConnected(true)).catch(() => setConnected(false));
    return () => { conn.off("MessageReceived"); stopChatConnection(); };
  }, []);

  const selectedUser = users.find((u) => u.id === selectedUserId);

  function handleSelectUser(id: number) {
    selectUser(id);
    setShowChat(true);
  }

  return (
    <div className="flex min-h-screen bg-[#FAF7F2] font-sans">
      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0 min-h-0">

        {/* Header */}
        <header className="bg-white border-b border-[#EDE8DF] px-4 md:px-8 h-14 md:h-16 flex items-center gap-3 shrink-0">
          {showChat && (
            <button
              className="md:hidden text-[#6B7E94] hover:text-[#1E1208] transition-colors"
              onClick={() => setShowChat(false)}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <h1 className="text-xl md:text-2xl font-extrabold text-[#1E1208]">Chat</h1>
        </header>

        {/* Body — flex row that fills remaining height */}
        <div className="flex flex-1 overflow-hidden">

          {/* Conversation list */}
          <aside
            className={`
              ${showChat ? "hidden" : "flex"} md:flex
              flex-col w-full md:w-72 shrink-0
              border-r border-[#EDE8DF] bg-white
            `}
          >
            <div className="px-5 py-4 border-b border-[#EDE8DF] shrink-0">
              <p className="text-xs font-bold text-[#6B7E94] uppercase tracking-widest">
                Conversations
              </p>
            </div>
            <div className="flex-1 overflow-y-auto">
              {users.length === 0 ? (
                <p className="text-sm text-[#6B7E94] px-5 py-6">No other users yet.</p>
              ) : (
                users.map((user) => {
                  const initials = `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
                  const isSelected = user.id === selectedUserId;
                  return (
                    <button
                      key={user.id}
                      onClick={() => handleSelectUser(user.id)}
                      className={`w-full flex items-center gap-3 px-5 py-4 text-left transition-colors border-b border-[#EDE8DF] ${
                        isSelected
                          ? "bg-[#3A5230]/8 border-l-2 border-l-[#3A5230]"
                          : "hover:bg-[#FAF7F2]"
                      }`}
                    >
                      <div className="w-10 h-10 rounded-full bg-[#3A5230] flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-white">{initials}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[#1E1208] truncate">
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="text-xs text-[#6B7E94]">{user.role}</p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </aside>

          {/* Chat window */}
          <div
            className={`
              ${showChat ? "flex" : "hidden"} md:flex
              flex-1 flex-col min-h-0
            `}
          >
            {selectedUser && currentUser ? (
              <ChatWindow currentUser={currentUser} selectedUser={selectedUser} />
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-[#6B7E94] text-sm font-medium">
                  Select a conversation to start chatting
                </p>
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}
