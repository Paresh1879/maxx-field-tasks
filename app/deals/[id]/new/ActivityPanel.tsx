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
  task: "text-[#2563EB]", call: "text-green-700", email: "text-violet-700", note: "text-[#F97316]",
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

  const { contacts, activities } = state;
  const empty = contacts.length === 0 && activities.length === 0;

  return (
    <div className="space-y-4">
      {contacts.length > 0 && (
        <div>
          <p className="text-[11px] font-semibold text-[#999999] uppercase tracking-wider mb-2">Contacts</p>
          <div className="flex flex-wrap gap-2">
            {contacts.map((c) => (
              <div key={c.id} className="flex items-center gap-1.5 bg-[#FAFAF8] rounded-lg px-2.5 py-1.5">
                <div className="w-5 h-5 rounded-full bg-[#ebebeb] flex items-center justify-center shrink-0">
                  <span className="text-[#666666] text-[9px] font-semibold">{c.name.charAt(0).toUpperCase()}</span>
                </div>
                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-[#111111] truncate leading-tight">{c.name}</p>
                  {c.title && <p className="text-[11px] text-[#999999] truncate leading-tight">{c.title}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activities.length > 0 && (
        <div>
          <ul className="space-y-3">
            {activities.map((a) => (
              <li key={a.id} className="flex gap-2.5">
                <div className="w-1.5 h-1.5 rounded-full bg-[#888888] shrink-0 mt-1.5" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={`text-[11px] font-semibold uppercase tracking-wide ${typeColors[a.type]}`}>{a.type}</span>
                    <span className="text-[11px] text-[#888888]">{formatTimestamp(a.timestamp)}</span>
                    {(a.type === "note" || a.type === "task") && (
                      <Link
                        href={a.type === "note" ? `/deals/${dealId}/note/${a.id}/edit` : `/deals/${dealId}/task/${a.id}/edit`}
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
