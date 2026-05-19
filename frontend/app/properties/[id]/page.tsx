"use client";

import { useParams, useRouter } from "next/navigation";
import {
  Bell,
  Zap,
  Edit,
  MessageCircle,
  FileUp,
  BarChart3,
  Calendar,
  FileText,
  MessageSquare,
} from "lucide-react";
import { usePropertyStore } from "@/store/properties";
import type { Property } from "@/store/properties";
import Sidebar from "@/components/Sidebar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { trackEvent } from "@/lib/activity";
import { useAuthStore } from "@/store/auth";

const METER_READINGS = [
  { id: "1", type: "Electricity", iconBg: "bg-card-tan", status: "Remind" },
  { id: "2", type: "Water", iconBg: "bg-card-sage", status: "Remind" },
  { id: "3", type: "Gas", iconBg: "bg-[#f0ddd4]", status: "Remind" },
];

const CURRENT_PROBLEMS = [
  {
    id: "1",
    title: "Leaking faucet – bathroom",
    by: "by A. Mureșan",
    status: "Open",
    borderColor: "border-brown-mid",
    badgeBg: "bg-[#f0ddd4]",
    badgeText: "text-brown-mid",
  },
  {
    id: "2",
    title: "Mold on ceiling – kitchen",
    by: "by I. Pop",
    status: "In Progress",
    borderColor: "border-brown-light",
    badgeBg: "bg-card-tan",
    badgeText: "text-[#8b6914]",
  },
  {
    id: "3",
    title: "Broken latch – bedroom",
    by: "by M. Ionescu",
    status: "Open",
    borderColor: "border-brown-mid",
    badgeBg: "bg-[#f0ddd4]",
    badgeText: "text-brown-mid",
  },
];

const UTILITIES = [
  { name: "Electricity", amount: "€42.00" },
  { name: "Water", amount: "€18.50" },
  { name: "Gas", amount: "€31.20" },
];

const MAINTENANCE_HISTORY = [
  {
    id: "1",
    description: "Leaking faucet – bathroom",
    reporter: "A. Mureșan",
    initials: "AM",
    date: "5 Jan 2026",
    status: "Open",
    badgeBg: "bg-[#f0ddd4]",
    badgeText: "text-brown-mid",
    rowBg: "bg-white",
  },
  {
    id: "2",
    description: "Mold on ceiling – kitchen",
    reporter: "I. Pop",
    initials: "IP",
    date: "28 Jan 2025",
    status: "In Progress",
    badgeBg: "bg-card-tan",
    badgeText: "text-[#8b6914]",
    rowBg: "bg-cream-bg",
  },
  {
    id: "3",
    description: "Broken window latch",
    reporter: "M. Ionescu",
    initials: "MI",
    date: "18 Dec 2025",
    status: "Fixed",
    badgeBg: "bg-card-sage",
    badgeText: "text-green-dark",
    rowBg: "bg-white",
  },
  {
    id: "4",
    description: "Heating not working",
    reporter: "A. Mureșan",
    initials: "AM",
    date: "3 Nov 2025",
    status: "Resolved",
    badgeBg: "bg-card-sage",
    badgeText: "text-green-dark",
    rowBg: "bg-cream-bg",
  },
  {
    id: "5",
    description: "Paint peeling – hallway",
    reporter: "I. Pop",
    initials: "IP",
    date: "14 Oct 2025",
    status: "Fixed",
    badgeBg: "bg-card-sage",
    badgeText: "text-green-dark",
    rowBg: "bg-white",
  },
];

const buildQuickActions = (onOpenChat: () => void) => [
  { icon: MessageCircle, label: "Open Chat with Tenants", onClick: onOpenChat },
  { icon: FileUp, label: "Upload Invoice PDF", onClick: () => {} },
  { icon: BarChart3, label: "Generate Report", onClick: () => {} },
];


