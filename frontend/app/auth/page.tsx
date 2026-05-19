"use client";

import { useState, useEffect } from "react";
import { Eye, EyeOff, KeyRound, House } from "lucide-react";
import { useAuthStore } from "@/store/auth";
import { toast } from "sonner";

type Tab = "login" | "register";
type Role = "Landlord" | "Tenant";
type Step = "form" | "2fa";

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:5046";

export default function AuthPage() {
  const { login, verify2FA, register } = useAuthStore();

  const [activeTab, setActiveTab] = useState<Tab>("login");
  const [step, setStep] = useState<Step>("form");
  const [twoFactorEmail, setTwoFactorEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role>("Landlord");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [registerForm, setRegisterForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setFieldErrors({});
    try {
      const result = await login(loginForm.email, loginForm.password);
      if (result.requires2FA) {
        setTwoFactorEmail(result.email);
        setStep("2fa");
      } else {
        window.location.href = "/properties";
      }
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 401) {
        setFieldErrors({ password: "Invalid email or password." });
      } else {
        toast.error(`Login failed (${status ?? "network error"}). Check console.`);
        console.error("Login error:", err);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleVerify2FA(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setFieldErrors({});
    try {
      await verify2FA(twoFactorEmail, otpCode);
      window.location.href = "/properties";
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 401 || status === 400) {
        setFieldErrors({ otp: "Invalid or expired code. Please try again." });
      } else {
        toast.error("Verification failed. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setFieldErrors({});

    const errors: Record<string, string> = {};

    if (registerForm.password.length < 8)
      errors.password = "Password must be at least 8 characters.";

    if (!/\d/.test(registerForm.password) || !/[^a-zA-Z0-9]/.test(registerForm.password))
      errors.password = "Password must contain at least 1 digit and 1 special character.";

    if (registerForm.password !== registerForm.confirmPassword)
      errors.confirmPassword = "Passwords do not match.";

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setIsSubmitting(false);
      return;
    }

    try {
      await register({ ...registerForm, role: selectedRole });
      window.location.href = "/properties";
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Registration failed. Please try again.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!mounted) {
    return <div className="min-h-screen bg-[#FAF7F2]" />;
  }

  // 2FA step
  if (step === "2fa") {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-sm flex flex-col items-center gap-8">
          <a href="/" className="flex items-center gap-2 no-underline">
            <span className="text-2xl font-extrabold text-[#1E1208]">Kiri</span>
            <img src="/logo.png" alt="Kiri" className="w-6 h-6" />
          </a>

          <div className="w-full flex flex-col gap-2 text-center">
            <h2 className="text-xl font-bold text-[#1E1208]">Two-Factor Authentication</h2>
            <p className="text-sm text-[#6B7E94]">
              A 6-digit code was sent to <span className="font-medium text-[#1E1208]">{twoFactorEmail}</span>
            </p>
          </div>

          <form onSubmit={handleVerify2FA} className="w-full flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[#1E1208]">Verification Code</label>
              <input
                type="text"
                inputMode="numeric"
                placeholder="123456"
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                required
                className="w-full px-5 py-3 rounded-full border border-[#E8E0D5] bg-white text-sm text-[#1E1208] placeholder:text-[#B8B0A8] focus:outline-none focus:ring-2 focus:ring-[#3A5230]/20 text-center tracking-widest text-lg"
              />
              {fieldErrors.otp && (
                <p className="text-xs text-[#7A4F3A] pl-2">{fieldErrors.otp}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting || otpCode.length < 6}
              className="w-full py-3.5 bg-[#3A5230] hover:bg-[#2d4025] text-white text-sm font-bold rounded-full transition-colors disabled:opacity-60"
            >
              {isSubmitting ? "Verifying..." : "Verify Code"}
            </button>

            <button
              type="button"
              onClick={() => { setStep("form"); setOtpCode(""); setFieldErrors({}); }}
              className="text-sm text-[#6B7E94] font-medium text-center"
            >
              Back to login
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm flex flex-col items-center gap-8">
        <a href="/" className="flex items-center gap-2 no-underline">
          <span className="text-2xl font-extrabold text-[#1E1208]">Kiri</span>
          <img src="/logo.png" alt="Kiri" className="w-6 h-6" />
        </a>

        <div className="w-full bg-[#EDE8DF] p-1 rounded-full flex">
          <button
            onClick={() => { setActiveTab("login"); setFieldErrors({}); }}
            className={`flex-1 py-2.5 text-sm font-bold rounded-full transition-all ${
              activeTab === "login"
                ? "bg-[#1E1208] text-white"
                : "text-[#6B7E94]"
            }`}
          >
            Login
          </button>
          <button
            onClick={() => { setActiveTab("register"); setFieldErrors({}); }}
            className={`flex-1 py-2.5 text-sm font-bold rounded-full transition-all ${
              activeTab === "register"
                ? "bg-[#1E1208] text-white"
                : "text-[#6B7E94]"
            }`}
          >
            Register
          </button>
        </div>

        {activeTab === "login" ? (
          <form onSubmit={handleLogin} className="w-full flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[#1E1208]">Email</label>
              <input
                type="email"
                placeholder="your@email.com"
                value={loginForm.email}
                onChange={(e) => setLoginForm((f) => ({ ...f, email: e.target.value }))}
                required
                className="w-full px-5 py-3 rounded-full border border-[#E8E0D5] bg-white text-sm text-[#1E1208] placeholder:text-[#B8B0A8] focus:outline-none focus:ring-2 focus:ring-[#3A5230]/20"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[#1E1208]">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm((f) => ({ ...f, password: e.target.value }))}
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
              {fieldErrors.password && (
                <p className="text-xs text-[#7A4F3A] pl-2">{fieldErrors.password}</p>
              )}
            </div>

            <a
              href="/forgot-password"
              className="self-end text-xs text-[#7A4F3A] font-medium no-underline"
            >
              Forgot password?
            </a>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 bg-[#3A5230] hover:bg-[#2d4025] text-white text-sm font-bold rounded-full transition-colors disabled:opacity-60"
            >
              {isSubmitting ? "Signing in..." : "Sign In"}
            </button>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-[#E8E0D5]" />
              <span className="text-xs text-[#6B7E94]">or</span>
              <div className="flex-1 h-px bg-[#E8E0D5]" />
            </div>

            <button
              type="button"
              onClick={() => { window.location.href = `${BACKEND_URL}/api/auth/google`; }}
              className="w-full py-3 flex items-center justify-center gap-3 border border-[#E8E0D5] bg-white rounded-full text-sm font-medium text-[#1E1208] hover:bg-[#FAF7F2] transition-colors"
            >
              <GoogleIcon />
              Continue with Google
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="w-full flex flex-col gap-5">
            <div className="flex gap-3">
              <div className="flex flex-col gap-1.5 flex-1">
                <label className="text-sm font-medium text-[#1E1208]">First Name</label>
                <input
                  type="text"
                  placeholder="Ion"
                  value={registerForm.firstName}
                  onChange={(e) => setRegisterForm((f) => ({ ...f, firstName: e.target.value }))}
                  required
                  className="w-full px-5 py-3 rounded-full border border-[#E8E0D5] bg-white text-sm text-[#1E1208] placeholder:text-[#B8B0A8] focus:outline-none focus:ring-2 focus:ring-[#3A5230]/20"
                />
              </div>
              <div className="flex flex-col gap-1.5 flex-1">
                <label className="text-sm font-medium text-[#1E1208]">Last Name</label>
                <input
                  type="text"
                  placeholder="Popescu"
                  value={registerForm.lastName}
                  onChange={(e) => setRegisterForm((f) => ({ ...f, lastName: e.target.value }))}
                  required
                  className="w-full px-5 py-3 rounded-full border border-[#E8E0D5] bg-white text-sm text-[#1E1208] placeholder:text-[#B8B0A8] focus:outline-none focus:ring-2 focus:ring-[#3A5230]/20"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[#1E1208]">Email</label>
              <input
                type="email"
                placeholder="your@email.com"
                value={registerForm.email}
                onChange={(e) => setRegisterForm((f) => ({ ...f, email: e.target.value }))}
                required
                className="w-full px-5 py-3 rounded-full border border-[#E8E0D5] bg-white text-sm text-[#1E1208] placeholder:text-[#B8B0A8] focus:outline-none focus:ring-2 focus:ring-[#3A5230]/20"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[#1E1208]">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={registerForm.password}
                  onChange={(e) => setRegisterForm((f) => ({ ...f, password: e.target.value }))}
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
                <p className="text-xs text-[#6B7E94]">The password must be at least 8 characters long</p>
                <p className="text-xs text-[#6B7E94]">The password must contain at least 1 digit and 1 special character</p>
              </div>
              {fieldErrors.password && (
                <p className="text-xs text-[#7A4F3A] pl-2">{fieldErrors.password}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[#1E1208]">Confirm Password</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={registerForm.confirmPassword}
                  onChange={(e) => setRegisterForm((f) => ({ ...f, confirmPassword: e.target.value }))}
                  required
                  className="w-full px-5 py-3 pr-12 rounded-full border border-[#E8E0D5] bg-white text-sm text-[#1E1208] placeholder:text-[#B8B0A8] focus:outline-none focus:ring-2 focus:ring-[#3A5230]/20"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6B7E94]"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {fieldErrors.confirmPassword && (
                <p className="text-xs text-[#7A4F3A] pl-2">{fieldErrors.confirmPassword}</p>
              )}
            </div>

            <div className="flex flex-col gap-3">
              <label className="text-sm font-medium text-[#1E1208]">I am a...</label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedRole("Landlord")}
                  className={`flex-1 flex flex-col items-center gap-2 py-4 rounded-2xl border-2 transition-all ${
                    selectedRole === "Landlord"
                      ? "border-[#3A5230] bg-[#3A5230]/5"
                      : "border-[#E8E0D5] bg-white"
                  }`}
                >
                  <KeyRound className="w-5 h-5 text-[#1E1208]" />
                  <span className="text-sm font-medium text-[#1E1208]">Landlord</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedRole("Tenant")}
                  className={`flex-1 flex flex-col items-center gap-2 py-4 rounded-2xl border-2 transition-all ${
                    selectedRole === "Tenant"
                      ? "border-[#3A5230] bg-[#3A5230]/5"
                      : "border-[#E8E0D5] bg-white"
                  }`}
                >
                  <House className="w-5 h-5 text-[#1E1208]" />
                  <span className="text-sm font-medium text-[#1E1208]">Tenant</span>
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 bg-[#3A5230] hover:bg-[#2d4025] text-white text-sm font-bold rounded-full transition-colors disabled:opacity-60"
            >
              {isSubmitting ? "Creating account..." : "Create Account"}
            </button>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-[#E8E0D5]" />
              <span className="text-xs text-[#6B7E94]">or</span>
              <div className="flex-1 h-px bg-[#E8E0D5]" />
            </div>

            <button
              type="button"
              onClick={() => { window.location.href = `${BACKEND_URL}/api/auth/google`; }}
              className="w-full py-3 flex items-center justify-center gap-3 border border-[#E8E0D5] bg-white rounded-full text-sm font-medium text-[#1E1208] hover:bg-[#FAF7F2] transition-colors"
            >
              <GoogleIcon />
              Continue with Google
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
