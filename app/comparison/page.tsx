"use client";

import { useState } from "react";
import Link from "next/link";

const C = { brand: "#0c2d48", primary: "#1565a0", border: "#dce4ec", text: "#374151", textSec: "#6b7280", bg: "#f4f8fb" };
const ORANGE = "#e65100";
const GREEN = "#2e7d32";
const PURPLE = "#7b1fa2";

type Provider = { npi: string; firstName: string; lastName: string; credential: string; specialty: string; addresses: { city: string; state: string; zip?: string; phone?: string }[] };
type Payments = { total: number; records: number; npi: number | null; specialty: string; byYear: { year: string; amount: number }[]; byCompany: { company: string; amount: number }[]; byType: { type: string; amount: number }[] };
type Volume = { totalQty: number; doctorName: string; bySurgery: { surgery: string; qty: number }[]; byFacility: { name: string; qty: number; type: string }[]; bySetting: { Hospital: number; ASC: number } };
type Bio = { summary: string; education: { medical_school?: string; residency?: string; fellowship?: string | null }; hospital_affiliations: string[]; clinical_focus: string[]; board_certifications: string[]; research_interests: string[]; industry_relationships: string | null };
type ProfileData = { provider: Provider | null; payments: Payments | null; volume: Volume | null; bio: Bio | null };

interface SurgeonSlot { first: string; last: string }

function fmtDollars(n: number) { return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n); }

