"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

const BRAND = "#0c2d48", PRIMARY = "#1565a0", GREEN = "#2e7d32", PURPLE = "#7b1fa2", BORDER = "#dce4ec";

type Provider = { npi: string; firstName: string; lastName: string; credential: string; specialty: string; addresses: { city: string; state: string; zip?: string; phone?: string }[] };
type Payments = { total: number; records: number; npi: number | null; specialty: string; byYear: { year: string; amount: number }[]; byCompany: { company: string; amount: number }[]; byType: { type: string; amount: number }[] };
type Volume = { totalQty: number; doctorName: string; bySurgery: { surgery: string; qty: number }[]; byFacility: { name: string; qty: number; type: string }[]; bySetting: { Hospital: number; ASC: number } };
type Bio = { summary: string; education: { medical_school?: string; residency?: string; fellowship?: string | null }; hospital_affiliations: string[]; clinical_focus: string[]; board_certifications: string[]; research_interests: string[]; industry_relationships: string | null };
type ProfileData = { provider: Provider | null; payments: Payments | null; volume: Volume | null; bio: Bio | null };

function fmtDollars(n: number) { return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n); }
function fmtCompact(n: number) { if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`; if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`; return `$${n}`; }

function Section({ title, color = PRIMARY, children }: { title?: string; color?: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "#fff", borderRadius: 14, padding: 20, border: `1px solid ${BORDER}`, marginBottom: 14, boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
      {title && <div style={{ fontSize: 15, fontWeight: 700, color, marginBottom: 14, borderBottom: `2px solid ${BORDER}`, paddingBottom: 8 }}>{title}</div>}
      {children}
    </div>
  );
}

function Dot({ color }: { color: string }) {
  return <span style={{ width: 6, height: 6, borderRadius: "50%", background: color, display: "inline-block", flexShrink: 0, marginTop: 7 }} />;
}

function Stat({ label, value, color, bg }: { label: string; value: string; color: string; bg: string }) {
  return (
    <div style={{ background: bg, borderRadius: 10, padding: "14px 12px", textAlign: "center" }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 800, color, fontFamily: "monospace" }}>{value}</div>
    </div>
  );
}

