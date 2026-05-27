import axios from "axios";

// The browser calls the Render backend directly — no Vercel proxy.
// This sidesteps all cookie-forwarding / same-site / proxy-domain issues.
//
// In production: NEXT_PUBLIC_BACKEND_URL must be set to
//   https://kiri-fd5j.onrender.com   in the Vercel dashboard.
// In local dev:  .env.local has NEXT_PUBLIC_BACKEND_URL=http://localhost:5046
//
// Fallback (when env var is missing in production) — Render's own URL.
const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ?? "https://kiri-fd5j.onrender.com";

const api = axios.create({
  baseURL: BACKEND_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Attach the JWT (stored in localStorage after login) as Authorization: Bearer
// on every outgoing request so the backend can authenticate the caller even
// when cookies are blocked or stripped by cross-domain restrictions.
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("kiri_token");
    if (token) {
      config.headers.set("Authorization", `Bearer ${token}`);
    }
  }
  return config;
});

export default api;
