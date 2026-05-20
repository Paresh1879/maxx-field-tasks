"use client";

import { useState } from "react";
import Link from "next/link";

const C = { brand: "#0c2d48", primary: "#1565a0", border: "#dce4ec", text: "#374151", textSec: "#6b7280", bg: "#f4f8fb" };
const SLATE = "#455a64";

interface Affiliate { Doctor: string; State: string; "Total Cases": number; "Shared Facilities": number }
interface NetworkResult { surgeon?: string; facilities?: string[]; affiliates?: Affiliate[]; error?: string }

type SortCol = keyof Affiliate;
type SortDir = "asc" | "desc";

export default function NetworksPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<NetworkResult | null>(null);
  const [sortCol, setSortCol] = useState<SortCol>("Total Cases");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  async function runSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!lastName.trim()) return;
    const name = [firstName, lastName].filter(Boolean).join(" ");
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/surgeon-network", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json() as NetworkResult;
      setResult(data);
    } catch {
      setResult({ error: "Request failed. Please try again." });
    } finally {
      setLoading(false);
    }
  }

  function handleSort(col: SortCol) {
    if (sortCol === col) setSortDir(d => d === "desc" ? "asc" : "desc");
    else { setSortCol(col); setSortDir("desc"); }
  }

  const sortedAffiliates = result?.affiliates ? [...result.affiliates].sort((a, b) => {
    const av = a[sortCol], bv = b[sortCol];
    if (typeof av === "number" && typeof bv === "number") return sortDir === "desc" ? bv - av : av - bv;
    return sortDir === "desc" ? String(bv).localeCompare(String(av)) : String(av).localeCompare(String(bv));
  }) : result?.affiliates;

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "var(--font-outfit), 'Outfit', sans-serif" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Header */}
      <div style={{ background: "linear-gradient(150deg, #263238 0%, #455a64 60%, #607d8b 100%)", padding: "20px 16px 20px", color: "#fff" }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <Link href="/deals" style={{ background: "rgba(255,255,255,0.15)", borderRadius: 8, color: "#fff", padding: "8px 10px", display: "flex", alignItems: "center", textDecoration: "none" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
            </Link>
            <div style={{ width: 34, height: 34, borderRadius: 9, background: "rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>🕸️</div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: -0.5 }}>Networks</div>
              <div style={{ fontSize: 12, opacity: 0.7, marginTop: 1 }}>Discover surgeon affiliations through shared facilities and practice networks</div>
            </div>
          </div>

          <form onSubmit={runSearch} style={{ display: "flex", gap: 8 }}>
            <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="First name"
              style={{ flex: 1, background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 10, padding: "11px 14px", fontSize: 14, color: "#fff", outline: "none", fontFamily: "inherit" }} />
            <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Last name *" required
              style={{ flex: 1, background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 10, padding: "11px 14px", fontSize: 14, color: "#fff", outline: "none", fontFamily: "inherit" }} />
            <button type="submit" disabled={loading} style={{ padding: "0 20px", background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.4)", borderRadius: 10, color: "#fff", fontSize: 14, fontWeight: 700, cursor: loading ? "wait" : "pointer", whiteSpace: "nowrap", fontFamily: "inherit" }}>
              {loading ? "…" : "Search"}
            </button>
          </form>
        </div>
      </div>

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "16px 16px 40px" }}>
        {loading && (
          <div style={{ textAlign: "center", padding: "24px 0", fontSize: 13, color: C.textSec }}>
            <div style={{ display: "inline-block", width: 20, height: 20, border: "2.5px solid #d1d5db", borderTopColor: SLATE, borderRadius: "50%", marginRight: 10, verticalAlign: "middle", animation: "spin 0.7s linear infinite" }} />
            Finding network affiliations…
          </div>
        )}

        {result?.error && (
          <div style={{ padding: "14px 16px", background: result.error.includes("Supabase") ? "#fffde7" : "#fef2f2", borderRadius: 12, color: result.error.includes("Supabase") ? "#5d4037" : "#dc2626", fontSize: 14, fontWeight: 500, border: `1px solid ${result.error.includes("Supabase") ? "#fff9c4" : "#fecaca"}` }}>
            {result.error.includes("Supabase") ? <><strong>Supabase not configured.</strong> Add <code>SUPABASE_KEY</code> to <code>.env.local</code>.</> : result.error}
          </div>
        )}

        {result && !result.error && (
          <>
            <div style={{ background: "#fff", borderRadius: 14, padding: 20, border: `1px solid ${C.border}`, marginBottom: 16, boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: C.brand, marginBottom: 4 }}>{result.surgeon}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.textSec, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>Facilities ({result.facilities?.length || 0})</div>
              {result.facilities && result.facilities.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {result.facilities.map((f, i) => (
                    <div key={i} style={{ fontSize: 14, color: C.brand, padding: "8px 12px", background: "#eceff1", borderRadius: 8, display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ color: SLATE }}>🏥</span> {f}
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: 14, color: C.textSec }}>No facility data found for this surgeon.</div>
              )}
            </div>

            {sortedAffiliates && sortedAffiliates.length > 0 && (
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.brand, marginBottom: 10 }}>
                  {sortedAffiliates.length} Co-affiliated Surgeons
                </div>
                <div style={{ overflowX: "auto", borderRadius: 14, border: `1px solid ${C.border}`, background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: "#f8fafc" }}>
                        {(["Doctor", "State", "Total Cases", "Shared Facilities"] as SortCol[]).map(col => (
                          <th key={col} onClick={() => handleSort(col)}
                            style={{ padding: "10px 14px", textAlign: "left", fontWeight: 700, color: sortCol === col ? SLATE : C.brand, fontSize: 12, textTransform: "uppercase", letterSpacing: 0.5, borderBottom: `1px solid ${C.border}`, whiteSpace: "nowrap", cursor: "pointer", userSelect: "none" }}>
                            {col} {sortCol === col ? (sortDir === "desc" ? "↓" : "↑") : ""}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {sortedAffiliates.map((aff, i) => (
                        <tr key={i} style={{ borderBottom: i < sortedAffiliates.length - 1 ? `1px solid ${C.border}` : "none" }}>
                          <td style={{ padding: "10px 14px" }}>
                            <Link href={`/surgeon-profile?last=${encodeURIComponent(aff.Doctor.split(",")[0].trim())}`}
                              style={{ color: C.primary, textDecoration: "none", fontWeight: 600 }}>{aff.Doctor}</Link>
                          </td>
                          <td style={{ padding: "10px 14px", color: C.textSec }}>{aff.State}</td>
                          <td style={{ padding: "10px 14px", color: SLATE, fontWeight: 700, fontFamily: "monospace" }}>{aff["Total Cases"].toLocaleString()}</td>
                          <td style={{ padding: "10px 14px" }}>
                            <span style={{ background: "#eceff1", color: SLATE, fontWeight: 700, padding: "3px 8px", borderRadius: 6, fontSize: 12 }}>{aff["Shared Facilities"]}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {result.facilities?.length === 0 || (result.affiliates?.length === 0) ? (
              <div style={{ textAlign: "center", padding: "24px", background: "#fff", borderRadius: 14, border: `1px solid ${C.border}`, color: C.textSec, fontSize: 14 }}>
                No affiliated surgeons found. Try a different name or check spelling.
              </div>
            ) : null}
          </>
        )}

        {!result && !loading && (
          <div style={{ textAlign: "center", padding: "40px 0", color: C.textSec, fontSize: 15 }}>
            Enter a surgeon&apos;s name above to discover their network affiliations.
          </div>
        )}

        <div style={{ marginTop: 32, paddingTop: 16, borderTop: `1px solid ${C.border}`, textAlign: "center" }}>
          <Link href="/deals" style={{ fontSize: 13, color: C.primary, textDecoration: "none", fontWeight: 600 }}>← Dashboard</Link>
        </div>
      </div>
    </div>
  );
}
