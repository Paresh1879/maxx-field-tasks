"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { DealHistory } from "@/app/api/deals/[id]/history/route";

export default function PeoplePanel({ dealId }: { dealId: string }) {
  const [data, setData] = useState<Pick<DealHistory, "contacts" | "companies"> | null>(null);

  useEffect(() => {
    fetch(`/api/deals/${dealId}/history`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d: DealHistory) => setData({ contacts: d.contacts, companies: d.companies }))
      .catch(() => setData({ contacts: [], companies: [] }));
  }, [dealId]);

  if (!data || (data.contacts.length === 0 && data.companies.length === 0)) return null;

  return (
    <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #dce4ec", padding: "14px 16px" }}>
      <p style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 }}>People</p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {data.contacts.map((c) => (
          <Link
            key={c.id}
            href={`/deals/${dealId}/contact/${c.id}`}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              background: "#f4f8fb", border: "1px solid #dce4ec", borderRadius: 10,
              padding: "8px 12px", textDecoration: "none",
            }}
          >
            <div style={{
              width: 28, height: 28, borderRadius: "50%", background: "#e8f0f8",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#1565a0" }}>{c.name.charAt(0).toUpperCase()}</span>
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: "#0c2d48", margin: 0, lineHeight: 1.2 }}>{c.name}</p>
              {c.title && <p style={{ fontSize: 11, color: "#94a3b8", margin: 0, lineHeight: 1.2 }}>{c.title}</p>}
            </div>
            <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="#94a3b8" strokeWidth={2.5} style={{ flexShrink: 0 }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        ))}
        {data.companies.map((co) => (
          <Link
            key={co.id}
            href={`/deals/${dealId}/company/${co.id}`}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              background: "#f4f8fb", border: "1px solid #dce4ec", borderRadius: 10,
              padding: "8px 12px", textDecoration: "none",
            }}
          >
            <div style={{
              width: 28, height: 28, borderRadius: 8, background: "#e8f0f8",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#1565a0" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: "#0c2d48", margin: 0, lineHeight: 1.2 }}>{co.name}</p>
              {co.domain && <p style={{ fontSize: 11, color: "#94a3b8", margin: 0, lineHeight: 1.2 }}>{co.domain}</p>}
            </div>
            <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="#94a3b8" strokeWidth={2.5} style={{ flexShrink: 0 }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        ))}
      </div>
    </div>
  );
}
