"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Home,
  Wrench,
  Calendar,
  FileText,
  Zap,
  MessageSquare,
  Settings,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from "lucide-react";
import { useAuthStore } from "@/store/auth";

type SidebarItem = {
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  onClick?: () => void;
};

type SidebarProps = {
  items?: SidebarItem[];
};

const mainNavItems = [
  { label: "Properties", icon: Home, href: "/properties" },
  { label: "Maintenance", icon: Wrench, href: "/maintenance" },
  { label: "Scheduling", icon: Calendar, href: "/scheduling" },
  { label: "Contract", icon: FileText, href: "/contract" },
  { label: "Utilities", icon: Zap, href: "/utilities" },
  { label: "Chat", icon: MessageSquare, href: "/chat" },
];

const collapsedWidth = "w-[68px]";
const expandedWidth = "w-64";

export default function Sidebar({ items = [] }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("sidebar_collapsed");
    if (stored === "true") setCollapsed(true);
  }, []);

  function toggleCollapsed() {
    setCollapsed((prev) => {
      localStorage.setItem("sidebar_collapsed", String(!prev));
      return !prev;
    });
  }

  const hasPropertySection = items.length > 0;

  const initials = user
    ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    : "?";

  async function handleLogout() {
    await logout();
    router.push("/auth");
  }

  const allNavItems = [
    ...mainNavItems,
    ...(user?.role === "Admin"
      ? [{ label: "Admin Panel", icon: ShieldAlert, href: "/admin" }]
      : []),
  ];

  // Mobile bottom nav shows first 5 items + logout
  const mobileNavItems = allNavItems.slice(0, 5);

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside
        className={`${collapsed ? collapsedWidth : expandedWidth} bg-[#1E1208] h-screen sticky top-0 hidden md:flex flex-col py-6 transition-all duration-200 shrink-0`}
      >
        <div className={`flex items-center mb-8 ${collapsed ? "justify-center px-0" : "justify-between px-6"}`}>
          {!collapsed && (
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
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        <nav className={`flex flex-col gap-1 ${collapsed ? "px-2" : "px-3"}`}>
          {allNavItems.map(({ label, icon: Icon, href }) => {
            const isActive = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <button
                key={label}
                onClick={() => router.push(href)}
                title={collapsed ? label : undefined}
                className={`w-full flex items-center rounded-xl text-sm font-medium transition-colors ${
                  collapsed ? "justify-center p-3" : "gap-3 px-4 py-3"
                } ${
                  isActive
                    ? "bg-white/20 text-[#FAF7F2]"
                    : "text-[#8C7B6E] hover:bg-white/10 hover:text-[#FAF7F2]"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {!collapsed && <span>{label}</span>}
              </button>
            );
          })}
        </nav>

        {hasPropertySection && !collapsed && (
          <>
            <div className="h-px bg-white/10 my-4 mx-3" />
            <button className="mx-3 flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-[#FAF7F2] bg-white/10 mb-3">
              <Home className="w-4 h-4" />
              <span>This Property</span>
            </button>
            <div className="flex flex-1 px-3">
              <div className="w-px bg-white/15 mr-4 ml-2" />
              <nav className="flex flex-col gap-4">
                {items.map(({ label, icon: Icon, onClick }) => (
                  <button
                    key={label}
                    onClick={onClick}
                    className="flex items-center gap-3 text-sm text-[#8C7B6E] hover:text-[#FAF7F2] transition-colors"
                  >
                    {Icon && <Icon className="w-4 h-4" />}
                    {label}
                  </button>
                ))}
              </nav>
            </div>
          </>
        )}

        <div className={`mt-auto border-t border-white/10 pt-4 flex items-center ${collapsed ? "flex-col gap-3 px-2" : "gap-3 px-4"}`}>
          <div className="w-8 h-8 rounded-full bg-[#3A5230] flex items-center justify-center shrink-0">
            <span className="text-xs font-bold text-white">{initials}</span>
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[#FAF7F2] truncate">
                {user ? `${user.firstName} ${user.lastName}` : "Loading..."}
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

      {/* ── Mobile bottom navigation ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#1E1208] border-t border-white/10 flex items-center justify-around h-16 px-1">
        {mobileNavItems.map(({ label, icon: Icon, href }) => {
          const isActive = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <button
              key={label}
              onClick={() => router.push(href)}
              className={`flex flex-col items-center gap-1 py-2 px-2 rounded-xl transition-colors min-w-0 flex-1 ${
                isActive ? "text-[#FAF7F2]" : "text-[#8C7B6E]"
              }`}
            >
              <Icon className="w-5 h-5 shrink-0" />
              <span className="text-[9px] font-medium leading-none truncate w-full text-center">{label}</span>
            </button>
          );
        })}
        <button
          onClick={handleLogout}
          className="flex flex-col items-center gap-1 py-2 px-2 rounded-xl transition-colors text-[#8C7B6E] flex-1"
        >
          <LogOut className="w-5 h-5 shrink-0" />
          <span className="text-[9px] font-medium leading-none">Out</span>
        </button>
      </nav>
    </>
  );
}