export default function PropertyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [mounted, setMounted] = useState(false);
  const canEdit = mounted && (user?.role === "Landlord" || user?.role === "Admin");

  const quickActions = buildQuickActions(() => router.push("/chat"));
  const { getPropertyById, deleteProperty } = usePropertyStore();

  const propertyId = Number(params.id);
  const [property, setProperty] = useState<Property | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    getPropertyById(propertyId).then((found) => {
      setProperty(found);
      setIsLoading(false);
    });
  }, [propertyId]);

  useEffect(() => {
    if (property) {
      trackEvent("property_viewed", property.name);
    }
  }, [property]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-cream-bg">
        <p className="text-slate text-sm">Loading property...</p>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-cream-bg">
        <div className="text-center">
          <p className="text-lg text-slate mb-4">Property not found.</p>
          <button
            onClick={() => router.push("/properties")}
            className="px-4 py-2 bg-night text-cream-bg rounded-full text-sm font-bold"
          >
            Back to Properties
          </button>
        </div>
      </div>
    );
  }

  function handleDelete() {
    deleteProperty(propertyId);
    toast.success("Property deleted", {
      description: `${property!.name} — ${property!.address}`,
    });
    router.push("/properties");
  }

  const detailFields = [
    { label: "Full Address", value: property.address },
    { label: "City", value: property.city },
    { label: "Monthly Rent", value: `€ ${property.rent}` },
    { label: "Date Added", value: property.dateAdded },
    { label: "Last Updated", value: property.lastUpdated },
  ];

  return (
    <div className="flex min-h-screen bg-white font-sans">
      <Sidebar />

      <main className="flex-1 bg-cream-bg overflow-auto pb-16 md:pb-0">
        <div className="relative h-55 w-full overflow-hidden">
          <img
            src={property.image || "/logo.png"}
            alt={property.name}
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-linear-to-b from-[rgba(30,18,8,0.72)] to-[rgba(30,18,8,0.45)]" />

          <div className="absolute inset-0 flex items-center justify-between px-4 md:px-9 gap-3">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => router.push("/properties")}
                  className="font-semibold text-white/60 text-xs hover:text-white transition-colors"
                >
                  Properties
                </button>
                <span className="text-white/60 text-xs">›</span>
                <span className="font-semibold text-white/90 text-xs">
                  {property.name}
                </span>
              </div>

              <h1 className="font-extrabold text-cream-bg text-2xl md:text-[40px] leading-tight">
                {property.name}
              </h1>

              <p className="font-medium text-brown-light text-[15px]">
                {property.address} · {property.city}
              </p>

              <div className="flex items-center gap-2">
                <span className="bg-green-dark px-3 py-1 rounded-full font-bold text-white text-[11px]">
                  {property.status}
                </span>
                <span className="bg-white/15 px-3 py-1 rounded-full font-bold text-white text-[11px]">
                  €{property.rent}
                </span>
              </div>
            </div>

            {canEdit && (
            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => router.push(`/properties/${propertyId}/edit`)}
                className="bg-white/15 border border-white/30 px-3 md:px-5 h-9 rounded-full font-bold text-white text-[13px] hover:bg-white/25 transition-colors"
              >
                Edit
              </button>
              <AlertDialog>
                <AlertDialogTrigger className="bg-white/15 border border-white/30 px-5 h-9 rounded-full font-bold text-white text-[13px] hover:bg-rose-500/60 transition-colors">
                  Delete
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete property?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete{" "}
                      <strong>{property.name}</strong> — {property.address}.
                      This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      className="bg-rose-600 hover:bg-rose-700 text-white"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
            )}
          </div>
        </div>

        <div className="bg-white border-b border-cream-warm min-h-[72px] px-4 md:px-9 flex flex-wrap items-center gap-3 md:gap-5 py-3">
          <span className="font-bold text-slate text-[11px] tracking-[2px] uppercase shrink-0">
            Tenants
          </span>

          {property.tenants.length === 0 ? (
            <span className="text-sm text-slate">No tenants assigned</span>
          ) : (
            property.tenants.map((tenant, index) => (
              <div key={index} className="flex items-center gap-3">
                {index > 0 && <div className="bg-cream-warm w-px h-10" />}
                <div className="w-9 h-9 rounded-full bg-[#f0ddd4] flex items-center justify-center">
                  <span className="font-bold text-brown-mid text-[13px]">
                    {tenant.initials}
                  </span>
                </div>
                <span className="font-semibold text-brown-dark text-[13px]">
                  {tenant.firstName + " " + tenant.lastName}
                </span>
              </div>
            ))
          )}

          <button className="ml-auto border border-cream-warm h-8 px-4 rounded-full font-semibold text-slate text-xs hover:bg-cream-warm transition-colors">
            + Add Tenant
          </button>
        </div>

        <div className="px-4 md:px-9 py-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1 flex flex-col gap-4 min-w-0">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 bg-white rounded-[24px] border border-cream-warm p-5.75 shadow-[0px_2px_10px_0px_rgba(44,26,14,0.06)]">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-brown-dark text-[15px]">
                      Meter Readings
                    </h3>
                    <Bell className="w-4 h-4 text-slate" />
                  </div>
                  <p className="text-xs text-slate mb-6">
                    Remind tenants to submit readings.
                  </p>
                  <div className="flex flex-col gap-3 mb-4">
                    {METER_READINGS.map((meter) => (
                      <div
                        key={meter.id}
                        className="bg-cream-bg h-13 rounded-[12px] flex items-center justify-between px-3.5"
                      >
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`${meter.iconBg} w-5 h-5 rounded-full flex items-center justify-center`}
                          >
                            <Zap className="w-3 h-3 text-brown-dark" />
                          </div>
                          <span className="font-semibold text-brown-dark text-[13px]">
                            {meter.type}
                          </span>
                        </div>
                        <span className="bg-night text-white font-bold text-[11px] px-3 h-7 rounded-full flex items-center">
                          {meter.status}
                        </span>
                      </div>
                    ))}
                  </div>
                  <button className="w-full h-9.5 bg-green-dark hover:bg-green-hover text-white font-bold text-[13px] rounded-full transition-colors">
                    Remind All
                  </button>
                </div>

                <div className="flex-1 bg-white rounded-[24px] border border-cream-warm p-5.75 shadow-[0px_2px_10px_0px_rgba(44,26,14,0.06)]">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold text-brown-dark text-[15px]">
                      Current Problems
                    </h3>
                    <span className="bg-[#f0ddd4] px-2.5 py-1 rounded-full font-bold text-brown-mid text-[11px]">
                      + New
                    </span>
                  </div>
                  <div className="flex flex-col gap-2.5 mb-4">
                    {CURRENT_PROBLEMS.map((problem) => (
                      <div
                        key={problem.id}
                        className={`bg-cream-bg rounded-[12px] border-l-[3.5px] ${problem.borderColor} pl-4 pr-3.5 pt-3 pb-2.5`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-bold text-brown-dark text-[13px] leading-snug">
                              {problem.title}
                            </p>
                            <p className="font-medium text-slate text-[11px]">
                              {problem.by}
                            </p>
                          </div>
                          <span
                            className={`${problem.badgeBg} ${problem.badgeText} font-bold text-[11px] px-2.5 py-1 rounded-full shrink-0`}
                          >
                            {problem.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-right font-bold text-brown-mid text-[12px] cursor-pointer hover:text-brown-dark transition-colors">
                    View all →
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 bg-[#f0ddd4] rounded-[24px] p-5.5">
                  <h3 className="font-bold text-brown-dark text-[15px] mb-4">
                    Utilities — Jan 2026
                  </h3>
                  <div className="flex flex-col gap-2.5 mb-9">
                    {UTILITIES.map((utility) => (
                      <div
                        key={utility.name}
                        className="flex items-center justify-between"
                      >
                        <span className="font-semibold text-brown-dark text-[13px]">
                          {utility.name}
                        </span>
                        <span className="font-bold text-brown-mid text-[13px]">
                          {utility.amount}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-cream-warm pt-3 mb-4 flex items-center justify-between">
                    <span className="font-extrabold text-brown-dark text-[14px]">
                      Total Due
                    </span>
                    <span className="font-extrabold text-brown-mid text-[18px]">
                      €91.70
                    </span>
                  </div>
                  <button className="w-full h-9.5 bg-brown-mid hover:bg-brown-dark text-white font-bold text-[13px] rounded-full transition-colors">
                    Send Payment Reminder
                  </button>
                </div>

                <div className="flex-1 bg-card-sage rounded-[24px] p-5.5">
                  <h3 className="font-bold text-brown-dark text-[15px] mb-2.5">
                    Upcoming Visit
                  </h3>
                  <div className="text-center mb-4">
                    <p className="font-extrabold text-brown-dark text-[36px] leading-tight">
                      Apr 14
                    </p>
                    <p className="font-medium text-slate text-[14px]">2026</p>
                    <p className="font-bold text-green-dark text-[16px] mb-2">
                      10:30 – 11:30
                    </p>
                    <span className="inline-block bg-green-dark px-3 py-1 rounded-full font-bold text-white text-[12px]">
                      Confirmed
                    </span>
                  </div>
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <div className="w-7 h-7 rounded-full bg-[#f0ddd4] flex items-center justify-center">
                      <span className="font-bold text-brown-mid text-[11px]">
                        AM
                      </span>
                    </div>
                    <span className="font-semibold text-brown-dark text-[13px]">
                      A. Mureșan
                    </span>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button className="h-9 rounded-full border border-green-dark font-bold text-green-dark text-[13px] hover:bg-green-dark hover:text-white transition-colors">
                      Reschedule
                    </button>
                    <button className="h-9 rounded-full bg-night font-bold text-white text-[13px] hover:bg-brown-dark transition-colors">
                      + Schedule New Visit
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-[24px] border border-cream-warm p-5.75 shadow-[0px_2px_10px_0px_rgba(44,26,14,0.06)]">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-bold text-brown-dark text-[15px]">
                    Maintenance History
                  </h3>
                  <span className="bg-card-sage px-2.5 py-1 rounded-full font-bold text-green-dark text-[12px] cursor-pointer">
                    + New Ticket
                  </span>
                </div>

                <div className="bg-cream-warm h-8.25 rounded-[10px] flex items-center px-3.5 mb-2">
                  <span className="flex-1 font-bold text-slate text-[11px] tracking-[2px] uppercase">
                    Issue
                  </span>
                  <span className="w-30 font-bold text-slate text-[11px] tracking-[2px] uppercase">
                    Reported By
                  </span>
                  <span className="w-30 font-bold text-slate text-[11px] tracking-[2px] uppercase">
                    Date
                  </span>
                  <span className="w-30 font-bold text-slate text-[11px] tracking-[2px] uppercase">
                    Status
                  </span>
                </div>

                <div className="flex flex-col gap-1.5 mb-4">
                  {MAINTENANCE_HISTORY.map((issue) => (
                    <div
                      key={issue.id}
                      className={`${issue.rowBg} h-12.25 rounded-[12px] flex items-center px-3.5`}
                    >
                      <span className="flex-1 font-semibold text-brown-dark text-[13px]">
                        {issue.description}
                      </span>
                      <div className="w-30 flex items-center gap-1.5">
                        <div className="w-6 h-6 rounded-full bg-[#f0ddd4] flex items-center justify-center shrink-0">
                          <span className="font-bold text-brown-mid text-[10px]">
                            {issue.initials}
                          </span>
                        </div>
                        <span className="font-medium text-slate text-[12px]">
                          {issue.reporter}
                        </span>
                      </div>
                      <span className="w-30 font-medium text-slate text-[12px]">
                        {issue.date}
                      </span>
                      <div className="w-30">
                        <span
                          className={`inline-block ${issue.badgeBg} ${issue.badgeText} font-bold text-[11px] px-2.5 py-1 rounded-full`}
                        >
                          {issue.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <p className="text-right font-bold text-brown-mid text-[12px] cursor-pointer hover:text-brown-dark transition-colors">
                  View full history →
                </p>
              </div>
            </div>

            <div className="w-full md:w-90 flex flex-col gap-4 md:shrink-0">
              <div className="bg-white rounded-[24px] border border-cream-warm p-5.75 shadow-[0px_2px_10px_0px_rgba(44,26,14,0.06)]">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-brown-dark text-[15px]">
                    Property Details
                  </h3>
                  {canEdit && (
                    <Edit
                      className="w-4 h-4 text-slate cursor-pointer hover:text-brown-dark transition-colors"
                      onClick={() => router.push(`/properties/${propertyId}/edit`)}
                    />
                  )}
                </div>
                <div className="flex flex-col gap-2.5">
                  {detailFields.map(({ label, value }) => (
                    <div
                      key={label}
                      className="border-b border-cream-bg pb-1.5"
                    >
                      <p className="font-semibold text-slate text-[11px] tracking-[2px] uppercase mb-1.5">
                        {label}
                      </p>
                      <p className="font-bold text-brown-dark text-[14px]">
                        {value}
                      </p>
                    </div>
                  ))}
                  <div>
                    <p className="font-semibold text-slate text-[11px] tracking-[2px] uppercase mb-1.5">
                      Status
                    </p>
                    <span className="inline-block bg-card-sage px-3 py-1 rounded-full font-bold text-green-dark text-[12px]">
                      {property.status}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-night rounded-[24px] border border-black p-5.5">
                <h3 className="font-bold text-cream-bg text-[14px] mb-4">
                  Quick Actions
                </h3>
                <div className="flex flex-col gap-2.5">
                  {quickActions.map(({ icon: Icon, label, onClick }) => (
                    <button
                      key={label}
                      onClick={onClick}
                      className="bg-white/10 border border-white/15 h-10 rounded-full flex items-center justify-center gap-2 font-bold text-white text-[13px] hover:bg-white/20 transition-colors"
                    >
                      <Icon className="w-4 h-4" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-[24px] border border-cream-warm p-5.75 shadow-[0px_2px_10px_0px_rgba(44,26,14,0.06)]">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-brown-dark text-[15px]">
                    Contract
                  </h3>
                  <span className="bg-green-dark px-3 py-1 rounded-full font-bold text-white text-[11px]">
                    Active
                  </span>
                </div>
                <div className="flex gap-6 mb-4">
                  <div>
                    <p className="font-semibold text-slate text-[11px] tracking-[2px] uppercase mb-1.5">
                      Start Date
                    </p>
                    <p className="font-bold text-brown-dark text-[14px]">
                      1 Sept 2025
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold text-slate text-[11px] tracking-[2px] uppercase mb-1.5">
                      End Date
                    </p>
                    <p className="font-bold text-brown-dark text-[14px]">
                      1 Sept 2026
                    </p>
                  </div>
                </div>
                <div className="mb-4">
                  <p className="font-semibold text-slate text-[11px] tracking-[2px] uppercase mb-1.5">
                    Days Remaining
                  </p>
                  <p className="font-extrabold text-green-dark text-[18px]">
                    175 days
                  </p>
                </div>
                <div className="flex gap-4">
                  <button className="flex-1 h-9 rounded-full border border-green-dark font-bold text-green-dark text-[13px] flex items-center justify-center gap-2 hover:bg-green-dark hover:text-white transition-colors">
                    View PDF
                  </button>
                  <button className="flex-1 h-9 rounded-full bg-green-dark font-bold text-white text-[13px] hover:bg-green-hover transition-colors">
                    Generate New Contract
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
