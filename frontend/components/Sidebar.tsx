"use client";

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

export default function Sidebar({ items = [] }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const hasPropertySection = items.length > 0;

  const displayName = user ? `${user.firstName} ${user.lastName}` : "Loading...";
  const displayRole = user?.role ?? "";
  const initials = user
    ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    : "?";

  async function handleLogout() {
    await logout();
    router.push("/auth");
  }

  return (
    <aside className="w-64 bg-[#1E1208] h-screen sticky top-0 flex flex-col px-6 py-6">
      <div
        className="flex items-center gap-2 mb-8 cursor-pointer"
        onClick={() => router.push("/properties")}
      >
        <h1 className="text-xl font-extrabold text-[#FAF7F2]">Kiri</h1>
        <img src="/logo.png" alt="logo" className="w-5 h-5" />
      </div>

      <nav className="flex flex-col gap-1">
        {mainNavItems.map(({ label, icon: Icon, href }) => {
          const isActive = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <button
              key={label}
              onClick={() => router.push(href)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                isActive
                  ? "bg-white/20 text-[#FAF7F2]"
                  : "text-[#8C7B6E] hover:bg-white/10 hover:text-[#FAF7F2]"
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{label}</span>
            </button>
          );
        })}

        {user?.role === "Admin" && (
          <button
            onClick={() => router.push("/admin")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
              pathname === "/admin"
                ? "bg-white/20 text-[#FAF7F2]"
                : "text-[#8C7B6E] hover:bg-white/10 hover:text-[#FAF7F2]"
            }`}
          >
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>Admin Panel</span>
          </button>
        )}
      </nav>

      {hasPropertySection && (
        <>
          <div className="h-px bg-white/10 my-4" />
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-[#FAF7F2] bg-white/10 mb-3">
            <Home className="w-4 h-4" />
            <span>This Property</span>
          </button>
          <div className="flex flex-1">
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

      <div className="mt-auto pt-6 border-t border-white/10 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-[#3A5230] flex items-center justify-center shrink-0">
          <span className="text-xs font-bold text-white">{initials}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[#FAF7F2] truncate">{displayName}</p>
          <p className="text-xs text-[#8C7B6E]">{displayRole}</p>
        </div>
        <button
          onClick={handleLogout}
          title="Sign out"
          className="text-[#8C7B6E] hover:text-[#FAF7F2] transition-colors shrink-0"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
}
