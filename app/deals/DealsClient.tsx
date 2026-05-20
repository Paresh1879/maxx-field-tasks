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
        <div style={{ width: 16, height: 16, borderRadius: "50%", border: "2.5px solid #d1d5db", borderTopColor: "#1565a0", animation: "spin 0.7s linear infinite" }} />
      </div>
    );
  }
  if (history === "error") {
    return (
      <div className="py-3 text-center">
        <p style={{ fontSize: 13, color: "#6b7280" }}>Could not load history.</p>
        <button onClick={onRetry} style={{ fontSize: 13, color: "#1565a0", marginTop: 4, background: "none", border: "none", cursor: "pointer" }}>Retry</button>
      </div>
    );
  }

  const { contacts, activities } = history;
  const empty = contacts.length === 0 && activities.length === 0;

  const typeColors: Record<HistoryActivity["type"], string> = {
    task: "#1565a0", call: "#2e7d32", email: "#7b1fa2", note: "#d97706",
  };

  return (
    <div className="space-y-4">
      {contacts.length > 0 && (
        <div>
          <p style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 }}>Contacts</p>
          <div className="flex flex-wrap gap-2">
            {contacts.map((c: HistoryContact) => (
              <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 6, background: "#eaf2f8", borderRadius: 10, padding: "6px 10px" }}>
                <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#dce4ec", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ color: "#374151", fontSize: 9, fontWeight: 700 }}>{c.name.charAt(0).toUpperCase()}</span>
                </div>
                <div style={{ minWidth: 0 }}>
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
          <p style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 }}>Recent Activity</p>
          <ul className="space-y-3">
            {activities.map((a: HistoryActivity) => (
              <li key={a.id} className="flex gap-2.5">
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#0c2d48", flexShrink: 0, marginTop: 6 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, color: typeColors[a.type] }}>{a.type}</span>
                    <span style={{ fontSize: 12, color: "#374151" }}>{formatTimestamp(a.timestamp)}</span>
                    {(a.type === "note" || a.type === "task") && (
                      <Link
                        href={a.type === "note" ? `/deals/${dealId}/note/${a.id}/edit` : `/deals/${dealId}/task/${a.id}/edit`}
                        style={{ marginLeft: "auto", fontSize: 11, fontWeight: 600, color: "#6b7280", border: "1px solid #dce4ec", borderRadius: 6, padding: "2px 8px", textDecoration: "none" }}
                      >
                        Edit
                      </Link>
                    )}
                  </div>
                  {a.subject && <p style={{ fontSize: 14, fontWeight: 400, color: "#0c2d48", lineHeight: 1.3 }}>{a.subject}</p>}
                  {a.body && <p style={{ fontSize: 13, color: "#374151", lineHeight: 1.4, marginTop: 2, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{a.body}</p>}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {empty && <p style={{ fontSize: 13, color: "#6b7280", textAlign: "center", padding: "8px 0" }}>No activity recorded yet.</p>}
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
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Search */}
      <div style={{ position: "relative", marginBottom: 12 }}>
        <svg style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 16, height: 16, color: "#94a3b8" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
        </svg>
        <input
          type="text"
          placeholder="Search deals…"
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          style={{
            width: "100%", background: "#fff", border: "1px solid #dce4ec", borderRadius: 12,
            paddingLeft: 36, paddingRight: 12, paddingTop: 12, paddingBottom: 12,
            fontSize: 15, color: "#0c2d48", outline: "none", boxSizing: "border-box",
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = "#1565a0"; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = "#dce4ec"; }}
        />
      </div>

      {filtered.length === 0 ? (
        <p style={{ color: "#6b7280", textAlign: "center", marginTop: 64, fontSize: 15 }}>No open deals found.</p>
      ) : (
        <>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>
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
                  <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #dce4ec", boxShadow: "0 1px 3px rgba(12,45,72,0.04)", overflow: "hidden" }}>
                    {/* Main info row */}
                    <button
                      onClick={() => handleExpand(deal.id)}
                      style={{ width: "100%", textAlign: "left", padding: "16px 16px 12px", background: "transparent", border: "none", cursor: "pointer" }}
                    >
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                        <p style={{ fontWeight: 700, fontSize: 16, color: "#0c2d48", lineHeight: 1.3, flex: 1, minWidth: 0 }}>{name}</p>
                        {amount && <span style={{ fontSize: 15, fontWeight: 700, color: "#0c2d48", flexShrink: 0 }}>{amount}</span>}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6, flexWrap: "wrap" }}>
                        {stage && <span style={{ fontSize: 12, color: "#374151" }}>{stage}</span>}
                        {stage && closeDate && <span style={{ color: "#94a3b8" }}>·</span>}
                        {closeDate && (
                          <span style={{ fontSize: 12, fontWeight: 500, color: isOverdue ? "#dc2626" : isSoon ? "#d97706" : "#374151" }}>
                            {isOverdue ? `Overdue ${closeDate}` : isSoon ? `Due ${closeDate}` : closeDate}
                          </span>
                        )}
                      </div>
                    </button>

                    {/* Action row */}
                    <div style={{ display: "flex", borderTop: "1px solid #dce4ec" }}>
                      <Link
                        href={`/deals/${deal.id}/note`}
                        style={{
                          flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                          padding: "14px 0", fontSize: 13, fontWeight: 700, color: "#1565a0",
                          borderRight: "1px solid #dce4ec", textDecoration: "none",
                        }}
                      >
                        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-5m-1.414-9.414a2 2 0 1 1 2.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Note
                      </Link>
                      <Link
                        href={`/deals/${deal.id}/new`}
                        style={{
                          flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                          padding: "14px 0", fontSize: 13, fontWeight: 700, color: "#2e86c1",
                          textDecoration: "none",
                        }}
                      >
                        Log Task
                        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    </div>

                    {/* History toggle */}
                    <button
                      onClick={() => handleExpand(deal.id)}
                      style={{
                        width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                        padding: "12px 16px",
                        background: "#eaf2f8", border: "none", borderTop: "1px solid #dce4ec", cursor: "pointer",
                      }}
                    >
                      <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, color: "#0c2d48" }}>
                        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ color: "#374151" }}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
                        </svg>
                        Activity
                      </span>
                      <svg style={{ width: 16, height: 16, color: "#374151", transform: isExpanded ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {/* Expanded panel */}
                    {isExpanded && (
                      <div style={{ padding: "4px 16px 16px", borderTop: "1px solid #dce4ec" }}>
                        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginTop: 12, marginBottom: 12 }}>
                          <dl style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px 24px", flex: 1 }}>
                            {[["Amount", amount ?? "—"], ["Close Date", closeDate ?? "—"], ["Pipeline", pipeline ?? "—"], ["Stage", stage ?? "—"]].map(([label, value]) => (
                              <div key={label}>
                                <dt style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2 }}>{label}</dt>
                                <dd style={{ fontSize: 14, fontWeight: 600, color: "#0c2d48" }}>{value}</dd>
                              </div>
                            ))}
                          </dl>
                          <Link
                            href={`/deals/${deal.id}/edit`}
                            style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 600, color: "#374151", border: "1px solid #dce4ec", borderRadius: 8, padding: "6px 10px", textDecoration: "none", marginLeft: 12 }}
                          >
                            <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
              style={{
                width: "100%", marginTop: 12, padding: "14px 0", borderRadius: 12,
                border: "1px solid #dce4ec", background: "#fff", fontSize: 14,
                color: "#374151", fontWeight: 500, cursor: "pointer",
              }}
            >
              Load more ({filtered.length - visibleCount} remaining)
            </button>
          )}
        </>
      )}
    </>
  );
}
