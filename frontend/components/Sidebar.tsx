"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Home,
  Wrench,
  MessageSquare,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Calendar,
  FileText,
  Zap,
  Settings,
} from "lucide-react";
import { useAuthStore } from "@/store/auth";

const allDesktopNavItems = [
  { label: "Properties", icon: Home, href: "/properties" },
  { label: "Maintenance", icon: Wrench, href: "/maintenance" },
  { label: "Scheduling", icon: Calendar, href: "/scheduling" },
  { label: "Contract", icon: FileText, href: "/contract" },
  { label: "Utilities", icon: Zap, href: "/utilities" },
  { label: "Chat", icon: MessageSquare, href: "/chat" },
];

const mainMobileNavItems = [
  { label: "Properties", icon: Home, href: "/properties" },
  { label: "Maintenance", icon: Wrench, href: "/maintenance" },
  { label: "Chat", icon: MessageSquare, href: "/chat" },
];

const collapsedWidth = "w-[68px]";
const expandedWidth = "w-64";

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem("sidebar_collapsed");
    if (stored === "true") setCollapsed(true);
  }, []);

  function toggleCollapsed() {
    setCollapsed((prev) => {
      localStorage.setItem("sidebar_collapsed", String(!prev));
      return !prev;
    });
  }

  const initials = user
    ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    : "?";

  async function handleLogout() {
    await logout();
    router.push("/auth");
  }

  const desktopNavItems = [
    ...allDesktopNavItems,
    ...(user?.role === "Admin"
      ? [{ label: "Admin Panel", icon: ShieldAlert, href: "/admin" }]
      : []),
    { label: "Settings", icon: Settings, href: "/settings" },
  ];

  const mobileNavItems = [
    ...mainMobileNavItems,
    ...(user?.role === "Admin"
      ? [{ label: "Admin", icon: ShieldAlert, href: "/admin" }]
      : []),
  ];

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside
        suppressHydrationWarning
        className={`${mounted && collapsed ? collapsedWidth : expandedWidth} bg-[#1E1208] h-screen sticky top-0 hidden md:flex flex-col py-6 transition-all duration-200 shrink-0`}
      >
        <div className={`flex items-center mb-8 ${mounted && collapsed ? "justify-center px-0" : "justify-between px-6"}`}>
          {(!mounted || !collapsed) && (
            <div
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => router.push("/properties")}
            >
              <h1 className="text-xl font-extrabold text-[#FAF7F2]">Kiri</h1>
              <img src="/logo.png" alt="logo" className="w-5 h-5" />
            </div>
          )}
          <button
            onClick={toggleCollapsed}
            className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-[#8C7B6E] hover:text-[#FAF7F2] transition-colors shrink-0"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {mounted && collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        <nav className={`flex flex-col gap-1 ${mounted && collapsed ? "px-2" : "px-3"}`}>
          {desktopNavItems.map(({ label, icon: Icon, href }) => {
            const isActive = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <button
                key={label}
                onClick={() => router.push(href)}
                title={mounted && collapsed ? label : undefined}
                className={`w-full flex items-center rounded-xl text-sm font-medium transition-colors ${
                  mounted && collapsed ? "justify-center p-3" : "gap-3 px-4 py-3"
                } ${
                  isActive
                    ? "bg-white/20 text-[#FAF7F2]"
                    : "text-[#8C7B6E] hover:bg-white/10 hover:text-[#FAF7F2]"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {(!mounted || !collapsed) && <span>{label}</span>}
              </button>
            );
          })}
        </nav>

        <div className={`mt-auto border-t border-white/10 pt-4 flex items-center ${mounted && collapsed ? "flex-col gap-3 px-2" : "gap-3 px-4"}`}>
          <div className="w-8 h-8 rounded-full bg-[#3A5230] flex items-center justify-center shrink-0">
            <span className="text-xs font-bold text-white">{initials}</span>
          </div>
          {(!mounted || !collapsed) && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[#FAF7F2] truncate">
                {user ? `${user.firstName} ${user.lastName}` : ""}
              </p>
              <p className="text-xs text-[#8C7B6E]">{user?.role ?? ""}</p>
            </div>
          )}
          <button
            onClick={handleLogout}
            title="Sign out"
            className="text-[#8C7B6E] hover:text-[#FAF7F2] transition-colors shrink-0"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* ── Mobile bottom tab bar ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#1E1208] border-t border-white/10 flex items-stretch h-16">
        {mobileNavItems.map(({ label, icon: Icon, href }) => {
          const isActive = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <button
              key={label}
              onClick={() => router.push(href)}
              className={`flex-1 flex flex-col items-center justify-center gap-1 transition-colors ${
                isActive ? "text-[#FAF7F2]" : "text-[#8C7B6E]"
              }`}
            >
              <Icon className="w-5 h-5 shrink-0" />
              <span className="text-[10px] font-semibold leading-none">{label}</span>
            </button>
          );
        })}
        <button
          onClick={handleLogout}
          className="flex-1 flex flex-col items-center justify-center gap-1 text-[#8C7B6E] transition-colors"
        >
          <LogOut className="w-5 h-5 shrink-0" />
          <span className="text-[10px] font-semibold leading-none">Sign out</span>
        </button>
      </nav>
    </>
  );
}
