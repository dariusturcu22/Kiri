"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import api from "@/lib/axios";

function CallbackHandler() {
  const searchParams = useSearchParams();
  const exchange = searchParams.get("exchange");

  useEffect(() => {
    if (!exchange) {
      window.location.href = "/auth";
      return;
    }

    api
      .get(`/api/auth/exchange-code?exchange=${encodeURIComponent(exchange)}`)
      .then(() => {
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
