"use client";

import { useState, useMemo, useCallback, useRef } from "react";
import Link from "next/link";
import type { AllDeal } from "./page";
import type { DealHistory, HistoryActivity, HistoryContact } from "@/app/api/deals/[id]/history/route";

type HistoryState = DealHistory | "loading" | "error";

function toTitleCase(s?: string): string {
  if (!s) return "";
  return s.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}

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
    return <div style={{ padding: "16px 0", display: "flex", justifyContent: "center" }}>
      <div style={{ width: 16, height: 16, borderRadius: "50%", border: "2.5px solid #d1d5db", borderTopColor: "#7b1fa2", animation: "spin 0.7s linear infinite" }} />
    </div>;
  }
  if (history === "error") {
    return <div style={{ padding: "12px 0", textAlign: "center" }}>
      <p style={{ fontSize: 13, color: "#6b7280" }}>Could not load history.</p>
      <button onClick={onRetry} style={{ fontSize: 13, color: "#7b1fa2", background: "none", border: "none", cursor: "pointer", marginTop: 4 }}>Retry</button>
    </div>;
  }

  const { contacts, activities } = history;
  const typeColors: Record<HistoryActivity["type"], string> = { task: "#1565a0", call: "#2e7d32", email: "#7b1fa2", note: "#2e86c1" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {contacts.length > 0 && (
        <div>
          <p style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 }}>Surgeons / Contacts</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {contacts.map((c: HistoryContact) => (
              <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 8, background: "#f3e5f5", borderRadius: 10, padding: "6px 10px" }}>
                <div style={{ width: 24, height: 24, borderRadius: "50%", background: "#7b1fa2", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ color: "#fff", fontSize: 10, fontWeight: 700 }}>{c.name.charAt(0).toUpperCase()}</span>
                </div>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "#0c2d48", lineHeight: 1.2 }}>{c.name}</p>
                  {c.title && <p style={{ fontSize: 11, color: "#6b7280", lineHeight: 1.2 }}>{c.title}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {activities.length > 0 && (
        <div>
          <p style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 }}>Recent Activity</p>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
            {activities.map((a: HistoryActivity) => (
              <li key={a.id} style={{ display: "flex", gap: 10 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#0c2d48", flexShrink: 0, marginTop: 6 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: typeColors[a.type] }}>{a.type}</span>
                    <span style={{ fontSize: 12, color: "#374151" }}>{formatTimestamp(a.timestamp)}</span>
                  </div>
                  {a.subject && <p style={{ fontSize: 14, fontWeight: 600, color: "#0c2d48" }}>{a.subject}</p>}
                  {a.body && <p style={{ fontSize: 13, color: "#374151", lineHeight: 1.4 }}>{a.body}</p>}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
      {contacts.length === 0 && activities.length === 0 && (
        <p style={{ fontSize: 13, color: "#6b7280", textAlign: "center", padding: "8px 0" }}>No activity recorded yet.</p>
      )}
    </div>
  );
}

export default function AllDealsClient({ deals }: { deals: AllDeal[] }) {
  const PAGE_SIZE = 20;
  const [search, setSearch] = useState("");
  const [ownerFilter, setOwnerFilter] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [historyCache, setHistoryCache] = useState<Record<string, HistoryState>>({});
  const fetchedRef = useRef<Set<string>>(new Set());

  const owners = useMemo(() => {
    const map = new Map<string, string>();
    for (const d of deals) {
      if (d.properties.ownerName) map.set(d.properties.ownerName, d.properties.ownerName);
    }
    return Array.from(map.keys()).sort();
  }, [deals]);

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
    const now = Date.now();
    const q = search.trim().toLowerCase();

    const toMs = (dateStr?: string): number | null => {
      if (!dateStr) return null;
      const d = /^\d+$/.test(dateStr) ? new Date(Number(dateStr)) : new Date(dateStr);
      return isNaN(d.getTime()) ? null : d.getTime();
    };

    return deals
      .filter((d) => {
        const nameMatch = !q || (d.properties.dealname ?? "").toLowerCase().includes(q) || (d.properties.ownerName ?? "").toLowerCase().includes(q);
        const ownerMatch = !ownerFilter || d.properties.ownerName === ownerFilter;
        return nameMatch && ownerMatch;
      })
      .sort((a, b) => {
        const aMs = toMs(a.properties.closedate);
        const bMs = toMs(b.properties.closedate);
        // No date → push to bottom
        if (aMs === null && bMs === null) return 0;
        if (aMs === null) return 1;
        if (bMs === null) return -1;
        const aOverdue = aMs < now;
        const bOverdue = bMs < now;
        // Overdue before upcoming
        if (aOverdue && !bOverdue) return -1;
        if (!aOverdue && bOverdue) return 1;
        // Within same group: earliest date first
        return aMs - bMs;
      });
  }, [deals, search, ownerFilter]);

  return (
    <>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Search + owner filter */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <div style={{ flex: 1, position: "relative" }}>
          <svg style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#94a3b8" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
          <input type="text" placeholder="Search deals or owners…" value={search}
            onChange={(e) => { setSearch(e.target.value); setVisibleCount(PAGE_SIZE); }}
            style={{ width: "100%", background: "#fff", border: "1px solid #dce4ec", borderRadius: 12, paddingLeft: 36, paddingRight: 12, paddingTop: 12, paddingBottom: 12, fontSize: 15, color: "#0c2d48", outline: "none", boxSizing: "border-box" }}
            onFocus={(e) => { e.currentTarget.style.borderColor = "#7b1fa2"; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = "#dce4ec"; }}
          />
        </div>
        {owners.length > 1 && (
          <select value={ownerFilter} onChange={(e) => { setOwnerFilter(e.target.value); setVisibleCount(PAGE_SIZE); }}
            style={{ background: "#fff", border: "1px solid #dce4ec", borderRadius: 12, padding: "0 12px", fontSize: 13, color: "#0c2d48", outline: "none", cursor: "pointer", flexShrink: 0 }}>
            <option value="">All owners</option>
            {owners.map((o) => <option key={o} value={o}>{toTitleCase(o)}</option>)}
          </select>
        )}
      </div>

      {filtered.length === 0 ? (
        <p style={{ color: "#6b7280", textAlign: "center", marginTop: 48, fontSize: 15 }}>No deals found.</p>
      ) : (
        <>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>
            {filtered.slice(0, visibleCount).map((deal) => {
              const name = toTitleCase(deal.properties.dealname) || "Unnamed Deal";
              const amount = formatCurrency(deal.properties.amount);
              const closeDate = formatDate(deal.properties.closedate);
              const stage = deal.properties.dealstage;
              const daysUntil = getDaysUntil(deal.properties.closedate);
              const isOverdue = daysUntil !== null && daysUntil < 0;
              const isSoon = daysUntil !== null && daysUntil >= 0 && daysUntil <= 7;
              const isExpanded = expandedId === deal.id;
              const history = historyCache[deal.id];

              return (
                <li key={deal.id}>
                  <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #dce4ec", boxShadow: "0 1px 3px rgba(12,45,72,0.04)", overflow: "hidden" }}>
                    <button onClick={() => handleExpand(deal.id)}
                      style={{ width: "100%", textAlign: "left", padding: "16px 16px 12px", background: "transparent", border: "none", cursor: "pointer" }}>
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                        <p style={{ fontWeight: 700, fontSize: 15, color: "#0c2d48", lineHeight: 1.3, flex: 1, minWidth: 0 }}>{name}</p>
                        {amount && <span style={{ fontSize: 14, fontWeight: 700, color: "#0c2d48", flexShrink: 0 }}>{amount}</span>}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6, flexWrap: "wrap" }}>
                        {/* Owner badge */}
                        <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 999, background: "#f3e5f5", color: "#7b1fa2" }}>
                          {toTitleCase(deal.properties.ownerName) || "Unassigned"}
                        </span>
                        {stage && <span style={{ fontSize: 12, color: "#374151" }}>{stage}</span>}
                        {closeDate && (
                          <span style={{ fontSize: 12, fontWeight: 500, color: isOverdue ? "#dc2626" : isSoon ? "#d97706" : "#374151" }}>
                            {isOverdue ? `Overdue ${closeDate}` : isSoon ? `Due ${closeDate}` : closeDate}
                          </span>
                        )}
                      </div>
                    </button>

                    {/* Actions */}
                    <div style={{ display: "flex", borderTop: "1px solid #dce4ec" }}>
                      <Link href={`/deals/${deal.id}/note`}
                        style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "13px 0", fontSize: 13, fontWeight: 700, color: "#1565a0", borderRight: "1px solid #dce4ec", textDecoration: "none" }}>
                        <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-5m-1.414-9.414a2 2 0 1 1 2.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        Note
                      </Link>
                      <Link href={`/deals/${deal.id}/new`}
                        style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "13px 0", fontSize: 13, fontWeight: 700, color: "#7b1fa2", textDecoration: "none" }}>
                        Log Task
                        <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                      </Link>
                    </div>

                    {/* Activity toggle */}
                    <button onClick={() => handleExpand(deal.id)}
                      style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 16px", background: "#f5eeff", border: "none", borderTop: "1px solid #dce4ec", cursor: "pointer" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, color: "#0c2d48" }}>
                        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#374151" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" /></svg>
                        Contacts &amp; Activity
                      </span>
                      <svg style={{ width: 16, height: 16, color: "#374151", transform: isExpanded ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {isExpanded && (
                      <div style={{ padding: "12px 16px 16px", borderTop: "1px solid #dce4ec" }}>
                        {history && <HistoryPanel history={history} dealId={deal.id} onRetry={() => { fetchedRef.current.delete(deal.id); fetchHistory(deal.id); }} />}
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
          {visibleCount < filtered.length && (
            <button onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
              style={{ width: "100%", marginTop: 12, padding: "14px 0", borderRadius: 12, border: "1px solid #dce4ec", background: "#fff", fontSize: 14, color: "#374151", fontWeight: 500, cursor: "pointer" }}>
              Load more ({filtered.length - visibleCount} remaining)
            </button>
          )}
        </>
      )}
    </>
  );
}