function SlotInput({ slot, idx, onChange, onRemove, canRemove }: { slot: SurgeonSlot; idx: number; onChange: (idx: number, field: keyof SurgeonSlot, val: string) => void; onRemove: (idx: number) => void; canRemove: boolean }) {
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
      <div style={{ flex: 1, display: "flex", gap: 6 }}>
        <input type="text" value={slot.first} onChange={e => onChange(idx, "first", e.target.value)} placeholder="First name"
          style={{ flex: 1, border: `1px solid ${C.border}`, borderRadius: 10, padding: "11px 14px", fontSize: 14, fontFamily: "inherit", outline: "none", color: C.brand, background: "#fff" }} />
        <input type="text" value={slot.last} onChange={e => onChange(idx, "last", e.target.value)} placeholder="Last name *"
          style={{ flex: 1, border: `1px solid ${C.border}`, borderRadius: 10, padding: "11px 14px", fontSize: 14, fontFamily: "inherit", outline: "none", color: C.brand, background: "#fff" }} />
      </div>
      {canRemove && (
        <button onClick={() => onRemove(idx)} style={{ padding: "10px", background: "#fef2f2", border: "none", borderRadius: 8, color: "#ef4444", cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center" }}>×</button>
      )}
    </div>
  );
}

function findMax(profiles: (ProfileData | null)[], fn: (p: ProfileData) => number): number {
  let m = -Infinity;
  for (const p of profiles) { if (p) { const v = fn(p); if (v > m) m = v; } }
  return m;
}

export default function ComparisonPage() {
  const [slots, setSlots] = useState<SurgeonSlot[]>([{ first: "", last: "" }, { first: "", last: "" }]);
  const [loading, setLoading] = useState(false);
  const [profiles, setProfiles] = useState<(ProfileData | null)[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  function updateSlot(idx: number, field: keyof SurgeonSlot, val: string) {
    setSlots(prev => prev.map((s, i) => i === idx ? { ...s, [field]: val } : s));
  }
  function removeSlot(idx: number) {
    setSlots(prev => prev.filter((_, i) => i !== idx));
  }
  function addSlot() {
    if (slots.length >= 3) return;
    setSlots(prev => [...prev, { first: "", last: "" }]);
  }

  async function compare(e: React.FormEvent) {
    e.preventDefault();
    const valid = slots.filter(s => s.last.trim());
    if (valid.length < 2) { setError("Enter at least 2 surgeons to compare."); return; }
    setLoading(true);
    setError(null);
    setProfiles(null);
    try {
      const results = await Promise.all(
        valid.map(async (s): Promise<ProfileData | null> => {
          const params = new URLSearchParams();
          if (s.first) params.set("first_name", s.first.trim());
          params.set("last_name", s.last.trim());
          const res = await fetch(`/api/surgeon-profile?${params}`);
          if (!res.ok) return null;
          return res.json() as Promise<ProfileData>;
        })
      );
      setProfiles(results);
    } catch {
      setError("Comparison failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const validSlots = slots.filter(s => s.last.trim());

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "var(--font-outfit), 'Outfit', sans-serif" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Header */}
      <div style={{ background: "linear-gradient(150deg, #bf360c 0%, #e65100 60%, #f57c00 100%)", padding: "20px 16px 20px", color: "#fff" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <Link href="/deals" style={{ background: "rgba(255,255,255,0.15)", borderRadius: 8, color: "#fff", padding: "8px 10px", display: "flex", alignItems: "center", textDecoration: "none" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
            </Link>
            <div style={{ width: 34, height: 34, borderRadius: 9, background: "rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>⚖️</div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: -0.5 }}>Comparison</div>
              <div style={{ fontSize: 12, opacity: 0.7, marginTop: 1 }}>Compare 2-3 surgeons side by side on volume, payments, and facilities</div>
            </div>
          </div>

          {/* Surgeon slots */}
          <form onSubmit={compare} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {slots.map((slot, idx) => (
              <SlotInput key={idx} slot={slot} idx={idx} onChange={updateSlot} onRemove={removeSlot} canRemove={slots.length > 2} />
            ))}
            <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
              {slots.length < 3 && (
                <button type="button" onClick={addSlot} style={{ padding: "8px 16px", background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 8, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                  + Add surgeon
                </button>
              )}
              <button type="submit" disabled={loading || validSlots.length < 2}
                style={{ padding: "10px 24px", background: loading ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.22)", border: "1px solid rgba(255,255,255,0.4)", borderRadius: 10, color: "#fff", fontSize: 15, fontWeight: 700, cursor: loading || validSlots.length < 2 ? "not-allowed" : "pointer", fontFamily: "inherit" }}>
                {loading ? "Comparing…" : "Compare"}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "16px 16px 40px" }}>
        {error && <div style={{ padding: "14px 16px", background: "#fef2f2", borderRadius: 12, color: "#dc2626", fontSize: 14, fontWeight: 500, border: "1px solid #fecaca", marginBottom: 16 }}>{error}</div>}

        {loading && (
          <div style={{ textAlign: "center", padding: "32px 0", fontSize: 13, color: C.textSec }}>
            <div style={{ display: "inline-block", width: 20, height: 20, border: "2.5px solid #d1d5db", borderTopColor: ORANGE, borderRadius: "50%", marginRight: 10, verticalAlign: "middle", animation: "spin 0.7s linear infinite" }} />
            Fetching profiles in parallel…
          </div>
        )}

        {profiles && !loading && (() => {
          const maxTotalCases = findMax(profiles, p => p.volume?.totalQty || 0);
          const maxHospCases = findMax(profiles, p => p.volume?.bySetting.Hospital || 0);
          const maxAscCases = findMax(profiles, p => p.volume?.bySetting.ASC || 0);
          const maxPayments = findMax(profiles, p => p.payments?.total || 0);

          type Row = { label: string; key: string; vals: (string | React.ReactNode)[]; maxIdx: number | null };
          const rows: Row[] = [
            {
              label: "NPI", key: "npi", maxIdx: null,
              vals: profiles.map(p => p?.provider?.npi || "N/A"),
            },
            {
              label: "Specialty", key: "specialty", maxIdx: null,
              vals: profiles.map(p => p?.provider?.specialty || p?.payments?.specialty || "N/A"),
            },
            {
              label: "Location", key: "loc", maxIdx: null,
              vals: profiles.map(p => { const a = p?.provider?.addresses?.[0]; return a ? `${a.city}, ${a.state}` : "N/A"; }),
            },
            {
              label: "Total Cases", key: "totalCases", maxIdx: maxTotalCases > 0 ? profiles.findIndex(p => (p?.volume?.totalQty || 0) === maxTotalCases) : null,
              vals: profiles.map(p => p?.volume?.totalQty ? p.volume.totalQty.toLocaleString() : "—"),
            },
            {
              label: "Hospital Cases", key: "hospCases", maxIdx: maxHospCases > 0 ? profiles.findIndex(p => (p?.volume?.bySetting.Hospital || 0) === maxHospCases) : null,
              vals: profiles.map(p => p?.volume?.bySetting.Hospital ? p.volume.bySetting.Hospital.toLocaleString() : "—"),
            },
            {
              label: "ASC Cases", key: "ascCases", maxIdx: maxAscCases > 0 ? profiles.findIndex(p => (p?.volume?.bySetting.ASC || 0) === maxAscCases) : null,
              vals: profiles.map(p => p?.volume?.bySetting.ASC ? p.volume.bySetting.ASC.toLocaleString() : "—"),
            },
            {
              label: "Total Payments", key: "payments", maxIdx: maxPayments > 0 ? profiles.findIndex(p => (p?.payments?.total || 0) === maxPayments) : null,
              vals: profiles.map(p => p?.payments?.total ? fmtDollars(p.payments.total) : "—"),
            },
            {
              label: "Top Paying Company", key: "topCo", maxIdx: null,
              vals: profiles.map(p => p?.payments?.byCompany[0]?.company || "—"),
            },
          ];

          const colors = [ORANGE, C.primary, PURPLE];

          return (
            <>
              {/* Header cards */}
              <div style={{ display: "grid", gridTemplateColumns: `repeat(${profiles.length}, 1fr)`, gap: 10, marginBottom: 20 }}>
                {profiles.map((p, i) => {
                  const name = p?.provider
                    ? `${p.provider.firstName} ${p.provider.lastName}${p.provider.credential ? `, ${p.provider.credential}` : ""}`
                    : validSlots[i] ? `${validSlots[i].first} ${validSlots[i].last}`.trim().toUpperCase() : "Unknown";
                  return (
                    <div key={i} style={{ background: "#fff", borderRadius: 14, padding: 16, border: `2px solid ${colors[i]}`, textAlign: "center" }}>
                      <div style={{ width: 36, height: 36, borderRadius: "50%", background: `${colors[i]}18`, color: colors[i], display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 8px", fontSize: 16, fontWeight: 800 }}>{i + 1}</div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: C.brand }}>{name}</div>
                      <div style={{ fontSize: 12, color: C.textSec, marginTop: 4 }}>{p?.provider?.specialty || "—"}</div>
                      <Link href={`/surgeon-profile?first=${encodeURIComponent(validSlots[i]?.first || "")}&last=${encodeURIComponent(validSlots[i]?.last || "")}`}
                        style={{ display: "inline-block", marginTop: 8, fontSize: 11, color: colors[i], fontWeight: 600, textDecoration: "none" }}>View full profile →</Link>
                    </div>
                  );
                })}
              </div>

              {/* Comparison table */}
              <div style={{ background: "#fff", borderRadius: 14, border: `1px solid ${C.border}`, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.04)", marginBottom: 20 }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: "#f8fafc" }}>
                      <th style={{ padding: "10px 16px", textAlign: "left", fontWeight: 700, color: C.brand, fontSize: 12, textTransform: "uppercase", letterSpacing: 0.5, borderBottom: `1px solid ${C.border}` }}>Metric</th>
                      {profiles.map((_, i) => (
                        <th key={i} style={{ padding: "10px 16px", textAlign: "left", fontWeight: 700, color: colors[i], fontSize: 12, textTransform: "uppercase", letterSpacing: 0.5, borderBottom: `1px solid ${C.border}` }}>
                          Surgeon {i + 1}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, ri) => (
                      <tr key={ri} style={{ borderBottom: ri < rows.length - 1 ? `1px solid ${C.border}` : "none" }}>
                        <td style={{ padding: "10px 16px", fontWeight: 600, color: C.brand, fontSize: 13 }}>{row.label}</td>
                        {row.vals.map((val, ci) => (
                          <td key={ci} style={{ padding: "10px 16px", color: C.text, background: row.maxIdx === ci ? "#f0fdf4" : "transparent", fontWeight: row.maxIdx === ci ? 700 : 400, fontFamily: ["Total Cases", "Hospital Cases", "ASC Cases", "Total Payments"].includes(row.label) ? "monospace" : "inherit" }}>
                            {val as string} {row.maxIdx === ci && <span style={{ fontSize: 11, color: GREEN }}>▲</span>}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Surgery Mix comparison */}
              {profiles.some(p => p?.volume?.bySurgery && p.volume.bySurgery.length > 0) && (
                <div style={{ display: "grid", gridTemplateColumns: `repeat(${profiles.length}, 1fr)`, gap: 12, marginBottom: 20 }}>
                  {profiles.map((p, i) => (
                    <div key={i} style={{ background: "#fff", borderRadius: 14, padding: 16, border: `1px solid ${C.border}` }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: C.brand, marginBottom: 10, paddingBottom: 8, borderBottom: `1px solid ${C.border}` }}>
                        Top Surgery Types — <span style={{ color: colors[i] }}>Surgeon {i + 1}</span>
                      </div>
                      {p?.volume?.bySurgery && p.volume.bySurgery.length > 0 ? (
                        p.volume.bySurgery.slice(0, 5).map((s, si) => (
                          <div key={si} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: si < Math.min(p.volume!.bySurgery.length, 5) - 1 ? `1px solid ${C.border}` : "none" }}>
                            <span style={{ fontSize: 12, color: C.text }}>{s.surgery}</span>
                            <span style={{ fontSize: 13, fontWeight: 700, color: colors[i], fontFamily: "monospace" }}>{s.qty}</span>
                          </div>
                        ))
                      ) : <div style={{ fontSize: 13, color: C.textSec }}>No volume data</div>}
                    </div>
                  ))}
                </div>
              )}

              {/* Hospital affiliations comparison */}
              {profiles.some(p => p?.bio?.hospital_affiliations && p.bio.hospital_affiliations.length > 0) && (
                <div style={{ display: "grid", gridTemplateColumns: `repeat(${profiles.length}, 1fr)`, gap: 12 }}>
                  {profiles.map((p, i) => (
                    <div key={i} style={{ background: "#fff", borderRadius: 14, padding: 16, border: `1px solid ${C.border}` }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: C.brand, marginBottom: 10, paddingBottom: 8, borderBottom: `1px solid ${C.border}` }}>
                        Hospital Affiliations — <span style={{ color: colors[i] }}>Surgeon {i + 1}</span>
                      </div>
                      {p?.bio?.hospital_affiliations && p.bio.hospital_affiliations.length > 0 ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                          {p.bio.hospital_affiliations.slice(0, 5).map((h, hi) => (
                            <div key={hi} style={{ fontSize: 12, padding: "5px 8px", background: `${colors[i]}12`, color: colors[i], borderRadius: 6, fontWeight: 600 }}>{h}</div>
                          ))}
                        </div>
                      ) : <div style={{ fontSize: 13, color: C.textSec }}>No affiliation data</div>}
                    </div>
                  ))}
                </div>
              )}
            </>
          );
        })()}

        {!profiles && !loading && (
          <div style={{ textAlign: "center", padding: "40px 0", color: C.textSec, fontSize: 15 }}>
            Enter 2 or 3 surgeon names above and click Compare.
          </div>
        )}

        <div style={{ marginTop: 32, paddingTop: 16, borderTop: `1px solid ${C.border}`, textAlign: "center" }}>
          <Link href="/deals" style={{ fontSize: 13, color: C.primary, textDecoration: "none", fontWeight: 600 }}>← Dashboard</Link>
        </div>
      </div>
    </div>
  );
}
