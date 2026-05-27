"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import api from "@/lib/axios";

type ExchangeResponse = {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  token: string;
};

function persistToken(token: string, expiryHours = 2) {
  if (typeof window === "undefined") return;
  localStorage.setItem("kiri_token", token);
  const expires = new Date(Date.now() + expiryHours * 60 * 60 * 1000).toUTCString();
  document.cookie = `kiri_token=${token}; path=/; SameSite=Lax; expires=${expires}`;
}

function CallbackHandler() {
  const searchParams = useSearchParams();
  const exchange = searchParams.get("exchange");

  useEffect(() => {
    if (!exchange) {
      window.location.href = "/auth";
      return;
    }

    api
      .get<ExchangeResponse>(`/api/auth/exchange-code?exchange=${encodeURIComponent(exchange)}`)
      .then((res) => {
        // Store the token so the axios interceptor can attach it on the
        // next page load (the fetchMe() call in AuthProvider).
        if (res.data?.token) {
          persistToken(res.data.token);
        }
        window.location.href = "/properties";
      })
      .catch(() => {
        window.location.href = "/auth";
      });
  }, [exchange]);

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center">
      <p className="text-sm text-[#6B7E94]">Signing you in...</p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center">
          <p className="text-sm text-[#6B7E94]">Loading...</p>
        </div>
      }
    >
      <CallbackHandler />
    </Suspense>
  );
}
