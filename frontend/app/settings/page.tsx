"use client";

import { useState, useEffect } from "react";
import { Shield, ShieldCheck, User, KeyRound } from "lucide-react";
import { useAuthStore } from "@/store/auth";
import Sidebar from "@/components/Sidebar";
import api from "@/lib/axios";
import { toast } from "sonner";

export default function SettingsPage() {
  const user = useAuthStore((s) => s.user);

  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api.get<{ is2FAEnabled?: boolean }>("/api/auth/me")
      .then((res) => setIs2FAEnabled(res.data.is2FAEnabled ?? false))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  async function toggle2FA() {
    setIsToggling(true);
    try {
      const next = !is2FAEnabled;
      await api.post("/api/auth/toggle-2fa", { enable: next });
      setIs2FAEnabled(next);
      toast.success(next ? "Two-factor authentication enabled." : "Two-factor authentication disabled.");
    } catch {
      toast.error("Failed to update 2FA setting.");
    } finally {
      setIsToggling(false);
    }
  }

  const initials = user
    ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    : "?";

  return (
    <div className="flex min-h-screen bg-cream-bg font-sans">
      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0">
        {/* Header */}
        <header className="bg-white border-b border-cream-warm px-4 md:px-8 h-14 md:h-16 flex items-center shrink-0">
          <h1 className="text-xl md:text-2xl font-extrabold text-brown-dark">Settings</h1>
        </header>

        <div className="p-4 md:p-8 flex flex-col gap-6">

          {/* Account info */}
          <div className="bg-white rounded-3xl border border-cream-warm shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-cream-warm flex items-center gap-2">
              <User className="w-4 h-4 text-slate" />
              <h2 className="text-sm font-bold text-brown-dark uppercase tracking-widest">Account</h2>
            </div>
            <div className="px-6 py-6 flex items-center gap-6">
              <div className="w-14 h-14 rounded-full bg-[#3A5230] flex items-center justify-center shrink-0">
                <span className="text-lg font-bold text-white">{initials}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-12 gap-y-4 flex-1">
                <div>
                  <p className="text-xs font-semibold text-slate uppercase tracking-widest mb-1">Name</p>
                  <p className="text-sm font-bold text-brown-dark">
                    {user ? `${user.firstName} ${user.lastName}` : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate uppercase tracking-widest mb-1">Email</p>
                  <p className="text-sm font-bold text-brown-dark">{user?.email ?? "—"}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate uppercase tracking-widest mb-1">Role</p>
                  <span className="inline-block bg-card-sage px-3 py-1 rounded-full text-xs font-bold text-green-dark">
                    {user?.role ?? "—"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Security */}
          <div className="bg-white rounded-3xl border border-cream-warm shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-cream-warm flex items-center gap-2">
              <Shield className="w-4 h-4 text-slate" />
              <h2 className="text-sm font-bold text-brown-dark uppercase tracking-widest">Security</h2>
            </div>

            {/* 2FA row */}
            <div className="px-6 py-5 flex items-center justify-between gap-6 border-b border-cream-bg">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${is2FAEnabled ? "bg-card-sage" : "bg-cream-bg"}`}>
                  {is2FAEnabled
                    ? <ShieldCheck className="w-5 h-5 text-green-dark" />
                    : <Shield className="w-5 h-5 text-slate" />}
                </div>
                <div>
                  <p className="text-sm font-bold text-brown-dark">Two-Factor Authentication</p>
                  <p className="text-xs text-slate mt-0.5">
                    {is2FAEnabled
                      ? "A 6-digit code will be emailed to you on each login."
                      : "Add an extra layer of security to your account."}
                  </p>
                </div>
              </div>

              {/* Toggle */}
              <button
                onClick={toggle2FA}
                disabled={isToggling || isLoading}
                aria-checked={is2FAEnabled}
                role="switch"
                className={`relative inline-flex items-center w-12 h-6 rounded-full transition-colors duration-200 shrink-0 focus:outline-none disabled:opacity-50 ${
                  is2FAEnabled ? "bg-green-dark" : "bg-[#D4CFC8]"
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${
                    is2FAEnabled ? "translate-x-6" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Password row */}
            <div className="px-6 py-5 flex items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-cream-bg flex items-center justify-center shrink-0">
                  <KeyRound className="w-5 h-5 text-slate" />
                </div>
                <div>
                  <p className="text-sm font-bold text-brown-dark">Password</p>
                  <p className="text-xs text-slate mt-0.5">Change your account password via email reset.</p>
                </div>
              </div>
              <a
                href="/forgot-password"
                className="shrink-0 px-5 py-2 rounded-full border border-cream-warm text-sm font-bold text-brown-dark hover:bg-cream-bg transition-colors no-underline"
              >
                Change
              </a>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
