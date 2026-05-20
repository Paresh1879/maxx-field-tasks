"use client";

import { useState } from "react";
import Link from "next/link";

const C = { brand: "#0c2d48", primary: "#1565a0", border: "#dce4ec", text: "#374151", textSec: "#6b7280", bg: "#f4f8fb" };
const GREEN = "#2e7d32";

function fmtCell(col: string, val: unknown): string {
  if (val === null || val === undefined) return "";
  const s = String(val);
  const isMoneyCol = ["payment", "amount", "total", "fee"].some(k => col.toLowerCase().includes(k));
  if (isMoneyCol && /^\$?[\d,]+(\.\d+)?$/.test(s.replace(/\$/, "").trim())) return s.startsWith("$") ? s : `$${s}`;
  return s;
}

const CHIPS = [
  "Top paid surgeons in PA",
  "Stryker payments 2023",
  "Who gets the most from Zimmer Biomet?",
  "Consulting fees to orthopedic surgeons in NJ",
];

interface QueryResult {
  interpretation?: string;
  results?: Record<string, unknown>[];
  columns?: string[];
  error?: string;
}

export default function OpenPaymentsPage() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<QueryResult | null>(null);

  async function runQuery(q?: string) {
    const text = (q || query).trim();
    if (!text) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/payments-query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: text }),
      });
      const data = await res.json() as QueryResult;
      setResult(data);
    } catch {
      setResult({ error: "Request failed. Please try again." });
    } finally {
      setLoading(false);
    }
  }

  function downloadCSV() {
    if (!result?.results || !result.columns) return;
    const header = result.columns.join(",");
    const rows = result.results.map(r => result.columns!.map(c => `"${String(r[c] ?? "").replace(/"/g, '""')}"`).join(","));
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "open-payments.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "var(--font-outfit), 'Outfit', sans-serif" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Header */}
      <div style={{ background: "linear-gradient(150deg, #1b5e20 0%, #2e7d32 60%, #43a047 100%)", padding: "20px 16px 18px", color: "#fff" }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Link href="/deals" style={{ background: "rgba(255,255,255,0.15)", borderRadius: 8, color: "#fff", padding: "8px 10px", display: "flex", alignItems: "center", textDecoration: "none" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
            </Link>
            <div style={{ width: 34, height: 34, borderRadius: 9, background: "rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>💵</div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: -0.5 }}>Open Payments</div>
              <div style={{ fontSize: 12, opacity: 0.7, marginTop: 1 }}>Ask questions about industry payments to providers — powered by AI</div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "16px 16px 40px" }}>
        {/* Suggestion chips */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
          {CHIPS.map(chip => (
            <button key={chip} onClick={() => { setQuery(chip); setTimeout(() => runQuery(chip), 50); }}
              style={{ fontSize: 12, padding: "6px 12px", borderRadius: 20, border: `1px solid ${C.border}`, background: "#fff", color: GREEN, cursor: "pointer", fontFamily: "inherit", fontWeight: 500 }}>
              {chip}
            </button>
          ))}
        </div>

        {/* Query input */}
        <form onSubmit={e => { e.preventDefault(); runQuery(); }} style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          <input
            type="text" value={query} onChange={e => setQuery(e.target.value)}
            placeholder='Ask anything, e.g. "Top paid spine surgeons in TX"'
            style={{ flex: 1, border: `1px solid ${C.border}`, borderRadius: 12, padding: "13px 16px", fontSize: 15, fontFamily: "inherit", outline: "none", color: C.brand, background: "#fff" }}
          />
          <button type="submit" disabled={loading} style={{ padding: "0 24px", background: loading ? "#94a3b8" : GREEN, color: "#fff", border: "none", borderRadius: 12, fontSize: 15, fontWeight: 600, cursor: loading ? "wait" : "pointer", whiteSpace: "nowrap", fontFamily: "inherit" }}>
            {loading ? "…" : "Ask"}
          </button>
        </form>

        {loading && (
          <div style={{ textAlign: "center", padding: "24px 0", fontSize: 13, color: C.textSec }}>
            <div style={{ display: "inline-block", width: 20, height: 20, border: "2.5px solid #d1d5db", borderTopColor: GREEN, borderRadius: "50%", marginRight: 10, verticalAlign: "middle", animation: "spin 0.7s linear infinite" }} />
            Analyzing payments data…
          </div>
        )}

        {result?.error && (
          <div style={{ padding: "14px 16px", background: result.error.includes("Supabase") ? "#fffde7" : "#fef2f2", borderRadius: 12, color: result.error.includes("Supabase") ? "#5d4037" : "#dc2626", fontSize: 14, fontWeight: 500, border: `1px solid ${result.error.includes("Supabase") ? "#fff9c4" : "#fecaca"}` }}>
            {result.error.includes("Supabase")
              ? <><strong>Supabase not configured.</strong> Add your <code>SUPABASE_KEY</code> to <code>.env.local</code> to enable payments data.</>
              : result.error}
          </div>
        )}

        {result && !result.error && result.results && (
          <>
            {result.interpretation && (
              <div style={{ padding: "12px 16px", background: "#f0fdf4", borderRadius: 10, border: `1px solid #bbf7d0`, fontSize: 14, color: C.brand, fontWeight: 500, marginBottom: 16 }}>
                {result.interpretation}
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.textSec, textTransform: "uppercase", letterSpacing: 0.5 }}>{result.results.length} results</div>
              {result.results.length > 0 && (
                <button onClick={downloadCSV} style={{ fontSize: 12, padding: "6px 12px", borderRadius: 8, border: `1px solid ${C.border}`, background: "#fff", color: C.textSec, cursor: "pointer", fontFamily: "inherit", fontWeight: 600, display: "flex", alignItems: "center", gap: 5 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  CSV
                </button>
              )}
            </div>

            {result.results.length === 0 ? (
              <div style={{ textAlign: "center", padding: "32px", background: "#fff", borderRadius: 14, border: `1px solid ${C.border}`, color: C.textSec, fontSize: 14 }}>No results found. Try a different query.</div>
            ) : (
              <div style={{ overflowX: "auto", borderRadius: 14, border: `1px solid ${C.border}`, background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: "#f8fafc" }}>
                      {result.columns!.map(col => (
                        <th key={col} style={{ padding: "10px 14px", textAlign: "left", fontWeight: 700, color: C.brand, fontSize: 12, textTransform: "uppercase", letterSpacing: 0.5, borderBottom: `1px solid ${C.border}`, whiteSpace: "nowrap" }}>{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {result.results.map((row, i) => (
                      <tr key={i} style={{ borderBottom: i < result.results!.length - 1 ? `1px solid ${C.border}` : "none" }}>
                        {result.columns!.map(col => {
                          const val = row[col];
                          const cell = fmtCell(col, val);
                          const isAmt = ["payment", "amount", "total", "fee"].some(k => col.toLowerCase().includes(k));
                          return (
                            <td key={col} style={{ padding: "10px 14px", color: isAmt ? GREEN : C.text, fontWeight: isAmt ? 700 : 400, fontFamily: isAmt ? "monospace" : "inherit" }}>
                              {col === "Doctor" && String(row[col] || "") ? (
                                <Link href={`/surgeon-profile?first=${encodeURIComponent(String(row[col]).split(" ")[0])}&last=${encodeURIComponent(String(row[col]).split(" ").pop() || "")}`}
                                  style={{ color: C.primary, textDecoration: "none", fontWeight: 600 }}>{cell}</Link>
                              ) : cell}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        <div style={{ marginTop: 32, paddingTop: 16, borderTop: `1px solid ${C.border}`, textAlign: "center" }}>
          <Link href="/deals" style={{ fontSize: 13, color: C.primary, textDecoration: "none", fontWeight: 600 }}>← Dashboard</Link>
        </div>
      </div>
    </div>
  );
}
