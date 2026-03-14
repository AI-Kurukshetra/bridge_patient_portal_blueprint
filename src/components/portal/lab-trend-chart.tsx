"use client";

import { ResponsiveContainer, LineChart, CartesianGrid, Line, XAxis, YAxis, Tooltip } from "recharts";
import { formatDate } from "@/lib/utils";
import type { Row } from "@/types/database";

export function LabTrendChart({ data }: { data: Row<"lab_results">[] }) {
  const points = [...data]
    .filter((row) => row.result_value !== null)
    .slice(0, 6)
    .reverse()
    .map((row) => ({ label: formatDate(row.observed_at), value: row.result_value, test: row.test_name }));

  return (
    <div className="h-72 w-full rounded-3xl border border-white/10 bg-slate-950/80 p-4">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={points}>
          <CartesianGrid stroke="rgba(148,163,184,0.15)" vertical={false} />
          <XAxis dataKey="label" stroke="#94a3b8" fontSize={12} />
          <YAxis stroke="#94a3b8" fontSize={12} />
          <Tooltip contentStyle={{ backgroundColor: "#020617", border: "1px solid rgba(148,163,184,0.2)", borderRadius: 16 }} />
          <Line type="monotone" dataKey="value" stroke="#22d3ee" strokeWidth={3} dot={{ fill: "#34d399", r: 4 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

