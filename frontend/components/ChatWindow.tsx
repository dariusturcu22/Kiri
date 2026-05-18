"use client";

import { useState, useEffect, useRef } from "react";
import { Send } from "lucide-react";
import { useChatStore } from "@/store/chat";
import type { AuthUser } from "@/store/auth";

type Props = {
  currentUser: AuthUser;
  selectedUser: AuthUser;
};

export default function ChatWindow({ currentUser, selectedUser }: Props) {
  const { messages, sendMessage } = useChatStore();
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = draft.trim();
    if (!trimmed || isSending) return;

    setIsSending(true);
    try {
      await sendMessage(selectedUser.id, trimmed);
      setDraft("");
    } finally {
      setIsSending(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(e as unknown as React.FormEvent);
    }
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="px-6 py-4 bg-white border-b border-[#EDE8DF] flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-[#3A5230] flex items-center justify-center shrink-0">
          <span className="text-xs font-bold text-white">
            {selectedUser.firstName[0]}{selectedUser.lastName[0]}
          </span>
        </div>
        <div>
          <p className="text-sm font-bold text-[#1E1208]">
            {selectedUser.firstName} {selectedUser.lastName}
          </p>
          <p className="text-xs text-[#6B7E94]">{selectedUser.role}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-3">
        {messages.length === 0 && (
          <p className="text-sm text-[#6B7E94] text-center mt-10">
            No messages yet. Say hello!
          </p>
        )}

        {messages.map((message) => {
          const isMine = message.senderId === currentUser.id;

          return (
            <div
              key={message.id}
              className={`flex flex-col gap-1 max-w-[70%] ${isMine ? "self-end items-end" : "self-start items-start"}`}
            >
              <div
                className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  isMine
                    ? "bg-[#3A5230] text-white rounded-br-sm"
                    : "bg-white border border-[#EDE8DF] text-[#1E1208] rounded-bl-sm"
                }`}
              >
                {message.content}
              </div>
              <span className="text-[10px] text-[#6B7E94]">
                {new Date(message.sentAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          );
        })}

        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={handleSend}
        className="px-6 py-4 bg-white border-t border-[#EDE8DF] flex items-end gap-3"
      >
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={`Message ${selectedUser.firstName}...`}
          rows={1}
          className="flex-1 resize-none px-4 py-2.5 rounded-2xl border border-[#EDE8DF] bg-[#FAF7F2] text-sm text-[#1E1208] placeholder:text-[#B8B0A8] focus:outline-none focus:ring-2 focus:ring-[#3A5230]/20 max-h-32"
        />
        <button
          type="submit"
          disabled={!draft.trim() || isSending}
          className="w-10 h-10 rounded-full bg-[#3A5230] hover:bg-[#2d4025] flex items-center justify-center transition-colors disabled:opacity-40 shrink-0"
        >
          <Send className="w-4 h-4 text-white" />
        </button>
      </form>
    </div>
  );
}
