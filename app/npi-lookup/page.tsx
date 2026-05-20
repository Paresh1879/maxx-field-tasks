"use client";

import { useState, useRef } from "react";
import Link from "next/link";

const C = {
  brand: "#0c2d48", primary: "#1565a0", mid: "#2e86c1",
  bg: "#f4f8fb", border: "#dce4ec", text: "#374151", textSec: "#6b7280",
};

const RECENT_KEY = "npi-recent-searches";

function loadRecent() {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) || "[]"); } catch { return []; }
}
function saveRecent(searches: unknown[]) {
  localStorage.setItem(RECENT_KEY, JSON.stringify(searches));
}

function fmtPhone(p: string) {
  const d = p.replace(/\D/g, "");
  if (d.length === 10) return `(${d.slice(0,3)}) ${d.slice(3,6)}-${d.slice(6)}`;
  return p;
}

interface NpiResult {
  number: string;
  enumeration_type: string;
  basic?: { first_name?: string; middle_name?: string; last_name?: string; credential?: string; organization_name?: string };
  taxonomies?: { primary?: boolean; desc?: string; state?: string; license?: string }[];
  addresses?: { address_1?: string; address_2?: string; city?: string; state?: string; postal_code?: string; telephone_number?: string }[];
}

interface RecentSearch {
  query: string;
  timestamp: number;
  npis?: { npi: string; name: string }[];
}

interface ParsedParams {
  last_name?: string;
  first_name?: string;
  city?: string;
  state?: string;
  number?: string;
  organization_name?: string;
}

const ALL_TAXONOMIES = ["Orthopaedic", "Podiatr", "Orthopedic Trauma"];

function buildURL(params: ParsedParams, taxonomy: string) {
  const p = new URLSearchParams();
  if (params.number) {
    p.set("number", params.number);
  } else {
    p.set("limit", "25");
    p.set("taxonomy_description", taxonomy);
    if (params.organization_name) {
      p.set("enumeration_type", "NPI-2");
      p.set("organization_name", params.organization_name);
    } else {
      p.set("enumeration_type", "NPI-1");
      if (params.last_name) p.set("last_name", params.last_name);
      if (params.first_name) p.set("first_name", params.first_name);
    }
    if (params.city) p.set("city", params.city);
    if (params.state) p.set("state", params.state);
  }
  return `/api/nppes?${p}`;
}

async function searchAllTaxonomies(params: ParsedParams) {
  if (params.number) {
    const res = await fetch(buildURL(params, ALL_TAXONOMIES[0]));
    return res.json();
  }
  const fetches = ALL_TAXONOMIES.map(t => fetch(buildURL(params, t)).then(r => r.json()));
  const results = await Promise.all(fetches);
  const seen = new Set<string>();
  const merged: NpiResult[] = [];
  for (const data of results) {
    for (const r of (data.results || [])) {
      if (!seen.has(r.number)) { seen.add(r.number); merged.push(r); }
    }
  }
  return { results: merged, result_count: merged.length };
}

function MicIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? "#ef4444" : C.textSec} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="1" width="6" height="12" rx="3" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  );
}

function Badge({ children, c = C.primary }: { children: React.ReactNode; c?: string }) {
  return (
    <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 6, background: `${c}18`, color: c, marginRight: 5, marginBottom: 4, display: "inline-block" }}>
      {children}
    </span>
  );
}

function ProviderCard({ r }: { r: NpiResult }) {
  const b = r.basic || {};
  const addr = r.addresses?.[0] || {};
  const taxs = r.taxonomies || [];
  const primary = taxs.find(t => t.primary) || taxs[0];
  const isIndiv = r.enumeration_type === "NPI-1";
  const name = isIndiv
    ? [b.first_name, b.middle_name, b.last_name].filter(Boolean).join(" ") + (b.credential ? `, ${b.credential}` : "")
    : b.organization_name || "Unknown";
  const addrL = [addr.address_1, addr.address_2].filter(Boolean).join(", ");
  const cityL = [addr.city, addr.state, addr.postal_code?.slice(0, 5)].filter(Boolean).join(", ");

  return (
    <div style={{ background: "#fff", borderRadius: 14, padding: "18px 18px 14px", marginBottom: 10, border: `1px solid ${C.border}`, boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: C.brand, lineHeight: 1.3 }}>{name}</div>
        <span style={{ fontSize: 11, fontFamily: "monospace", color: C.textSec, flexShrink: 0 }}>{r.number}</span>
      </div>

      <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap" }}>
        {primary?.desc && <Badge>{primary.desc}</Badge>}
        <Badge c={isIndiv ? "#7c3aed" : "#d97706"}>{isIndiv ? "Individual" : "Organization"}</Badge>
        {primary?.state && primary?.license && <Badge c={C.textSec}>Lic: {primary.state} {primary.license}</Badge>}
      </div>

      {(addrL || cityL || addr.telephone_number) && (
        <div style={{ marginTop: 10, fontSize: 13, color: "#4b5563", lineHeight: 1.55 }}>
          {addrL && <div>{addrL}</div>}
          {cityL && <div>{cityL}</div>}
          {addr.telephone_number && (
            <div style={{ marginTop: 3 }}>
              <a href={`tel:${addr.telephone_number}`} style={{ color: C.primary, textDecoration: "none", fontWeight: 500 }}>
                {fmtPhone(addr.telephone_number)}
              </a>
            </div>
          )}
        </div>
      )}

      {isIndiv && (
        <div style={{ marginTop: 10 }}>
          <Link
            href={`/surgeon-profile?first=${encodeURIComponent(b.first_name || "")}&last=${encodeURIComponent(b.last_name || "")}`}
            style={{ fontSize: 12, color: C.primary, fontWeight: 600, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4 }}
          >
            View Surgeon Profile →
          </Link>
        </div>
      )}
    </div>
  );
}