function ProfileView({ firstName, lastName }: { firstName: string; lastName: string }) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ProfileData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!lastName && !firstName) return;
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (firstName) params.set("first_name", firstName);
    params.set("last_name", lastName || firstName);
    fetch(`/api/surgeon-profile?${params}`)
      .then(r => { if (!r.ok) throw new Error(`${r.status}`); return r.json(); })
      .then((d: ProfileData) => setData(d))
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [firstName, lastName]);

  const provider = data?.provider;
  const bio = data?.bio;
  const volume = data?.volume;
  const payments = data?.payments;
  const displayName = provider
    ? `${provider.firstName} ${provider.lastName}${provider.credential ? `, ${provider.credential}` : ""}`
    : `${firstName} ${lastName}`.trim().toUpperCase();

  return (
    <>
      {loading && (
        <Section>
          <div style={{ textAlign: "center", padding: "24px 0", fontSize: 13, color: "#6b7280", fontWeight: 500 }}>
            <div style={{ display: "inline-block", width: 18, height: 18, border: "2.5px solid #d1d5db", borderTopColor: PRIMARY, borderRadius: "50%", marginRight: 8, verticalAlign: "middle", animation: "spin 0.7s linear infinite" }} />
            Building surgeon profile…
          </div>
        </Section>
      )}
      {error && (
        <div style={{ padding: "14px 16px", background: "#fef2f2", borderRadius: 14, color: "#dc2626", fontSize: 14, fontWeight: 500, border: "1px solid #fecaca", marginBottom: 14 }}>Error: {error}</div>
      )}
      {data && !loading && (() => {
        const npi = provider?.npi || "N/A";
        const specialty = provider?.specialty || payments?.specialty || "";
        const addr = provider?.addresses?.[0];
        const location = addr ? `${addr.city}, ${addr.state}`.trim() : "";
        return (
          <>
            <Section>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
                <div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: BRAND }}>{displayName}</div>
                  <div style={{ fontSize: 14, color: "#6b7280", fontFamily: "monospace", marginTop: 4 }}>NPI: {npi}</div>
                  {specialty && <div style={{ fontSize: 14, color: "#6b7280", marginTop: 2 }}>{specialty}</div>}
                  {location && <div style={{ fontSize: 14, color: "#6b7280", marginTop: 2, textTransform: "uppercase" }}>{location}</div>}
                </div>
                <button className="no-print" onClick={() => window.print()} style={{ background: PRIMARY, color: "#fff", border: "none", borderRadius: 8, padding: "10px 18px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>Print Report</button>
              </div>
            </Section>

            {bio && (
              <Section title="Professional Summary" color={PRIMARY}>
                <div style={{ fontSize: 15, color: BRAND, lineHeight: 1.7, marginBottom: 16 }}>{bio.summary}</div>
                {bio.education && (bio.education.medical_school || bio.education.residency || bio.education.fellowship) && (
                  <div style={{ background: "#f8fafc", borderRadius: 10, padding: "14px 16px", marginBottom: 14, border: `1px solid ${BORDER}` }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>Education &amp; Training</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {bio.education.medical_school && (
                        <div style={{ display: "flex", gap: 10 }}><Dot color={PRIMARY} /><div><div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>Medical School</div><div style={{ fontSize: 14, color: BRAND, fontWeight: 500 }}>{bio.education.medical_school}</div></div></div>
                      )}
                      {bio.education.residency && (
                        <div style={{ display: "flex", gap: 10 }}><Dot color={PRIMARY} /><div><div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>Residency</div><div style={{ fontSize: 14, color: BRAND, fontWeight: 500 }}>{bio.education.residency}</div></div></div>
                      )}
                      {bio.education.fellowship && (
                        <div style={{ display: "flex", gap: 10 }}><Dot color={PRIMARY} /><div><div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>Fellowship</div><div style={{ fontSize: 14, color: BRAND, fontWeight: 500 }}>{bio.education.fellowship}</div></div></div>
                      )}
                    </div>
                  </div>
                )}
                {(bio.clinical_focus?.length > 0 || bio.board_certifications?.length > 0) && (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 14 }}>
                    {bio.clinical_focus?.length > 0 && (
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>Clinical Focus</div>
                        {bio.clinical_focus.map((f, i) => (
                          <div key={i} style={{ fontSize: 13, color: BRAND, marginBottom: 4, display: "flex", alignItems: "flex-start", gap: 6 }}><span style={{ color: PRIMARY, fontWeight: 700 }}>—</span> {f}</div>
                        ))}
                      </div>
                    )}
                    {bio.board_certifications?.length > 0 && (
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>Board Certifications</div>
                        {bio.board_certifications.map((c, i) => (
                          <div key={i} style={{ fontSize: 13, color: BRAND, marginBottom: 4, display: "flex", alignItems: "flex-start", gap: 6 }}><span style={{ color: GREEN, fontWeight: 700 }}>—</span> {c}</div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {bio.hospital_affiliations?.length > 0 && (
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>Hospital Affiliations</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {bio.hospital_affiliations.map((h, i) => (<span key={i} style={{ fontSize: 12, fontWeight: 600, padding: "4px 10px", borderRadius: 8, background: "#dce8f5", color: PRIMARY }}>{h}</span>))}
                    </div>
                  </div>
                )}
                {bio.research_interests?.length > 0 && (
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>Research Interests</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {bio.research_interests.map((r, i) => (<span key={i} style={{ fontSize: 12, fontWeight: 600, padding: "4px 10px", borderRadius: 8, background: "#f3e5f5", color: PURPLE }}>{r}</span>))}
                    </div>
                  </div>
                )}
                {bio.industry_relationships && (
                  <div style={{ background: "#fffde7", borderRadius: 10, padding: "12px 14px", border: "1px solid #fff9c4", fontSize: 13, color: "#5d4037", lineHeight: 1.6 }}>
                    <span style={{ fontWeight: 700 }}>Industry Relationships: </span>{bio.industry_relationships}
                  </div>
                )}
              </Section>
            )}

            {volume && volume.totalQty > 0 && (
              <Section title="Surgical Volume" color={PURPLE}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 16 }}>
                  <Stat label="Total Cases" value={volume.totalQty.toLocaleString()} color={PURPLE} bg="#f3e5f5" />
                  <Stat label="Hospital" value={volume.bySetting.Hospital.toLocaleString()} color={PRIMARY} bg="#e8f0fe" />
                  <Stat label="ASC" value={volume.bySetting.ASC.toLocaleString()} color={GREEN} bg="#e8f5e9" />
                </div>
                {volume.bySurgery.length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: BRAND, marginBottom: 10 }}>By Surgery Type</div>
                    <ResponsiveContainer width="100%" height={Math.max(80, volume.bySurgery.slice(0, 6).length * 36)}>
                      <BarChart data={volume.bySurgery.slice(0, 6)} layout="vertical" margin={{ top: 0, right: 40, bottom: 0, left: 5 }}>
                        <XAxis type="number" tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} />
                        <YAxis dataKey="surgery" type="category" width={130} tick={{ fontSize: 12, fill: "#374151" }} axisLine={false} tickLine={false} />
                        <Tooltip formatter={(v: unknown) => [`${(v as number).toLocaleString()} cases`, ""]} cursor={{ fill: "#f3e5f5" }} />
                        <Bar dataKey="qty" fill={PURPLE} radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
                {volume.byFacility.length > 0 && (
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: BRAND, marginBottom: 10 }}>By Facility</div>
                    {volume.byFacility.slice(0, 8).map((f, i) => (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: i < Math.min(volume.byFacility.length, 8) - 1 ? `1px solid ${BORDER}` : "none" }}>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ fontSize: 14, fontWeight: 600, color: BRAND, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name}</div>
                          <div style={{ fontSize: 12, color: "#94a3b8" }}>{f.type}</div>
                        </div>
                        <span style={{ fontSize: 16, fontWeight: 800, color: PURPLE, fontFamily: "monospace", flexShrink: 0, marginLeft: 12 }}>{f.qty.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                )}
              </Section>
            )}

            {payments && payments.total > 0 && (
              <Section title="Industry Payments" color={GREEN}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                  <div style={{ background: "#e8f5e9", borderRadius: 10, padding: "14px" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", marginBottom: 4 }}>Total Payments</div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: GREEN, fontFamily: "monospace" }}>{fmtDollars(payments.total)}</div>
                    <div style={{ fontSize: 12, color: "#6b7280" }}>{payments.records} records</div>
                  </div>
                  <div style={{ background: "#e8f5e9", borderRadius: 10, padding: "14px" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", marginBottom: 4 }}>Top Company</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: GREEN }}>{payments.byCompany[0]?.company || "N/A"}</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#6b7280", fontFamily: "monospace" }}>{payments.byCompany[0] ? fmtDollars(payments.byCompany[0].amount) : ""}</div>
                  </div>
                </div>
                {payments.byYear.length > 1 && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: BRAND, marginBottom: 10 }}>Payments by Year</div>
                    <ResponsiveContainer width="100%" height={180}>
                      <BarChart data={[...payments.byYear].reverse()} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                        <XAxis dataKey="year" tick={{ fontSize: 12, fill: "#374151" }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 11, fill: "#6b7280" }} tickFormatter={(v: number) => fmtCompact(v)} width={56} axisLine={false} tickLine={false} />
                        <Tooltip formatter={(v: unknown) => [fmtDollars(v as number), "Payments"]} cursor={{ fill: "#e8f5e9" }} />
                        <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                          {[...payments.byYear].reverse().map((_, i, arr) => (<Cell key={i} fill={i === arr.length - 1 ? "#1b5e20" : "#43a047"} />))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
                {payments.byCompany.length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: BRAND, marginBottom: 10 }}>By Company</div>
                    <ResponsiveContainer width="100%" height={Math.max(80, payments.byCompany.slice(0, 8).length * 36)}>
                      <BarChart data={payments.byCompany.slice(0, 8)} layout="vertical" margin={{ top: 0, right: 80, bottom: 0, left: 5 }}>
                        <XAxis type="number" tick={{ fontSize: 11, fill: "#6b7280" }} tickFormatter={(v: number) => fmtCompact(v)} axisLine={false} tickLine={false} />
                        <YAxis dataKey="company" type="category" width={130} tick={{ fontSize: 11, fill: "#374151" }} axisLine={false} tickLine={false} />
                        <Tooltip formatter={(v: unknown) => [fmtDollars(v as number), "Payments"]} cursor={{ fill: "#e8f5e9" }} />
                        <Bar dataKey="amount" fill="#43a047" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
                {payments.byType.length > 0 && (
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: BRAND, marginBottom: 10 }}>By Payment Type</div>
                    {payments.byType.map((t, i) => (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: i < payments.byType.length - 1 ? `1px solid ${BORDER}` : "none" }}>
                        <span style={{ fontSize: 13, color: BRAND }}>{t.type}</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: GREEN, fontFamily: "monospace" }}>{fmtDollars(t.amount)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </Section>
            )}

            {!bio && !volume && !payments && (
              <Section>
                <div style={{ textAlign: "center", padding: "20px 0" }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: BRAND, marginBottom: 6 }}>No data found for this surgeon</div>
                  <div style={{ fontSize: 14, color: "#6b7280" }}>Try adjusting the name spelling or searching a different name.</div>
                </div>
              </Section>
            )}
          </>
        );
      })()}
    </>
  );
}

