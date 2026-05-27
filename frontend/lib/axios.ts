import axios from "axios";

const api = axios.create({
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Attach the JWT token (stored in localStorage after login) as a Bearer token
// on every outgoing request.  This is the primary auth mechanism in production
// because the httpOnly cookie set by the Vercel proxy is not always reliably
// forwarded to the Render backend.  The backend's JwtBearer handler first
// checks the kiri_token cookie; if absent it falls through to the
// Authorization header automatically.
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("kiri_token");
    if (token) {
      config.headers = config.headers ?? {};
      config.headers["Authorization"] = `Bearer ${token}`;
    }
  }
  return config;
});

export default api;
