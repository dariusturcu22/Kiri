"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import api from "@/lib/axios";
import { toast } from "sonner";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const email = searchParams.get("email") ?? "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (newPassword.length < 8)
      errors.password = "Password must be at least 8 characters.";
    if (!/\d/.test(newPassword) || !/[^a-zA-Z0-9]/.test(newPassword))
      errors.password = "Password must contain at least 1 digit and 1 special character.";
    if (newPassword !== confirmPassword)
      errors.confirm = "Passwords do not match.";

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setIsSubmitting(true);
    setFieldErrors({});
    try {
      await api.post("/api/auth/reset-password", {
        token,
        newPassword,
        confirmPassword,
      });
      setDone(true);
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 400) {
        toast.error("Reset link is invalid or has expired.");
      } else {
        toast.error("Something went wrong. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!token || !email) {
    return (
      <div className="w-full flex flex-col gap-4 text-center">
        <h2 className="text-xl font-bold text-[#1E1208]">Invalid link</h2>
        <p className="text-sm text-[#6B7E94]">This password reset link is invalid.</p>
        <a href="/forgot-password" className="text-sm font-medium text-[#3A5230] no-underline">
          Request a new link
        </a>
      </div>
    );
  }

  if (done) {
    return (
      <div className="w-full flex flex-col gap-4 text-center">
        <h2 className="text-xl font-bold text-[#1E1208]">Password updated!</h2>
        <p className="text-sm text-[#6B7E94]">Your password has been changed successfully.</p>
        <a href="/auth" className="text-sm font-medium text-[#3A5230] no-underline">
          Sign in
        </a>
      </div>
    );
  }

  return (
    <>
      <div className="w-full flex flex-col gap-2 text-center">
        <h2 className="text-xl font-bold text-[#1E1208]">Reset your password</h2>
        <p className="text-sm text-[#6B7E94]">
          Setting a new password for <span className="font-medium text-[#1E1208]">{email}</span>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="w-full flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-[#1E1208]">New Password</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              className="w-full px-5 py-3 pr-12 rounded-full border border-[#E8E0D5] bg-white text-sm text-[#1E1208] placeholder:text-[#B8B0A8] focus:outline-none focus:ring-2 focus:ring-[#3A5230]/20"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6B7E94]"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <div className="flex flex-col gap-0.5 pl-2">
            <p className="text-xs text-[#6B7E94]">At least 8 characters</p>
            <p className="text-xs text-[#6B7E94]">At least 1 digit and 1 special character</p>
          </div>
          {fieldErrors.password && (
            <p className="text-xs text-[#7A4F3A] pl-2">{fieldErrors.password}</p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-[#1E1208]">Confirm Password</label>
          <div className="relative">
            <input
              type={showConfirm ? "text" : "password"}
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full px-5 py-3 pr-12 rounded-full border border-[#E8E0D5] bg-white text-sm text-[#1E1208] placeholder:text-[#B8B0A8] focus:outline-none focus:ring-2 focus:ring-[#3A5230]/20"
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6B7E94]"
            >
              {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {fieldErrors.confirm && (
            <p className="text-xs text-[#7A4F3A] pl-2">{fieldErrors.confirm}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3.5 bg-[#3A5230] hover:bg-[#2d4025] text-white text-sm font-bold rounded-full transition-colors disabled:opacity-60"
        >
          {isSubmitting ? "Updating..." : "Update Password"}
        </button>
      </form>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-[#FAF7F2] flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm flex flex-col items-center gap-8">
        <a href="/" className="flex items-center gap-2 no-underline">
          <span className="text-2xl font-extrabold text-[#1E1208]">Kiri</span>
          <img src="/logo.png" alt="Kiri" className="w-6 h-6" />
        </a>
        <Suspense fallback={<div className="text-sm text-[#6B7E94]">Loading...</div>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
