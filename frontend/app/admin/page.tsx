"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { useAdminStore } from "@/store/admin";
import { useAuthStore } from "@/store/auth";
import { ShieldAlert, CheckCircle, Clock, AlertTriangle, ChevronLeft, ChevronRight } from "lucide-react";

type Tab = "suspicious" | "logs";

const reasonLabels: Record<string, string> = {
  BRUTE_FORCE_LOGIN: "Brute Force Login",
  RAPID_DELETION: "Rapid Deletion",
  UNAUTHORIZED_ACCESS: "Unauthorized Access",
};

const reasonColors: Record<string, string> = {
  BRUTE_FORCE_LOGIN: "bg-red-100 text-red-700",
  RAPID_DELETION: "bg-orange-100 text-orange-700",
  UNAUTHORIZED_ACCESS: "bg-yellow-100 text-yellow-700",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString();
}

export default function AdminPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isLoading = useAuthStore((s) => s.isLoading);

  const {
    suspiciousUsers,
    logs,
    totalLogs,
    currentPage,
    isLoadingSuspicious,
    isLoadingLogs,
    fetchSuspiciousUsers,
    fetchLogs,
    resolveUser,
  } = useAdminStore();

  const [activeTab, setActiveTab] = useState<Tab>("suspicious");

  useEffect(() => {
    if (!isLoading && user?.role !== "Admin") {
      router.push("/properties");
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user?.role === "Admin") {
      fetchSuspiciousUsers();
      fetchLogs(1);
    }
  }, [user, fetchSuspiciousUsers, fetchLogs]);

  if (isLoading || !user) return null;
  if (user.role !== "Admin") return null;

  const totalPages = Math.ceil(totalLogs / 50);
  const unresolvedCount = suspiciousUsers.filter((u) => !u.isResolved).length;

  return (
    <div className="flex min-h-screen bg-[#FAF7F2] font-sans">
      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0">
        <header className="bg-white border-b border-[#EDE8DF] px-4 md:px-8 h-14 md:h-16 flex items-center gap-3 shrink-0">
          <ShieldAlert className="w-5 h-5 text-[#3A5230]" />
          <h1 className="text-xl md:text-2xl font-extrabold text-[#1E1208]">Admin Panel</h1>
        </header>

        <div className="flex-1 p-4 md:p-8 flex flex-col gap-6">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("suspicious")}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-colors flex items-center gap-2 ${
                activeTab === "suspicious"
                  ? "bg-[#1E1208] text-white"
                  : "bg-white text-[#6B7E94] border border-[#EDE8DF] hover:bg-[#FAF7F2]"
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
              Observation List
              {unresolvedCount > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                  {unresolvedCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("logs")}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-colors ${
                activeTab === "logs"
                  ? "bg-[#1E1208] text-white"
                  : "bg-white text-[#6B7E94] border border-[#EDE8DF] hover:bg-[#FAF7F2]"
              }`}
            >
              Action Logs
            </button>
          </div>

          {activeTab === "suspicious" && (
            <div className="bg-white rounded-2xl border border-[#EDE8DF] overflow-hidden">
              <div className="px-6 py-4 border-b border-[#EDE8DF]">
                <p className="text-sm font-bold text-[#6B7E94] uppercase tracking-widest">
                  Suspicious Users
                </p>
              </div>

              {isLoadingSuspicious ? (
                <div className="px-6 py-12 text-center text-[#6B7E94] text-sm">Loading...</div>
              ) : suspiciousUsers.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <CheckCircle className="w-10 h-10 text-green-400 mx-auto mb-3" />
                  <p className="text-[#6B7E94] text-sm font-medium">No suspicious behaviour detected</p>
                </div>
              ) : (
                <div className="divide-y divide-[#EDE8DF]">
                  {suspiciousUsers.map((entry) => (
                    <div key={entry.id} className="px-6 py-4 flex items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          <p className="text-sm font-semibold text-[#1E1208]">{entry.userEmail}</p>
                          <span className="text-xs text-[#8C7B6E] bg-[#FAF7F2] px-2 py-0.5 rounded-full border border-[#EDE8DF]">
                            {entry.userRole}
                          </span>
                          <span
                            className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                              reasonColors[entry.detectionReason] ?? "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {reasonLabels[entry.detectionReason] ?? entry.detectionReason}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-[#8C7B6E]">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Detected {formatDate(entry.detectedAt)}
                          </span>
                          {entry.isResolved && entry.resolvedAt && (
                            <span className="flex items-center gap-1 text-green-600">
                              <CheckCircle className="w-3 h-3" />
                              Resolved {formatDate(entry.resolvedAt)}
                            </span>
                          )}
                        </div>
                      </div>

                      {!entry.isResolved ? (
                        <button
                          onClick={() => resolveUser(entry.id)}
                          className="px-4 py-2 rounded-xl bg-[#3A5230] text-white text-xs font-semibold hover:bg-[#2d4025] transition-colors shrink-0"
                        >
                          Resolve
                        </button>
                      ) : (
                        <span className="px-4 py-2 rounded-xl bg-green-50 text-green-700 text-xs font-semibold shrink-0">
                          Resolved
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "logs" && (
            <div className="bg-white rounded-2xl border border-[#EDE8DF] overflow-hidden flex flex-col">
              <div className="px-6 py-4 border-b border-[#EDE8DF] flex items-center justify-between">
                <p className="text-sm font-bold text-[#6B7E94] uppercase tracking-widest">
                  Action Logs
                </p>
                <p className="text-xs text-[#8C7B6E]">{totalLogs} total entries</p>
              </div>

              {isLoadingLogs ? (
                <div className="px-6 py-12 text-center text-[#6B7E94] text-sm">Loading...</div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-[#FAF7F2] border-b border-[#EDE8DF]">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-bold text-[#6B7E94] uppercase tracking-wider">
                            Time
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-bold text-[#6B7E94] uppercase tracking-wider">
                            User
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-bold text-[#6B7E94] uppercase tracking-wider">
                            Role
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-bold text-[#6B7E94] uppercase tracking-wider">
                            Action
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-bold text-[#6B7E94] uppercase tracking-wider">
                            IP
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-bold text-[#6B7E94] uppercase tracking-wider">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#EDE8DF]">
                        {logs.map((log) => (
                          <tr key={log.id} className="hover:bg-[#FAF7F2] transition-colors">
                            <td className="px-4 py-3 text-xs text-[#6B7E94] whitespace-nowrap">
                              {formatDate(log.timestamp)}
                            </td>
                            <td className="px-4 py-3 text-xs text-[#1E1208] font-medium">
                              #{log.userId}
                            </td>
                            <td className="px-4 py-3 text-xs text-[#6B7E94]">{log.userRole}</td>
                            <td className="px-4 py-3">
                              <span className="text-xs font-mono bg-[#FAF7F2] border border-[#EDE8DF] px-2 py-0.5 rounded text-[#1E1208]">
                                {log.actionType}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-xs text-[#6B7E94] font-mono">
                              {log.ipAddress}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                                  log.success
                                    ? "bg-green-50 text-green-700"
                                    : "bg-red-50 text-red-700"
                                }`}
                              >
                                {log.success ? "OK" : "Failed"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {totalPages > 1 && (
                    <div className="px-6 py-4 border-t border-[#EDE8DF] flex items-center justify-between">
                      <p className="text-xs text-[#6B7E94]">
                        Page {currentPage} of {totalPages}
                      </p>
                      <div className="flex gap-2">
                        <button
                          disabled={currentPage <= 1}
                          onClick={() => fetchLogs(currentPage - 1)}
                          className="p-1.5 rounded-lg border border-[#EDE8DF] disabled:opacity-40 hover:bg-[#FAF7F2] transition-colors"
                        >
                          <ChevronLeft className="w-4 h-4 text-[#6B7E94]" />
                        </button>
                        <button
                          disabled={currentPage >= totalPages}
                          onClick={() => fetchLogs(currentPage + 1)}
                          className="p-1.5 rounded-lg border border-[#EDE8DF] disabled:opacity-40 hover:bg-[#FAF7F2] transition-colors"
                        >
                          <ChevronRight className="w-4 h-4 text-[#6B7E94]" />
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
