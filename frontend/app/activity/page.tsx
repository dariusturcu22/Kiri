"use client";

import { useEffect, useState } from "react";
import {
  getActivityLog,
  clearActivityLog,
  type ActivityEvent,
} from "@/lib/activity";
import Sidebar from "@/components/Sidebar";
import { Trash2, Clock, Tag, Info } from "lucide-react";

export default function ActivityPage() {
  const [events, setEvents] = useState<ActivityEvent[]>([]);

  useEffect(() => {
    setEvents(getActivityLog().reverse());
  }, []);

  const handleClear = () => {
    clearActivityLog();
    setEvents([]);
  };

  return (
    <div className="flex min-h-screen bg-cream-bg font-sans">
      <Sidebar />
      <main className="flex-1 p-4 md:p-8 pb-20 md:pb-8">
        <div className="max-w-4xl mx-auto">
          <header className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-extrabold text-brown-dark">
                Activity Log
              </h1>
              <p className="text-slate">
                Tracking user interactions via cookies
              </p>
            </div>
            <button
              onClick={handleClear}
              className="flex items-center gap-2 px-4 py-2 bg-rose-100 text-rose-700 rounded-xl hover:bg-rose-200 transition-colors font-bold text-sm"
            >
              <Trash2 className="w-4 h-4" />
              Clear Log
            </button>
          </header>

          <div className="space-y-3">
            {events.length === 0 ? (
              <div className="bg-white p-12 rounded-3xl text-center border border-cream-warm text-slate">
                No activity recorded yet. Navigate around the app to generate
                logs!
              </div>
            ) : (
              events.map((event, idx) => (
                <div
                  key={idx}
                  className="bg-white p-4 rounded-2xl border border-cream-warm shadow-sm flex items-center justify-between animate-in fade-in slide-in-from-bottom-2"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-cream-bg rounded-lg">
                      <Tag className="w-4 h-4 text-brown-mid" />
                    </div>
                    <div>
                      <div className="font-bold text-brown-dark capitalize">
                        {event.type.replace("_", " ")}
                      </div>
                      {event.detail && (
                        <div className="text-sm text-slate flex items-center gap-1">
                          <Info className="w-3 h-3" />
                          {event.detail}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-brown-muted font-medium flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(event.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
