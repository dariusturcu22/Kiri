"use client";

import { useEffect } from "react";
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

  useEffect(() => {
    fetchUsers();

    const conn = getChatConnection();

    conn.on("MessageReceived", (message: ChatMessage) => {
      onMessageReceived(message);
    });

    conn.onreconnected(() => setConnected(true));
    conn.onclose(() => setConnected(false));

    startChatConnection()
      .then(() => setConnected(true))
      .catch(() => setConnected(false));

    return () => {
      conn.off("MessageReceived");
      stopChatConnection();
    };
  }, [fetchUsers, onMessageReceived, setConnected]);

  const selectedUser = users.find((u) => u.id === selectedUserId);

  return (
    <div className="flex min-h-screen bg-[#FAF7F2] font-sans">
      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-[#EDE8DF] px-8 h-16 flex items-center shrink-0">
          <h1 className="text-2xl font-extrabold text-[#1E1208]">Chat</h1>
        </header>

        <div className="flex flex-1 overflow-hidden">
          <aside className="w-72 border-r border-[#EDE8DF] bg-white flex flex-col">
            <div className="px-5 py-4 border-b border-[#EDE8DF]">
              <p className="text-xs font-bold text-[#6B7E94] uppercase tracking-widest">
                Conversations
              </p>
            </div>

            <div className="flex-1 overflow-y-auto">
              {users.length === 0 ? (
                <p className="text-sm text-[#6B7E94] px-5 py-4">No other users yet.</p>
              ) : (
                users.map((user) => {
                  const initials = `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
                  const isSelected = user.id === selectedUserId;

                  return (
                    <button
                      key={user.id}
                      onClick={() => selectUser(user.id)}
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

          <div className="flex-1">
            {selectedUser && currentUser ? (
              <ChatWindow
                currentUser={currentUser}
                selectedUser={selectedUser}
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <p className="text-[#6B7E94] text-sm font-medium">
                    Select a conversation to start chatting
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
