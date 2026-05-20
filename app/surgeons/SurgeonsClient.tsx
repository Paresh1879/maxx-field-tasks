"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

export type Contact = {
  id: string;
  firstname: string;
  lastname: string;
  email: string;
  phone: string;
  jobtitle: string;
  company: string;
};

function formatPhone(s: string): string {
  if (!s) return "";
  const d = s.replace(/\D/g, "");
  return d.length === 10 ? `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}` : s;
}

/**
 * HubSpot sometimes stores the full credentialed name in both firstname and lastname
 * (e.g. firstname = "Michael J. Taunton, MD", lastname = "Michael J. Taunton, MD").
 * This returns a clean display name without duplicates.
 */
function getDisplayName(firstname: string, lastname: string): string {
  const fn = firstname.trim();
  const ln = lastname.trim();
  if (!fn && !ln) return "Unknown";
  // If both are the same, or one contains the other, just show the longer one
  if (!ln || fn === ln || fn.toLowerCase().includes(ln.toLowerCase())) return fn || "Unknown";
  if (ln.toLowerCase().includes(fn.toLowerCase())) return ln || "Unknown";
  return `${fn} ${ln}`;
}

function ContactCard({ c }: { c: Contact }) {
  const name = getDisplayName(c.firstname, c.lastname);
  const initial = name.charAt(0).toUpperCase();
  const phone = formatPhone(c.phone);

  return (
    <div style={{
      background: "#fff", borderRadius: 14, padding: "18px 18px 14px",
      marginBottom: 10, border: "1px solid #dce4ec",
      boxShadow: "0 1px 3px rgba(12,45,72,0.03)",
      transition: "box-shadow 0.15s",
    }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = "0 4px 16px rgba(21,101,160,0.10)"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = "0 1px 3px rgba(12,45,72,0.03)"; }}
    >
      {/* Name + avatar */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 10 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12, flexShrink: 0,
          background: "linear-gradient(135deg, #1565a0 0%, #2e86c1 100%)",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "#fff", fontSize: 18, fontWeight: 700,
        }}>
          {initial}
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <Link
            href={`/surgeons/${c.id}`}
            style={{ fontSize: 16, fontWeight: 700, color: "#0c2d48", lineHeight: 1.2, textDecoration: "none", display: "block" }}
          >
            {name}
          </Link>
          {c.jobtitle && (
            <span style={{
              display: "inline-block", marginTop: 4, padding: "2px 9px", borderRadius: 999,
              fontSize: 11, fontWeight: 600, letterSpacing: 0.2,
              background: "#dce8f5", color: "#1565a0",
              border: "1px solid #dce4ec",
            }}>{c.jobtitle}</span>
          )}
        </div>
        <Link
          href={`/surgeons/${c.id}`}
          style={{ fontSize: 12, fontWeight: 600, color: "#1565a0", textDecoration: "none", flexShrink: 0, display: "flex", alignItems: "center", gap: 3 }}
        >
          View profile
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </Link>
      </div>

      {/* Details */}
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {c.company && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#374151" }}>
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#94a3b8" strokeWidth={2} style={{ flexShrink: 0 }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v5m-4 0h4" />
            </svg>
            {c.company}
          </div>
        )}
        {phone && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#94a3b8" strokeWidth={2} style={{ flexShrink: 0 }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 0 1 2-2h3.28a1 1 0 0 1 .948.684l1.498 4.493a1 1 0 0 1-.502 1.21l-2.257 1.13a11.042 11.042 0 0 0 5.516 5.516l1.13-2.257a1 1 0 0 1 1.21-.502l4.493 1.498A1 1 0 0 1 21 15.72V19a2 2 0 0 1-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            <a href={`tel:${c.phone}`} style={{ color: "#1565a0", textDecoration: "none", fontWeight: 500 }}>{phone}</a>
          </div>
        )}
        {c.email && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#94a3b8" strokeWidth={2} style={{ flexShrink: 0 }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 0 0 2.22 0L21 8M5 19h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2z" />
            </svg>
            <a href={`mailto:${c.email}`} style={{ color: "#1565a0", textDecoration: "none", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.email}</a>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SurgeonsClient({ surgeons, others }: { surgeons: Contact[]; others: Contact[] }) {
  const [search, setSearch] = useState("");
  const [showAll, setShowAll] = useState(false);

  const contacts = showAll ? [...surgeons, ...others] : surgeons;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return contacts;
    return contacts.filter((c) => {
      const name = [c.firstname, c.lastname].join(" ").toLowerCase();
      return name.includes(q) || c.company.toLowerCase().includes(q) || c.jobtitle.toLowerCase().includes(q) || c.email.toLowerCase().includes(q);
    });
  }, [contacts, search]);

  return (
    <>
      <div style={{ position: "relative", marginBottom: 14 }}>
        <svg style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
        </svg>
        <input
          type="text"
          placeholder="Search by name, company, or title…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: "100%", background: "#fff", border: "1px solid #dce4ec", borderRadius: 12,
            paddingLeft: 36, paddingRight: 12, paddingTop: 12, paddingBottom: 12,
            fontSize: 15, color: "#0c2d48", outline: "none", boxSizing: "border-box",
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = "#1565a0"; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = "#dce4ec"; }}
        />
      </div>

      {/* Show all toggle */}
      {others.length > 0 && (
        <button
          onClick={() => setShowAll((v) => !v)}
          style={{
            display: "flex", alignItems: "center", gap: 6, marginBottom: 12,
            background: showAll ? "#eaf2f8" : "#fff", border: "1px solid #dce4ec",
            borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontSize: 13, fontWeight: 600,
            color: showAll ? "#1565a0" : "#374151",
          }}
        >
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            {showAll
              ? <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0 1 12 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 0 1 1.563-3.029m5.858.908a3 3 0 1 1 4.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532 3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0 1 12 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 0 1-4.132 5.411m0 0L21 21" />
              : <><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></>
            }
          </svg>
          {showAll ? `Showing all ${surgeons.length + others.length} contacts` : `Show ${others.length} non-surgeon contact${others.length !== 1 ? "s" : ""}`}
        </button>
      )}

      <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 }}>
        {filtered.length === 0 ? "No surgeons found" : `${filtered.length} surgeon${filtered.length !== 1 ? "s" : ""}`}
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px 20px", color: "#6b7280", fontSize: 15 }}>
          {search ? "No contacts match that search." : "No contacts in HubSpot yet."}
        </div>
      ) : (
        filtered.map((c) => <ContactCard key={c.id} c={c} />)
      )}
    </>
  );
}
