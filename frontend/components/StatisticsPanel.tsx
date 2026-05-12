"use client";

import { useEffect, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  type PieLabelRenderProps,
} from "recharts";
import api from "@/lib/axios";

type PropertyStatistics = {
  totalProperties: number;
  occupiedProperties: number;
  vacantProperties: number;
  totalMonthlyRent: number;
  averageRent: number;
};

function PieSegmentLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }: PieLabelRenderProps) {
  const numCx = Number(cx);
  const numCy = Number(cy);
  const numMidAngle = Number(midAngle);
  const numInnerRadius = Number(innerRadius);
  const numOuterRadius = Number(outerRadius);
  const numPercent = Number(percent);

  const radius = numInnerRadius + (numOuterRadius - numInnerRadius) * 0.55;
  const x = numCx + radius * Math.cos((-numMidAngle * Math.PI) / 180);
  const y = numCy + radius * Math.sin((-numMidAngle * Math.PI) / 180);

  if (numPercent < 0.05) return null;

  return (
    <text x={x} y={y} fill="#1E1208" textAnchor="middle" dominantBaseline="central" fontSize={14} fontWeight={700}>
      {`${Math.round(numPercent * 100)}%`}
    </text>
  );
}

const occupiedColor = "#A8C5A0";
const vacantColor = "#D4AAAA";
const occupiedBarColor = "#3A5230";
const vacantBarColor = "#7A4F3A";
const lineColor = "#1E1208";
const gridColor = "#EDE8DF";

export default function StatisticsPanel() {
  const [stats, setStats] = useState<PropertyStatistics | null>(null);

  useEffect(() => {
    api
      .get<PropertyStatistics>("/api/properties/statistics")
      .then((res) => setStats(res.data))
      .catch(() => {});
  }, []);

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-[#6B7E94]">
        Loading statistics...
      </div>
    );
  }

  const total = stats.totalProperties;
  const occupiedPercent = total === 0 ? 0 : Math.round((stats.occupiedProperties / total) * 100);
  const vacantPercent = 100 - occupiedPercent;

  const occupancyData = [
    { name: "Occupied", value: stats.occupiedProperties },
    { name: "Vacant", value: stats.vacantProperties },
  ];

  return (
    <div className="grid grid-cols-2 gap-5">
      <div className="bg-white rounded-3xl p-6 shadow-sm flex flex-col gap-6">
        <h2 className="text-base font-bold text-[#1E1208]">Occupancy Rate</h2>

        <div className="flex justify-center">
          <ResponsiveContainer width={280} height={280}>
            <PieChart>
              <Pie
                data={occupancyData}
                cx="50%"
                cy="50%"
                innerRadius={0}
                outerRadius={120}
                dataKey="value"
                label={PieSegmentLabel}
                labelLine={false}
              >
                <Cell fill={occupiedColor} />
                <Cell fill={vacantColor} />
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="flex flex-col gap-3">
          <OccupancyBar label="Occupied" percent={occupiedPercent} color={occupiedBarColor} />
          <OccupancyBar label="Vacant" percent={vacantPercent} color={vacantBarColor} />
        </div>
      </div>

      <div className="flex flex-col gap-5">
        <div className="bg-white rounded-3xl p-6 shadow-sm flex flex-col gap-4">
          <h2 className="text-base font-bold text-[#1E1208]">Recorded Problems</h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={[]} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid stroke={gridColor} strokeDasharray="0" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#6B7E94" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#6B7E94" }} axisLine={false} tickLine={false} />
              <Tooltip />
              <Line type="linear" dataKey="count" stroke={lineColor} strokeWidth={1.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
          <p className="text-xs text-[#6B7E94] text-center">No maintenance data yet</p>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm flex flex-col gap-4">
          <h2 className="text-base font-bold text-[#1E1208]">Most Common Problems</h2>
          <p className="text-xs text-[#6B7E94]">No recorded problems yet</p>
        </div>
      </div>
    </div>
  );
}

function OccupancyBar({ label, percent, color }: { label: string; percent: number; color: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between text-xs font-medium text-[#1E1208]">
        <span>{label}</span>
        <span>{percent}%</span>
      </div>
      <div className="h-7 rounded-full overflow-hidden bg-[#F0EBE3]">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${percent}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}
