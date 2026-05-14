"use client";

import { useEffect, useState } from "react";
import type { DealHistory, HistoryActivity } from "@/app/api/deals/[id]/history/route";

const TYPE_STYLES: Record<HistoryActivity["type"], { icon: string; label: string }> = {
  task:  { icon: "bg-indigo-100 text-indigo-600", label: "text-indigo-600" },
  call:  { icon: "bg-green-100 text-green-600",   label: "text-green-600" },
  email: { icon: "bg-purple-100 text-purple-600", label: "text-purple-600" },
  note:  { icon: "bg-amber-100 text-amber-600",   label: "text-amber-600" },
};

function toMMDDYYYY(d: Date): string {
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${mm}/${dd}/${d.getUTCFullYear()}`;
}

function formatTimestamp(ts: number): string {
  if (!ts) return "";
  const d = new Date(ts);
  return isNaN(d.getTime()) ? "" : toMMDDYYYY(d);
}

function ActivityIcon({ type }: { type: HistoryActivity["type"] }) {
  if (type === "call") {
    return (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 0 1 2-2h3.28a1 1 0 0 1 .948.684l1.498 4.493a1 1 0 0 1-.502 1.21l-2.257 1.13a11.042 11.042 0 0 0 5.516 5.516l1.13-2.257a1 1 0 0 1 1.21-.502l4.493 1.498A1 1 0 0 1 21 18.72V21a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5z" />
      </svg>
    );
  }
  if (type === "email") {
    return (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 0 0 2.22 0L21 8M5 19h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2z" />
      </svg>
    );
  }
  if (type === "task") {
    return (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2m-6 9 2 2 4-4" />
      </svg>
    );
  }
  return (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-5m-1.414-9.414a2 2 0 1 1 2.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  );
}

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
      <div className="flex items-center justify-center py-6">
        <svg className="animate-spin w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v8H4z" />
        </svg>
      </div>
    );
  }

  if (state === "error") {
    return <p className="text-xs text-red-400 text-center py-3">Could not load history.</p>;
  }

  const { contacts, activities } = state;
  const empty = contacts.length === 0 && activities.length === 0;

  return (
    <div className="space-y-4">
      {contacts.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold tracking-wider text-gray-400 uppercase mb-2">Contacts</p>
          <div className="flex flex-wrap gap-2">
            {contacts.map((c) => (
              <div key={c.id} className="flex items-center gap-1.5 bg-gray-50 rounded-lg px-2.5 py-1.5">
                <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                  <span className="text-indigo-600 text-[9px] font-bold">{c.name.charAt(0).toUpperCase()}</span>
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-gray-700 truncate leading-tight">{c.name}</p>
                  {c.title && <p className="text-[10px] text-gray-400 truncate leading-tight">{c.title}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activities.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold tracking-wider text-gray-400 uppercase mb-2">Recent Activity</p>
          <ul className="space-y-2">
            {activities.map((a) => {
              const typeStyle = TYPE_STYLES[a.type];
              return (
                <li key={a.id} className="flex gap-2.5 items-start">
                  <div className={`mt-0.5 shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${typeStyle.icon}`}>
                    <ActivityIcon type={a.type} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold uppercase ${typeStyle.label}`}>{a.type}</span>
                      <span className="text-[10px] text-gray-400">{formatTimestamp(a.timestamp)}</span>
                    </div>
                    {a.subject && <p className="text-xs font-medium text-gray-800 leading-snug">{a.subject}</p>}
                    {a.body && <p className="text-xs text-gray-500 leading-snug mt-0.5">{a.body}</p>}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {empty && <p className="text-xs text-gray-400 text-center py-2">No activity recorded yet.</p>}
    </div>
  );
}
