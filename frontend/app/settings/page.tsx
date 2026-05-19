"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Shield, ShieldCheck } from "lucide-react";
import { useAuthStore } from "@/store/auth";
import Sidebar from "@/components/Sidebar";
import api from "@/lib/axios";
import { toast } from "sonner";

export default function SettingsPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load current 2FA state from the me endpoint (we store it there)
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

  return (
    <div className="flex min-h-screen bg-cream-bg font-sans">
      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0">
        <header className="bg-white border-b border-cream-warm px-4 md:px-8 h-14 md:h-16 flex items-center shrink-0">
          <h1 className="text-xl md:text-2xl font-extrabold text-brown-dark">Settings</h1>
        </header>

        <div className="p-4 md:p-8 max-w-lg">
          <div className="bg-white rounded-3xl border border-cream-warm shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-cream-warm">
              <h2 className="text-sm font-bold text-brown-dark uppercase tracking-widest">
                Security
              </h2>
            </div>

            <div className="px-6 py-5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {is2FAEnabled
                  ? <ShieldCheck className="w-5 h-5 text-green-dark shrink-0" />
                  : <Shield className="w-5 h-5 text-slate shrink-0" />
                }
                <div>
                  <p className="text-sm font-bold text-brown-dark">
                    Two-Factor Authentication
                  </p>
                  <p className="text-xs text-slate mt-0.5">
                    {is2FAEnabled
                      ? "A code will be emailed to you each time you log in."
                      : "Add an extra layer of security to your account."}
                  </p>
                </div>
              </div>

              <button
                onClick={toggle2FA}
                disabled={isToggling || isLoading}
                className={`relative w-11 h-6 rounded-full transition-colors duration-200 shrink-0 disabled:opacity-50 ${
                  is2FAEnabled ? "bg-green-dark" : "bg-cream-warm border border-brown-muted/30"
                }`}
              >
                <span
                  className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                    is2FAEnabled ? "translate-x-5" : "translate-x-0.5"
                  }`}
                />
              </button>
            </div>

            {is2FAEnabled && (
              <div className="mx-6 mb-5 px-4 py-3 bg-card-sage rounded-xl">
                <p className="text-xs text-green-dark font-medium">
                  2FA is active. Next time you log in, check your email for a 6-digit code.
                </p>
              </div>
            )}
          </div>

          <div className="mt-6 bg-white rounded-3xl border border-cream-warm shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-cream-warm">
              <h2 className="text-sm font-bold text-brown-dark uppercase tracking-widest">
                Account
              </h2>
            </div>
            <div className="px-6 py-5 flex flex-col gap-1.5">
              <div>
                <p className="text-xs font-semibold text-slate uppercase tracking-widest mb-1">Name</p>
                <p className="text-sm font-bold text-brown-dark">
                  {user ? `${user.firstName} ${user.lastName}` : "—"}
                </p>
              </div>
              <div className="mt-3">
                <p className="text-xs font-semibold text-slate uppercase tracking-widest mb-1">Email</p>
                <p className="text-sm font-bold text-brown-dark">{user?.email ?? "—"}</p>
              </div>
              <div className="mt-3">
                <p className="text-xs font-semibold text-slate uppercase tracking-widest mb-1">Role</p>
                <p className="text-sm font-bold text-brown-dark">{user?.role ?? "—"}</p>
              </div>
            </div>
          </div>

          <div className="mt-6 bg-white rounded-3xl border border-cream-warm shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-cream-warm">
              <h2 className="text-sm font-bold text-brown-dark uppercase tracking-widest">
                Password
              </h2>
            </div>
            <div className="px-6 py-5">
              <p className="text-xs text-slate mb-4">
                Use the forgot password flow to set a new password.
              </p>
              <a
                href="/forgot-password"
                className="inline-flex items-center px-5 py-2.5 rounded-full border border-cream-warm text-sm font-bold text-brown-dark hover:bg-cream-bg transition-colors no-underline"
              >
                Change password
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