export default function NPILookupPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<NpiResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [count, setCount] = useState(0);
  const [parsedParams, setParsedParams] = useState<ParsedParams | null>(null);
  const [listening, setListening] = useState(false);
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>(loadRecent);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recRef = useRef<any>(null);

  function toggleVoice() {
    if (listening && recRef.current) { recRef.current.stop(); return; }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SR) { alert("Voice not supported in this browser. Try Chrome."); return; }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rec = new SR() as any;
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = "en-US";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onresult = (e: any) => {
      const t = e.results[0]?.[0]?.transcript;
      if (t) { setQuery(t); setTimeout(() => runSearch(t), 150); }
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recRef.current = rec;
    rec.start();
    setListening(true);
  }

  async function runSearch(text?: string) {
    const q = (text || query).trim();
    if (!q) return;
    setError(null); setResults(null); setParsedParams(null);
    setLoading(true);
    try {
      setStage("parsing");
      const res = await fetch("/api/npi-parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: q }),
      });
      const params = await res.json() as ParsedParams;
      setParsedParams(params);
      if (!params.last_name && !params.organization_name && !params.number) {
        setError("Couldn't extract a name or NPI. Try something like \"hari bezwada\" or a 10-digit NPI.");
        setLoading(false); return;
      }
      setStage("searching");
      const data = await searchAllTaxonomies(params);
      const providers: NpiResult[] = data.results || [];
      setCount(data.result_count || 0);
      setResults(providers);

      setRecentSearches(prev => {
        const npis = providers.slice(0, 5).map(r => {
          const b2 = r.basic || {};
          const isIndiv2 = r.enumeration_type === "NPI-1";
          const nm = isIndiv2
            ? [b2.first_name, b2.last_name].filter(Boolean).join(" ") + (b2.credential ? `, ${b2.credential}` : "")
            : b2.organization_name || "Unknown";
          return { npi: r.number, name: nm };
        });
        const next = [{ query: q, timestamp: Date.now(), npis }, ...prev.filter((r: RecentSearch) => r.query !== q)].slice(0, 10);
        saveRecent(next);
        return next;
      });
    } catch {
      setError("Something went wrong. Try rephrasing.");
    } finally {
      setLoading(false); setStage("");
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "var(--font-outfit), 'Outfit', sans-serif" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Header */}
      <div style={{ background: `linear-gradient(150deg, ${C.brand} 0%, ${C.primary} 60%, ${C.mid} 100%)`, padding: "20px 16px 18px", color: "#fff" }}>
        <div style={{ maxWidth: 540, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Link href="/deals" style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 8, color: "#fff", padding: "8px 10px", display: "flex", alignItems: "center", textDecoration: "none" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
            </Link>
            <div style={{ width: 34, height: 34, borderRadius: 9, background: "rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, flexShrink: 0 }}>🦴</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: -0.5 }}>NPI Lookup</div>
              <div style={{ fontSize: 12, opacity: 0.7, marginTop: 1 }}>Voice-powered · Ortho · Podiatry · Trauma</div>
            </div>
          </div>
        </div>
      </div>

      {/* Search form */}
      <div style={{ maxWidth: 540, margin: "0 auto", padding: "14px 16px 0" }}>
        <form onSubmit={(e) => { e.preventDefault(); runSearch(); }} style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <div style={{ flex: 1, display: "flex", alignItems: "center", background: "#fff", borderRadius: 12, border: "1px solid #c8d4de", padding: "0 4px 0 14px" }}>
            <input
              type="text" value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder='"hari bezwada" or "hip surgeon philly"'
              style={{ flex: 1, border: "none", outline: "none", fontSize: 15, padding: "13px 0", background: "transparent", color: C.brand, fontFamily: "inherit" }}
            />
            <button type="button" onClick={toggleVoice} style={{ background: listening ? "#fef2f2" : "transparent", border: listening ? "1.5px solid #fca5a5" : "1.5px solid transparent", borderRadius: 8, padding: 7, cursor: "pointer", display: "flex", alignItems: "center" }}>
              <MicIcon active={listening} />
            </button>
          </div>
          <button type="submit" disabled={loading} style={{ padding: "0 20px", background: loading ? "#94a3b8" : C.primary, color: "#fff", border: "none", borderRadius: 12, fontSize: 15, fontWeight: 600, cursor: loading ? "wait" : "pointer", whiteSpace: "nowrap", fontFamily: "inherit" }}>
            {loading ? "…" : "Go"}
          </button>
        </form>

        {/* Suggestion chips */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
          {["hari bezwada", "hip surgeon philadelphia", "knee revision NJ", "podiatrist miami"].map(s => (
            <button key={s} onClick={() => { setQuery(s); setTimeout(() => runSearch(s), 50); }}
              style={{ fontSize: 12, padding: "5px 10px", borderRadius: 20, border: `1px solid ${C.border}`, background: "#fff", color: C.primary, cursor: "pointer", fontFamily: "inherit", fontWeight: 500 }}>
              {s}
            </button>
          ))}
        </div>

        {loading && (
          <div style={{ textAlign: "center", padding: "18px 0", fontSize: 13, color: C.textSec, fontWeight: 500 }}>
            <div style={{ display: "inline-block", width: 18, height: 18, border: "2.5px solid #d1d5db", borderTopColor: C.primary, borderRadius: "50%", marginRight: 8, verticalAlign: "middle", animation: "spin 0.7s linear infinite" }} />
            {stage === "parsing" ? "Understanding your query…" : "Searching NPPES registry…"}
          </div>
        )}

        {listening && (
          <div style={{ textAlign: "center", padding: "14px 0", fontSize: 14, color: "#ef4444", fontWeight: 600 }}>
            ● Listening… speak your search
          </div>
        )}

        {parsedParams && !loading && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 10 }}>
            {Object.entries(parsedParams).map(([k, v]) => (
              <span key={k} style={{ fontSize: 11, fontWeight: 600, padding: "3px 9px", borderRadius: 6, background: "#e8f0fe", color: C.primary, fontFamily: "monospace" }}>{k}: {v}</span>
            ))}
          </div>
        )}

        {error && (
          <div style={{ padding: "11px 14px", background: "#fef2f2", borderRadius: 10, color: "#dc2626", fontSize: 13, fontWeight: 500, marginBottom: 12 }}>{error}</div>
        )}

        {results !== null && !loading && (
          <>
            <div style={{ fontSize: 12, fontWeight: 600, color: C.textSec, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>
              {count === 0 ? "No providers found" : `${count} provider${count !== 1 ? "s" : ""} found`}
            </div>
            {count === 0 && parsedParams && (
              <div style={{ background: "#f0f7ff", border: `1px solid ${C.border}`, borderRadius: 12, padding: "16px 18px", marginBottom: 14 }}>
                <div style={{ fontSize: 14, color: C.text, lineHeight: 1.6, marginBottom: 10 }}>
                  This search is filtered to orthopaedic, podiatry, and trauma providers. The provider may be listed under a different specialty.
                </div>
                <a href="https://npiregistry.cms.hhs.gov/search" target="_blank" rel="noopener noreferrer"
                  style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 14, fontWeight: 600, color: C.primary, textDecoration: "none", padding: "8px 14px", background: "#fff", border: `1px solid ${C.primary}`, borderRadius: 8 }}>
                  Search all specialties on NPPES →
                </a>
              </div>
            )}
            {results.map(r => <ProviderCard key={r.number} r={r} />)}
          </>
        )}

        {results === null && !loading && !error && (
          <div style={{ padding: "20px 0" }}>
            {recentSearches.length > 0 ? (
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.textSec, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Recent Searches</div>
                {recentSearches.map((r: RecentSearch) => (
                  <div key={r.timestamp} style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 10, marginBottom: 8, overflow: "hidden" }}>
                    <button onClick={() => { setQuery(r.query); runSearch(r.query); }}
                      style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", padding: "10px 14px", background: "transparent", border: "none", cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}>
                      <span style={{ fontSize: 14, fontWeight: 500, color: C.brand }}>{r.query}</span>
                      <span style={{ fontSize: 11, color: C.textSec, marginLeft: 8 }}>{new Date(r.timestamp).toLocaleDateString([], { month: "short", day: "numeric" })}</span>
                    </button>
                    {r.npis && r.npis.length > 0 && (
                      <div style={{ padding: "8px 10px 10px", display: "flex", flexWrap: "wrap", gap: 6, borderTop: `1px solid ${C.border}` }}>
                        {r.npis.map(item => (
                          <span key={item.npi} style={{ fontSize: 12, padding: "4px 8px", borderRadius: 6, border: `1px solid ${C.border}`, color: C.brand, fontFamily: "monospace" }}>{item.npi} <span style={{ fontFamily: "sans-serif", color: C.textSec }}>{item.name}</span></span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "24px 20px", color: C.textSec, fontSize: 14 }}>
                Search by name, NPI, or specialty above
              </div>
            )}
          </div>
        )}

        {/* Back link */}
        <div style={{ marginTop: 32, paddingTop: 16, borderTop: `1px solid ${C.border}`, textAlign: "center" }}>
          <Link href="/deals" style={{ fontSize: 13, color: C.primary, textDecoration: "none", fontWeight: 600 }}>← Dashboard</Link>
        </div>
      </div>
    </div>
  );
}
