"use client";

import { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import type { DealHistory, HistoryActivity, HistoryContact } from "@/app/api/deals/[id]/history/route";

type Deal = {
  id: string;
  properties: {
    dealname?: string;
    dealstage?: string;
    pipeline?: string;
    amount?: string;
    closedate?: string;
  };
};

type HistoryState = DealHistory | "loading" | "error";

function formatCurrency(amount?: string) {
  if (!amount) return null;
  const n = parseFloat(amount);
  if (isNaN(n)) return null;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

function formatDate(dateStr?: string) {
  if (!dateStr) return null;
  const d = /^\d+$/.test(dateStr) ? new Date(Number(dateStr)) : new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const yyyy = d.getUTCFullYear();
  return `${mm}/${dd}/${yyyy}`;
}

function formatTimestamp(ts: number): string {
  if (!ts) return "";
  const d = new Date(ts);
  if (isNaN(d.getTime())) return "";
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const yyyy = d.getUTCFullYear();
  return `${mm}/${dd}/${yyyy}`;
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

function HistoryPanel({ history }: { history: HistoryState }) {
  if (history === "loading") {
    return (
      <div className="flex items-center justify-center py-6">
        <svg className="animate-spin w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v8H4z" />
        </svg>
      </div>
    );
  }

  if (history === "error") {
    return (
      <p className="text-xs text-red-400 py-3 text-center">
        Could not load history.
      </p>
    );
  }

  const { contacts, activities } = history;
  const empty = contacts.length === 0 && activities.length === 0;

  return (
    <div className="space-y-4">
      {contacts.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold tracking-wider text-gray-400 uppercase mb-2">
            Contacts
          </p>
          <div className="flex flex-wrap gap-2">
            {contacts.map((c: HistoryContact) => (
              <div
                key={c.id}
                className="flex items-center gap-1.5 bg-gray-50 rounded-lg px-2.5 py-1.5"
              >
                <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                  <span className="text-indigo-600 text-[9px] font-bold">
                    {c.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-gray-700 truncate leading-tight">
                    {c.name}
                  </p>
                  {c.title && (
                    <p className="text-[10px] text-gray-400 truncate leading-tight">
                      {c.title}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activities.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold tracking-wider text-gray-400 uppercase mb-2">
            Recent Activity
          </p>
          <ul className="space-y-2">
            {activities.map((a: HistoryActivity) => {
              const typeStyle =
                a.type === "task"
                  ? { icon: "bg-indigo-100 text-indigo-600", label: "text-indigo-600" }
                  : a.type === "call"
                  ? { icon: "bg-green-100 text-green-600", label: "text-green-600" }
                  : a.type === "email"
                  ? { icon: "bg-purple-100 text-purple-600", label: "text-purple-600" }
                  : { icon: "bg-amber-100 text-amber-600", label: "text-amber-600" };
              return (
                <li key={a.id} className="flex gap-2.5 items-start">
                  <div className={`mt-0.5 shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${typeStyle.icon}`}>
                    <ActivityIcon type={a.type} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold uppercase ${typeStyle.label}`}>
                        {a.type}
                      </span>
                      <span className="text-[10px] text-gray-400">
                        {formatTimestamp(a.timestamp)}
                      </span>
                    </div>
                    {a.subject && (
                      <p className="text-xs font-medium text-gray-800 leading-snug truncate">
                        {a.subject}
                      </p>
                    )}
                    {a.body && (
                      <p className="text-xs text-gray-500 leading-snug line-clamp-2 mt-0.5">
                        {a.body}
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {empty && (
        <p className="text-xs text-gray-400 text-center py-2">
          No activity recorded yet.
        </p>
      )}
    </div>
  );
}

export default function DealsClient({ deals }: { deals: Deal[] }) {
  const PAGE_SIZE = 20;
  const [search, setSearch] = useState("");
  const [sortAsc, setSortAsc] = useState(true);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [historyCache, setHistoryCache] = useState<Record<string, HistoryState>>({});

  const handleSearch = useCallback((v: string) => {
    setSearch(v);
    setVisibleCount(PAGE_SIZE);
  }, []);

  const handleExpand = useCallback(
    async (dealId: string) => {
      if (expandedId === dealId) {
        setExpandedId(null);
        return;
      }
      setExpandedId(dealId);
      if (historyCache[dealId]) return;

      setHistoryCache((prev) => ({ ...prev, [dealId]: "loading" }));
      try {
        const res = await fetch(`/api/deals/${dealId}/history`);
        if (!res.ok) throw new Error("fetch failed");
        const data: DealHistory = await res.json();
        setHistoryCache((prev) => ({ ...prev, [dealId]: data }));
      } catch {
        setHistoryCache((prev) => ({ ...prev, [dealId]: "error" }));
      }
    },
    [expandedId, historyCache]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const result = q
      ? deals.filter((d) =>
          (d.properties.dealname ?? "").toLowerCase().includes(q)
        )
      : [...deals];

    result.sort((a, b) => {
      const da = a.properties.closedate
        ? new Date(a.properties.closedate).getTime()
        : 0;
      const db = b.properties.closedate
        ? new Date(b.properties.closedate).getTime()
        : 0;
      return sortAsc ? da - db : db - da;
    });

    return result;
  }, [deals, search, sortAsc]);

  return (
    <>
      {/* Controls */}
      <div className="flex gap-2 mb-5">
        <div className="relative flex-1">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
            />
          </svg>
          <input
            type="text"
            placeholder="Search deals..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
        </div>
        <button
          onClick={() => setSortAsc((v) => !v)}
          className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 bg-white shrink-0 active:bg-gray-50 transition"
        >
          <svg
            className="w-4 h-4 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"
            />
          </svg>
          {sortAsc ? "Date ↑" : "Date ↓"}
        </button>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <p className="text-gray-400 text-center mt-16">No open deals found.</p>
      ) : (
        <>
          <ul className="space-y-3">
            {filtered.slice(0, visibleCount).map((deal) => {
              const name = deal.properties.dealname ?? "Unnamed Deal";
              const amount = formatCurrency(deal.properties.amount);
              const closeDate = formatDate(deal.properties.closedate);
              const stage = deal.properties.dealstage;
              const pipeline = deal.properties.pipeline;
              const isExpanded = expandedId === deal.id;
              const history = historyCache[deal.id];

              return (
                <li key={deal.id}>
                  <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
                    {/* Tap to expand */}
                    <button
                      onClick={() => handleExpand(deal.id)}
                      className="w-full flex items-center gap-3 px-4 py-4 active:bg-gray-50 transition text-left"
                    >
                      <div className="shrink-0 w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                        <span className="text-indigo-600 font-bold text-sm">
                          {name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-base leading-snug truncate">
                          {name}
                        </p>
                        <div className="flex flex-wrap gap-2 mt-0.5 text-sm text-gray-400 items-center">
                          {amount && (
                            <span className="font-medium text-emerald-600">{amount}</span>
                          )}
                          {closeDate && <span>Closes {closeDate}</span>}
                          {stage && (
                            <span className="px-1.5 py-0.5 rounded-md bg-gray-100 text-gray-500 text-xs">
                              {stage}
                            </span>
                          )}
                        </div>
                      </div>
                      <svg
                        className={`shrink-0 text-gray-300 w-5 h-5 transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </button>

                    {/* Expanded history panel */}
                    {isExpanded && (
                      <div className="border-t border-gray-100 px-4 pt-3 pb-4">
                        {/* Deal details */}
                        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 mb-4 text-sm">
                          <div>
                            <dt className="text-[10px] font-semibold tracking-wider text-gray-400 uppercase">Amount</dt>
                            <dd className="text-gray-800 font-medium">{amount ?? "—"}</dd>
                          </div>
                          <div>
                            <dt className="text-[10px] font-semibold tracking-wider text-gray-400 uppercase">Close Date</dt>
                            <dd className="text-gray-800 font-medium">{closeDate ?? "—"}</dd>
                          </div>
                          <div>
                            <dt className="text-[10px] font-semibold tracking-wider text-gray-400 uppercase">Pipeline</dt>
                            <dd className="text-gray-800 font-medium">{pipeline ?? "—"}</dd>
                          </div>
                          <div>
                            <dt className="text-[10px] font-semibold tracking-wider text-gray-400 uppercase">Deal Stage</dt>
                            <dd className="text-gray-800 font-medium">{stage ?? "—"}</dd>
                          </div>
                        </dl>
                        {history && <HistoryPanel history={history} />}
                        <Link
                          href={`/deals/${deal.id}/new`}
                          className="mt-4 flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold active:bg-indigo-700 transition"
                        >
                          Log Task
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                          </svg>
                        </Link>
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
          {visibleCount < filtered.length && (
            <button
              onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
              className="w-full mt-4 py-3 rounded-2xl border border-gray-200 text-sm text-gray-500 active:bg-gray-50 transition"
            >
              Load more ({filtered.length - visibleCount} remaining)
            </button>
          )}
        </>
      )}
    </>
  );
}
