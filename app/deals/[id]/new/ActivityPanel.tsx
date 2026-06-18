"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { DealHistory, HistoryActivity } from "@/app/api/deals/[id]/history/route";

function toMMDDYYYY(d: Date): string {
  return `${String(d.getUTCMonth() + 1).padStart(2, "0")}/${String(d.getUTCDate()).padStart(2, "0")}/${d.getUTCFullYear()}`;
}

function formatTimestamp(ts: number): string {
  if (!ts) return "";
  const d = new Date(ts);
  return isNaN(d.getTime()) ? "" : toMMDDYYYY(d);
}

const typeColors: Record<HistoryActivity["type"], string> = {
  task: "#7b1fa2", call: "#0891b2", email: "#1565a0", note: "#ea580c",
};
const typeBgs: Record<HistoryActivity["type"], string> = {
  task: "#f5f0f9", call: "#f0f9ff", email: "#eaf2f8", note: "#fff7ed",
};

export default function ActivityPanel({ dealId }: { dealId: string }) {
  const [state, setState] = useState<DealHistory | "loading" | "error">("loading");

  useEffect(() => {
    fetch(`/api/deals/${dealId}/history`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data: DealHistory) => setState(data))
      .catch(() => setState("error"));
  }, [dealId]);

  if (state === "loading") {
    return (
      <div className="py-4 flex justify-center">
        <div className="w-4 h-4 rounded-full border-2 border-[#ebebeb] border-t-[#999] animate-spin" />
      </div>
    );
  }

  if (state === "error") {
    return <p className="text-[13px] text-[#999999] text-center py-3">Could not load activity.</p>;
  }

  const { activities } = state;
  const empty = activities.length === 0;

  return (
    <div className="space-y-4">
      {activities.length > 0 && (
        <div>
          <ul className="space-y-3">
            {activities.map((a) => (
              <li key={`${a.type}-${a.id}`} style={{ background: typeBgs[a.type], borderRadius: 10, padding: "8px 10px", display: "flex", gap: 10 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: typeColors[a.type], flexShrink: 0, marginTop: 5 }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: typeColors[a.type] }}>{a.type}</span>
                    <span className="text-[11px] text-[#888888]">{formatTimestamp(a.timestamp)}</span>
                    {(a.type === "note" || a.type === "task") && (
                      <Link
                        href={a.type === "note" ? `/deals/${dealId}/note/${a.id}/edit?from=deal` : `/deals/${dealId}/task/${a.id}/edit?from=deal`}
                        className="ml-auto text-[11px] font-medium text-[#999999] border border-[#e0e0e0] rounded-md px-1.5 py-0.5 active:bg-[#FAFAF8] transition"
                      >
                        Edit
                      </Link>
                    )}
                  </div>
                  {a.subject && <p className="text-[13px] font-normal text-[#111111] leading-snug">{a.subject}</p>}
                  {a.body && <p className="text-[13px] text-[#666666] leading-snug line-clamp-2 mt-0.5">{a.body}</p>}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {empty && <p className="text-[13px] text-[#999999] text-center py-2">No activity recorded yet.</p>}
    </div>
  );
}
