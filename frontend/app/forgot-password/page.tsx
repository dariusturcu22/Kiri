"use client";

import { useState } from "react";
import api from "@/lib/axios";
import { toast } from "sonner";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.post("/api/auth/forgot-password", { email });
      setSent(true);
    } catch {
      // Always show success to prevent email enumeration
      setSent(true);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm flex flex-col items-center gap-8">
        <a href="/" className="flex items-center gap-2 no-underline">
          <span className="text-2xl font-extrabold text-[#1E1208]">Kiri</span>
          <img src="/logo.png" alt="Kiri" className="w-6 h-6" />
        </a>

        {sent ? (
          <div className="w-full flex flex-col gap-4 text-center">
            <h2 className="text-xl font-bold text-[#1E1208]">Check your email</h2>
            <p className="text-sm text-[#6B7E94]">
              If an account exists for <span className="font-medium text-[#1E1208]">{email}</span>,
              a password reset link has been sent.
            </p>
            <a
              href="/auth"
              className="mt-2 text-sm font-medium text-[#3A5230] no-underline"
            >
              Back to login
            </a>
          </div>
        ) : (
          <>
            <div className="w-full flex flex-col gap-2 text-center">
              <h2 className="text-xl font-bold text-[#1E1208]">Forgot password?</h2>
              <p className="text-sm text-[#6B7E94]">
                Enter your email and we&apos;ll send you a reset link.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="w-full flex flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-[#1E1208]">Email</label>
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-5 py-3 rounded-full border border-[#E8E0D5] bg-white text-sm text-[#1E1208] placeholder:text-[#B8B0A8] focus:outline-none focus:ring-2 focus:ring-[#3A5230]/20"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 bg-[#3A5230] hover:bg-[#2d4025] text-white text-sm font-bold rounded-full transition-colors disabled:opacity-60"
              >
                {isSubmitting ? "Sending..." : "Send Reset Link"}
              </button>

              <a
                href="/auth"
                className="text-sm text-[#6B7E94] font-medium text-center no-underline"
              >
                Back to login
              </a>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