function SurgeonProfileInner() {
  const searchParams = useSearchParams();
  const initFirst = searchParams.get("first") || searchParams.get("first_name") || "";
  const initLast = searchParams.get("last") || searchParams.get("last_name") || "";

  const [firstName, setFirstName] = useState(initFirst);
  const [lastName, setLastName] = useState(initLast);
  const [searchFirst, setSearchFirst] = useState(initFirst);
  const [searchLast, setSearchLast] = useState(initLast);
  const [hasSearched, setHasSearched] = useState(!!(initFirst || initLast));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSearchFirst(firstName);
    setSearchLast(lastName);
    setHasSearched(true);
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f4f8fb", fontFamily: "var(--font-outfit), 'Outfit', sans-serif" }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media print { .no-print { display: none !important; } body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
      `}</style>

      {/* Header */}
      <div style={{ background: "linear-gradient(150deg, #0d47a1 0%, #1565c0 60%, #1e88e5 100%)" }}>
        <div style={{ maxWidth: 700, margin: "0 auto", padding: "20px 16px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <Link href="/deals" style={{ background: "rgba(255,255,255,0.15)", borderRadius: 8, color: "#fff", padding: "10px 12px", display: "flex", alignItems: "center", textDecoration: "none", minWidth: 44, justifyContent: "center" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
            </Link>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#fff", letterSpacing: -0.5 }}>Surgeon Profile</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", marginTop: 2 }}>Competitive intelligence report</div>
            </div>
          </div>

          {/* Search form inside header */}
          <form onSubmit={handleSubmit} style={{ display: "flex", gap: 8 }}>
            <input
              type="text" value={firstName} onChange={e => setFirstName(e.target.value)}
              placeholder="First name"
              style={{ flex: 1, background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 10, padding: "11px 14px", fontSize: 14, color: "#fff", outline: "none", fontFamily: "inherit" }}
            />
            <input
              type="text" value={lastName} onChange={e => setLastName(e.target.value)}
              placeholder="Last name *"
              required
              style={{ flex: 1, background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 10, padding: "11px 14px", fontSize: 14, color: "#fff", outline: "none", fontFamily: "inherit" }}
            />
            <button type="submit" style={{ padding: "0 20px", background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.4)", borderRadius: 10, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", fontFamily: "inherit" }}>
              Go
            </button>
          </form>
        </div>
      </div>

      <div style={{ maxWidth: 700, margin: "0 auto", padding: "16px 16px 32px" }}>
        {!hasSearched && (
          <div style={{ textAlign: "center", padding: "40px 0", color: "#6b7280", fontSize: 15 }}>
            Enter a surgeon&apos;s name above to generate their competitive intelligence profile.
          </div>
        )}
        {hasSearched && <ProfileView firstName={searchFirst} lastName={searchLast} />}

        <div className="no-print" style={{ marginTop: 24, paddingTop: 16, borderTop: `1px solid ${BORDER}`, fontSize: 11, color: "#94a3b8", textAlign: "center" }}>
          <Link href="/deals" style={{ fontSize: 13, color: PRIMARY, textDecoration: "none", fontWeight: 600 }}>← Dashboard</Link>
        </div>
      </div>
    </div>
  );
}

export default function SurgeonProfilePage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "#f4f8fb", display: "flex", alignItems: "center", justifyContent: "center", color: "#6b7280" }}>Loading…</div>}>
      <SurgeonProfileInner />
    </Suspense>
  );
}
