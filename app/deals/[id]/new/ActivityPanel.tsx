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

  const { contacts, companies, activities } = state;
  const empty = contacts.length === 0 && companies.length === 0 && activities.length === 0;

  return (
    <div className="space-y-4">
      {contacts.length > 0 && (
        <div>
          <p className="text-[11px] font-semibold text-[#999999] uppercase tracking-wider mb-2">Contacts</p>
          <div className="flex flex-wrap gap-2">
            {contacts.map((c) => (
              <Link key={c.id} href={`/deals/${dealId}/contact/${c.id}`} className="flex items-center gap-1.5 bg-[#FAFAF8] rounded-lg px-2.5 py-1.5 active:bg-[#f0f4f8] transition">
                <div className="w-5 h-5 rounded-full bg-[#ebebeb] flex items-center justify-center shrink-0">
                  <span className="text-[#666666] text-[9px] font-semibold">{c.name.charAt(0).toUpperCase()}</span>
                </div>
                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-[#111111] truncate leading-tight">{c.name}</p>
                  {c.title && <p className="text-[11px] text-[#999999] truncate leading-tight">{c.title}</p>}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {companies.length > 0 && (
        <div>
          <p className="text-[11px] font-semibold text-[#999999] uppercase tracking-wider mb-2">Companies</p>
          <div className="flex flex-wrap gap-2">
            {companies.map((co) => (
              <Link key={co.id} href={`/deals/${dealId}/company/${co.id}`} className="flex items-center gap-1.5 bg-[#FAFAF8] rounded-lg px-2.5 py-1.5 active:bg-[#f0f4f8] transition">
                <div className="w-5 h-5 rounded-md bg-[#ebebeb] flex items-center justify-center shrink-0">
                  <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="#666" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-[#111111] truncate leading-tight">{co.name}</p>
                  {co.domain && <p className="text-[11px] text-[#999999] truncate leading-tight">{co.domain}</p>}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

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
