"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { UrgentItem, UrgentResponse } from "@/app/api/urgent-items/route";

function relativeDate(ms: number): string {
  const now = Date.now();
  const diffDays = Math.round((ms - now) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays === -1) return "Yesterday";
  if (diffDays < 0) return `${Math.abs(diffDays)}d overdue`;
  return `In ${diffDays}d`;
}

function ItemRow({ item, accent }: { item: UrgentItem; accent: string }) {
  const href = item.type === "deal" ? `/deals/${item.dealId}/new` : "/deals/list";
  const icon = item.type === "deal" ? (
    <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <rect x="2" y="7" width="20" height="14" rx="2" />
      <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
    </svg>
  ) : (
    <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  );

  return (
    <Link href={href} style={{ textDecoration: "none" }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "8px 12px", borderRadius: 8,
        background: accent + "14",
        marginBottom: 4, cursor: "pointer",
        transition: "background 0.15s",
      }}
        onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = accent + "22"; }}
        onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = accent + "14"; }}
      >
        <span style={{ color: accent, flexShrink: 0 }}>{icon}</span>
        <span style={{ fontSize: 13, fontWeight: 600, color: "#0c2d48", flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {item.title}
        </span>
        {item.priority && item.priority !== "MEDIUM" && (
          <span style={{
            fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 4,
            background: item.priority === "HIGH" ? "#fef2f2" : "#f0fdf4",
            color: item.priority === "HIGH" ? "#dc2626" : "#16a34a",
            flexShrink: 0,
          }}>
            {item.priority}
          </span>
        )}
        <span style={{ fontSize: 12, fontWeight: 600, color: accent, flexShrink: 0 }}>
          {relativeDate(item.dueMs)}
        </span>
      </div>
    </Link>
  );
}

export default function UrgentItems() {
  const [data, setData] = useState<UrgentResponse | null>(null);

  useEffect(() => {
    fetch("/api/urgent-items")
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setData(d); })
      .catch(() => {});
  }, []);

  if (!data) return null;

  const { overdue, dueSoon } = data;
  const total = overdue.length + dueSoon.length;
  if (total === 0) return null;

  return (
    <div style={{
      background: "#fff", borderRadius: 14, border: "1px solid #dce4ec",
      padding: "16px 16px 12px", marginBottom: 24,
      boxShadow: "0 1px 3px rgba(12,45,72,0.04)",
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8,
            background: overdue.length > 0 ? "#fef2f2" : "#fffbeb",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke={overdue.length > 0 ? "#dc2626" : "#d97706"} strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            </svg>
          </div>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#0c2d48" }}>
            {total} item{total !== 1 ? "s" : ""} need{total === 1 ? "s" : ""} attention
          </span>
        </div>
        <Link href="/deals/list" style={{ fontSize: 12, fontWeight: 600, color: "#1565a0", textDecoration: "none" }}>
          View all →
        </Link>
      </div>

      {/* Overdue */}
      {overdue.length > 0 && (
        <div style={{ marginBottom: dueSoon.length > 0 ? 12 : 0 }}>
          <div style={{
            fontSize: 10, fontWeight: 800, color: "#dc2626",
            textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6,
            display: "flex", alignItems: "center", gap: 6,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#dc2626", display: "inline-block" }} />
            Overdue · {overdue.length}
          </div>
          {overdue.map(item => <ItemRow key={item.id + item.type} item={item} accent="#dc2626" />)}
        </div>
      )}

      {/* Due this week */}
      {dueSoon.length > 0 && (
        <div>
          <div style={{
            fontSize: 10, fontWeight: 800, color: "#d97706",
            textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6,
            display: "flex", alignItems: "center", gap: 6,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#d97706", display: "inline-block" }} />
            Due this week · {dueSoon.length}
          </div>
          {dueSoon.map(item => <ItemRow key={item.id + item.type} item={item} accent="#d97706" />)}
        </div>
      )}
    </div>
  );
}
