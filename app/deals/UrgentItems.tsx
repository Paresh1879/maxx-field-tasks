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
  if (diffDays < 0) return `${Math.abs(diffDays)}d ago`;
  return `In ${diffDays}d`;
}

function ItemRow({ item, accent }: { item: UrgentItem; accent: string }) {
  const href = item.type === "deal" ? `/deals/${item.dealId}/new` : "/deals/list";

  return (
    <Link href={href} style={{ textDecoration: "none", display: "block" }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: "10px 14px 10px 12px",
        borderLeft: `3px solid ${accent}`,
        borderRadius: "0 8px 8px 0",
        background: "#fafbfc",
        marginBottom: 6, cursor: "pointer",
        transition: "background 0.12s",
      }}
        onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = accent + "10"; }}
        onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = "#fafbfc"; }}
      >
        {/* Title */}
        <span style={{
          fontSize: 14, fontWeight: 600, color: "#0c2d48",
          flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {item.title}
        </span>

        {/* Type chip */}
        <span style={{
          fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 4,
          background: item.type === "deal" ? "#eaf2f8" : "#f3e5f5",
          color: item.type === "deal" ? "#1565a0" : "#7b1fa2",
          flexShrink: 0, letterSpacing: 0.3, textTransform: "uppercase",
        }}>
          {item.type}
        </span>

        {/* Date badge */}
        <span style={{
          fontSize: 12, fontWeight: 700,
          padding: "3px 9px", borderRadius: 6,
          background: accent + "18",
          color: accent,
          flexShrink: 0, minWidth: 60, textAlign: "center",
        }}>
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
      background: "#fff", borderRadius: 14,
      border: `1px solid ${overdue.length > 0 ? "#fecaca" : "#fed7aa"}`,
      overflow: "hidden", marginBottom: 24,
      boxShadow: "0 1px 4px rgba(12,45,72,0.06)",
    }}>
      {/* Header bar */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "12px 16px",
        background: overdue.length > 0 ? "#fef2f2" : "#fffbeb",
        borderBottom: `1px solid ${overdue.length > 0 ? "#fecaca" : "#fed7aa"}`,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <svg width="15" height="15" fill="none" viewBox="0 0 24 24"
            stroke={overdue.length > 0 ? "#dc2626" : "#d97706"} strokeWidth={2.5}
            strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <span style={{
            fontSize: 13, fontWeight: 700,
            color: overdue.length > 0 ? "#dc2626" : "#d97706",
          }}>
            {total} item{total !== 1 ? "s" : ""} need attention
          </span>
        </div>
        <Link href="/deals/list" style={{
          fontSize: 12, fontWeight: 600, color: "#1565a0",
          textDecoration: "none", display: "flex", alignItems: "center", gap: 3,
        }}>
          View all
          <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </Link>
      </div>

      {/* Body */}
      <div style={{ padding: "12px 12px 8px" }}>

        {/* Overdue section */}
        {overdue.length > 0 && (
          <div style={{ marginBottom: dueSoon.length > 0 ? 12 : 0 }}>
            <div style={{
              fontSize: 10, fontWeight: 800, color: "#dc2626",
              textTransform: "uppercase", letterSpacing: 1,
              marginBottom: 6, paddingLeft: 2,
            }}>
              Overdue · {overdue.length}
            </div>
            {overdue.map(item => (
              <ItemRow key={item.id + item.type} item={item} accent="#dc2626" />
            ))}
          </div>
        )}

        {/* Due this week section */}
        {dueSoon.length > 0 && (
          <div>
            {overdue.length > 0 && (
              <div style={{ height: 1, background: "#f0f0f0", margin: "0 0 10px 0" }} />
            )}
            <div style={{
              fontSize: 10, fontWeight: 800, color: "#d97706",
              textTransform: "uppercase", letterSpacing: 1,
              marginBottom: 6, paddingLeft: 2,
            }}>
              Due this week · {dueSoon.length}
            </div>
            {dueSoon.map(item => (
              <ItemRow key={item.id + item.type} item={item} accent="#d97706" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
