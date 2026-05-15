"use client";

import { useState, useMemo, useCallback, useRef } from "react";
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
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

function toMMDDYYYY(d: Date): string {
  return `${String(d.getUTCMonth() + 1).padStart(2, "0")}/${String(d.getUTCDate()).padStart(2, "0")}/${d.getUTCFullYear()}`;
}

function formatDate(dateStr?: string): string | null {
  if (!dateStr) return null;
  const d = /^\d+$/.test(dateStr) ? new Date(Number(dateStr)) : new Date(dateStr);
  return isNaN(d.getTime()) ? null : toMMDDYYYY(d);
}

function formatTimestamp(ts: number): string {
  if (!ts) return "";
  const d = new Date(ts);
  return isNaN(d.getTime()) ? "" : toMMDDYYYY(d);
}

function getDaysUntil(closeDateStr?: string): number | null {
  if (!closeDateStr) return null;
  const d = /^\d+$/.test(closeDateStr) ? new Date(Number(closeDateStr)) : new Date(closeDateStr);
  if (isNaN(d.getTime())) return null;
  return (d.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
}

function HistoryPanel({ history, onRetry, dealId }: { history: HistoryState; onRetry: () => void; dealId: string }) {
  if (history === "loading") {
    return (
      <div className="py-4 flex justify-center">
        <div className="w-4 h-4 rounded-full border-2 border-[#ebebeb] border-t-[#999] animate-spin" />
      </div>
    );
  }
  if (history === "error") {
    return (
      <div className="py-3 text-center">
        <p className="text-[13px] text-[#999999]">Could not load history.</p>
        <button onClick={onRetry} className="text-[13px] text-[#F97316] mt-1">Retry</button>
      </div>
    );
  }

  const { contacts, activities } = history;
  const empty = contacts.length === 0 && activities.length === 0;

  const typeColors: Record<HistoryActivity["type"], string> = {
    task: "text-[#2563EB]", call: "text-green-700", email: "text-violet-700", note: "text-[#F97316]",
  };

  return (
    <div className="space-y-4">
      {contacts.length > 0 && (
        <div>
          <p className="text-[11px] font-semibold text-[#555555] uppercase tracking-wider mb-2">Contacts</p>
          <div className="flex flex-wrap gap-2">
            {contacts.map((c: HistoryContact) => (
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
          <p className="text-[11px] font-semibold text-[#555555] uppercase tracking-wider mb-2">Recent Activity</p>
          <ul className="space-y-3">
            {activities.map((a: HistoryActivity) => (
              <li key={a.id} className="flex gap-2.5">
                <div className="w-1.5 h-1.5 rounded-full bg-[#333333] shrink-0 mt-1.5" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={`text-[11px] font-bold uppercase tracking-wide ${typeColors[a.type]}`}>{a.type}</span>
                    <span className="text-[12px] text-[#555555]">{formatTimestamp(a.timestamp)}</span>
                    {(a.type === "note" || a.type === "task") && (
                      <Link
                        href={a.type === "note" ? `/deals/${dealId}/note/${a.id}/edit` : `/deals/${dealId}/task/${a.id}/edit`}
                        className="ml-auto text-[11px] font-medium text-[#999999] border border-[#e0e0e0] rounded-md px-1.5 py-0.5 active:bg-[#FAFAF8] transition"
                      >
                        Edit
                      </Link>
                    )}
                  </div>
                  {a.subject && <p className="text-[14px] font-semibold text-[#111111] leading-snug">{a.subject}</p>}
                  {a.body && <p className="text-[13px] text-[#333333] leading-snug line-clamp-2 mt-0.5">{a.body}</p>}
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

export default function DealsClient({ deals }: { deals: Deal[] }) {
  const PAGE_SIZE = 20;
  const [search, setSearch] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [historyCache, setHistoryCache] = useState<Record<string, HistoryState>>({});
  const fetchedRef = useRef<Set<string>>(new Set());

  const handleSearch = useCallback((v: string) => { setSearch(v); setVisibleCount(PAGE_SIZE); }, []);

  const fetchHistory = useCallback(async (dealId: string) => {
    fetchedRef.current.add(dealId);
    setHistoryCache((prev) => ({ ...prev, [dealId]: "loading" }));
    try {
      const res = await fetch(`/api/deals/${dealId}/history`);
      if (!res.ok) throw new Error();
      const data: DealHistory = await res.json();
      setHistoryCache((prev) => ({ ...prev, [dealId]: data }));
    } catch {
      setHistoryCache((prev) => ({ ...prev, [dealId]: "error" }));
    }
  }, []);

  const handleExpand = useCallback((dealId: string) => {
    if (expandedId === dealId) { setExpandedId(null); return; }
    setExpandedId(dealId);
    if (!fetchedRef.current.has(dealId)) fetchHistory(dealId);
  }, [expandedId, fetchHistory]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const result = q
      ? deals.filter((d) => (d.properties.dealname ?? "").toLowerCase().includes(q))
      : [...deals];
    result.sort((a, b) => {
      const da = a.properties.closedate ? new Date(a.properties.closedate).getTime() : Infinity;
      const db = b.properties.closedate ? new Date(b.properties.closedate).getTime() : Infinity;
      return da - db;
    });
    return result;
  }, [deals, search]);

  return (
    <>
      {/* Search */}
      <div className="relative mb-3">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#999999]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
        </svg>
        <input
          type="text"
          placeholder="Search deals…"
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-full bg-white border border-[#ebebeb] rounded-xl pl-9 pr-3 py-3 text-[15px] text-[#111111] placeholder-[#999999] focus:outline-none focus:border-[#F97316] transition"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="text-[#999999] text-center mt-16 text-[15px]">No open deals found.</p>
      ) : (
        <>
          <ul className="space-y-2">
            {filtered.slice(0, visibleCount).map((deal) => {
              const name = deal.properties.dealname ?? "Unnamed Deal";
              const amount = formatCurrency(deal.properties.amount);
              const closeDate = formatDate(deal.properties.closedate);
              const stage = deal.properties.dealstage;
              const pipeline = deal.properties.pipeline;
              const daysUntil = getDaysUntil(deal.properties.closedate);
              const isOverdue = daysUntil !== null && daysUntil < 0;
              const isSoon = daysUntil !== null && daysUntil >= 0 && daysUntil <= 7;
              const isExpanded = expandedId === deal.id;
              const history = historyCache[deal.id];

              return (
                <li key={deal.id}>
                  <div className="bg-white rounded-xl border border-[#ebebeb] overflow-hidden">
                    {/* Main info row */}
                    <button
                      onClick={() => handleExpand(deal.id)}
                      className="w-full text-left px-4 pt-4 pb-3 active:bg-[#FAFAF8] transition"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <p className="font-semibold text-[16px] text-[#111111] leading-snug flex-1 min-w-0">{name}</p>
                        {amount && <span className="text-[15px] font-semibold text-[#111111] shrink-0">{amount}</span>}
                      </div>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        {stage && (
                          <span className="text-[12px] text-[#666666]">{stage}</span>
                        )}
                        {stage && closeDate && <span className="text-[#aaaaaa]">·</span>}
                        {closeDate && (
                          <span className={`text-[12px] font-medium ${isOverdue ? "text-red-600" : isSoon ? "text-amber-600" : "text-[#666666]"}`}>
                            {isOverdue ? `Overdue ${closeDate}` : isSoon ? `Due ${closeDate}` : closeDate}
                          </span>
                        )}
                      </div>
                    </button>

                    {/* Action row — always visible */}
                    <div className="flex border-t border-[#f0f0f0]">
                      <Link
                        href={`/deals/${deal.id}/note`}
                        className="flex-1 flex items-center justify-center gap-1.5 py-3.5 text-[13px] font-semibold text-[#F97316] active:bg-[#FAFAF8] transition border-r border-[#f0f0f0]"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-5m-1.414-9.414a2 2 0 1 1 2.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Note
                      </Link>
                      <Link
                        href={`/deals/${deal.id}/new`}
                        className="flex-1 flex items-center justify-center gap-1.5 py-3.5 text-[13px] font-semibold text-[#2563EB] active:bg-[#FAFAF8] transition"
                      >
                        Log Task
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    </div>

                    {/* History toggle */}
                    <button
                      onClick={() => handleExpand(deal.id)}
                      className="w-full flex items-center justify-between px-4 py-3 border-t border-[#e0e0e0] bg-[#eeeef0] active:bg-[#e4e4e6] transition"
                    >
                      <span className="flex items-center gap-1.5 text-[13px] font-semibold text-[#333333]">
                        <svg className="w-3.5 h-3.5 text-[#555555]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
                        </svg>
                        Activity
                      </span>
                      <svg className={`w-4 h-4 text-[#333333] transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {/* Expanded panel */}
                    {isExpanded && (
                      <div className="px-4 pt-1 pb-4 border-t border-[#f0f0f0]">
                        <div className="flex items-start justify-between mt-3 mb-3">
                          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 flex-1">
                            {[["Amount", amount ?? "—"], ["Close Date", closeDate ?? "—"], ["Pipeline", pipeline ?? "—"], ["Stage", stage ?? "—"]].map(([label, value]) => (
                              <div key={label}>
                                <dt className="text-[11px] font-semibold text-[#555555] uppercase tracking-wider mb-0.5">{label}</dt>
                                <dd className="text-[14px] font-medium text-[#111111]">{value}</dd>
                              </div>
                            ))}
                          </dl>
                          <Link
                            href={`/deals/${deal.id}/edit`}
                            className="shrink-0 flex items-center gap-1 text-[12px] font-medium text-[#666666] border border-[#e0e0e0] rounded-lg px-2.5 py-1.5 active:bg-[#FAFAF8] transition ml-3"
                          >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 1 1 3.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                            Edit deal
                          </Link>
                        </div>
                        {history && (
                          <HistoryPanel
                            history={history}
                            dealId={deal.id}
                            onRetry={() => { fetchedRef.current.delete(deal.id); fetchHistory(deal.id); }}
                          />
                        )}
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
              className="w-full mt-3 py-3.5 rounded-xl border border-[#ebebeb] bg-white text-[14px] text-[#666666] font-medium active:bg-[#FAFAF8] transition"
            >
              Load more ({filtered.length - visibleCount} remaining)
            </button>
          )}
        </>
      )}
    </>
  );
}
