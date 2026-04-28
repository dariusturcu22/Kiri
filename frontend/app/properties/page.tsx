"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Eye, Pencil, Trash2, Search, Bell, Plus } from "lucide-react";
import { usePropertyStore } from "@/store/properties";
import type { Property } from "@/store/properties";
import Sidebar from "@/components/Sidebar";
import { toast } from "sonner";
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
import { trackEvent } from "@/lib/activity";

const PAGE_SIZE = 5;

const COL_GRID =
  "grid grid-cols-[1.7fr_1.7fr_0.8fr_0.6fr_0.7fr_1fr_100px] gap-4 items-center px-6";

export default function PropertiesPage() {
  const router = useRouter();
  const { properties, isLoading, fetchProperties, deleteProperty } =
    usePropertyStore();
  const [currentPage, setCurrentPage] = useState(1);
  const [showStats, setShowStats] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchProperties();
  }, []);

  const filtered = properties.filter(
    (property) =>
      property.name.toLowerCase().includes(search.toLowerCase()) ||
      property.address.toLowerCase().includes(search.toLowerCase()) ||
      property.city.toLowerCase().includes(search.toLowerCase()),
  );

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const visibleProperties = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  function handleDelete(property: Property) {
    deleteProperty(property.id);
    if (visibleProperties.length === 1 && currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
    toast.success("Property deleted", {
      description: `${property.name} — ${property.address}`,
    });
  }

  function handleSearch(value: string) {
    setSearch(value);
    setCurrentPage(1);
    if (value.trim().length >= 3) {
      trackEvent("search", value.trim());
    }
  }

  return (
    <div className="flex min-h-screen bg-cream-bg font-sans">
      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-cream-warm px-8 h-16 flex items-center justify-between gap-6 shrink-0">
          <h1 className="text-2xl font-extrabold text-brown-dark shrink-0">
            Properties
          </h1>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowStats((s) => !s)}
              className={`relative w-9 h-5 rounded-full transition-colors duration-200 ${
                showStats
                  ? "bg-green-dark"
                  : "bg-cream-warm border border-brown-muted/30"
              }`}
            >
              <span
                className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                  showStats ? "translate-x-0" : "-translate-x-4"
                }`}
              />
            </button>
            <span className="text-sm text-slate font-medium">
              Show Statistics
            </span>
          </div>

          <div className="flex items-center gap-3 ml-auto">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate" />
              <input
                type="text"
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search properties..."
                className="pl-10 pr-4 py-2 rounded-full border border-cream-warm bg-cream-bg text-sm text-brown-dark placeholder:text-brown-muted focus:outline-none focus:ring-2 focus:ring-brown-mid/20 w-52"
              />
            </div>

            <button className="relative w-9 h-9 rounded-full border border-cream-warm bg-cream-bg flex items-center justify-center hover:bg-cream-warm transition-colors shrink-0">
              <Bell className="w-4 h-4 text-slate" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500" />
            </button>

            <button
              onClick={() => router.push("/properties/new")}
              className="flex items-center gap-2 px-5 py-2 bg-green-dark hover:bg-green-hover text-white text-sm font-bold rounded-full transition-colors shrink-0"
            >
              <Plus className="w-4 h-4" />
              Add Property
            </button>
          </div>
        </header>

        <div className="p-8">
          <div className="bg-white rounded-3xl overflow-hidden shadow-sm">
            <div className={`${COL_GRID} bg-cream-warm py-3`}>
              {[
                "Property",
                "Address",
                "City",
                "Rent",
                "Status",
                "Tenants",
                "",
              ].map((heading) => (
                <span
                  key={heading}
                  className="text-xs font-bold text-slate uppercase tracking-widest"
                >
                  {heading}
                </span>
              ))}
            </div>

            {isLoading ? (
              <div className="py-16 text-center text-slate text-sm">
                Loading properties...
              </div>
            ) : visibleProperties.length === 0 ? (
              <div className="py-16 text-center text-slate text-sm">
                {search
                  ? "No properties match your search."
                  : "No properties yet. Add one to get started."}
              </div>
            ) : (
              visibleProperties.map((property, index) => (
                <div
                  key={property.id}
                  className={`${COL_GRID} py-3 border-b border-cream-bg last:border-0 ${
                    index % 2 === 0 ? "bg-white" : "bg-cream-bg"
                  }`}
                >
                  {/* Property */}
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={property.image || "/logo.png"}
                      alt={property.name}
                      className="w-10 h-10 rounded-xl object-cover shrink-0"
                    />
                    <span className="text-sm font-bold text-brown-dark truncate">
                      {property.name}
                    </span>
                  </div>

                  {/* Address */}
                  <span className="text-sm text-slate truncate">
                    {property.address}
                  </span>

                  {/* City */}
                  <span className="text-sm text-slate truncate">
                    {property.city}
                  </span>

                  {/* Rent */}
                  <span className="text-sm font-bold text-brown-dark">
                    €{property.rent}
                  </span>

                  {/* Status */}
                  <span
                    className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-bold w-fit ${
                      property.status === "Occupied"
                        ? "bg-card-sage text-green-dark"
                        : "bg-rose-100 text-rose-700"
                    }`}
                  >
                    {property.status}
                  </span>

                  {/* Tenants */}
                  <div className="flex items-center">
                    {property.tenants?.slice(0, 4).map((tenant, i) => (
                      <div
                        key={i}
                        className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold border-2 border-white bg-card-tan text-brown-mid -ml-1 first:ml-0"
                      >
                        {tenant.initials}
                      </div>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      onClick={() => router.push(`/properties/${property.id}`)}
                      title="View"
                      className="w-7 h-7 rounded-full bg-cream-bg border border-cream-warm flex items-center justify-center hover:bg-cream-warm transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5 text-slate" />
                    </button>
                    <button
                      onClick={() =>
                        router.push(`/properties/${property.id}/edit`)
                      }
                      title="Edit"
                      className="w-7 h-7 rounded-full bg-cream-bg border border-cream-warm flex items-center justify-center hover:bg-cream-warm transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5 text-slate" />
                    </button>
                    <AlertDialog>
                      <AlertDialogTrigger
                        title="Delete"
                        className="w-7 h-7 rounded-full bg-cream-bg border border-cream-warm flex items-center justify-center hover:bg-rose-100 hover:border-rose-200 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-slate" />
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete property?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete{" "}
                            <strong>{property.name}</strong> —{" "}
                            {property.address}. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(property)}
                            className="bg-rose-600 hover:bg-rose-700 text-white"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4 px-1">
            <p className="text-sm text-slate">
              Showing{" "}
              {filtered.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1}–
              {Math.min(currentPage * PAGE_SIZE, filtered.length)} of{" "}
              {filtered.length} properties
            </p>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                disabled={currentPage === 1}
                className="w-8 h-8 rounded-full border border-cream-warm flex items-center justify-center text-slate hover:bg-cream-warm disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                ‹
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (pageNumber) => (
                  <button
                    key={pageNumber}
                    onClick={() => setCurrentPage(pageNumber)}
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                      pageNumber === currentPage
                        ? "bg-night text-cream-bg"
                        : "border border-cream-warm text-slate hover:bg-cream-warm"
                    }`}
                  >
                    {pageNumber}
                  </button>
                ),
              )}

              <button
                onClick={() =>
                  setCurrentPage((page) => Math.min(totalPages, page + 1))
                }
                disabled={currentPage === totalPages || totalPages === 0}
                className="w-8 h-8 rounded-full border border-cream-warm flex items-center justify-center text-slate hover:bg-cream-warm disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                ›
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
