import Link from "next/link";

const C = {
  brand: "#0c2d48", primary: "#1565a0", mid: "#2e86c1",
  subtle: "#eaf2f8", border: "#dce4ec", text: "#374151",
};

function Section({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "#fff", borderRadius: 14, padding: "20px", border: `1px solid ${C.border}`, marginBottom: 14, boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
      <div style={{ fontSize: 17, fontWeight: 700, color: C.brand, marginBottom: 12, display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 20, width: 40, height: 40, borderRadius: 10, background: C.subtle, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          {icon}
        </span>
        {title}
      </div>
      <div style={{ fontSize: 15, color: C.text, lineHeight: 1.8 }}>{children}</div>
    </div>
  );
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", gap: 12, marginBottom: 12, alignItems: "flex-start" }}>
      <div style={{ width: 28, height: 28, borderRadius: "50%", flexShrink: 0, background: C.primary, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700 }}>
        {n}
      </div>
      <div style={{ fontSize: 15, color: C.text, lineHeight: 1.7, paddingTop: 3 }}>{children}</div>
    </div>
  );
}

function Hl({ children }: { children: React.ReactNode }) {
  return <strong style={{ color: C.brand, fontWeight: 700 }}>{children}</strong>;
}

function Examples({ items }: { items: string[] }) {
  return (
    <div style={{ margin: "10px 0", display: "flex", flexDirection: "column", gap: 6 }}>
      {items.map((ex, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ color: C.primary, fontSize: 13, fontWeight: 700, flexShrink: 0 }}>→</span>
          <code style={{ fontSize: 13, background: C.subtle, padding: "3px 10px", borderRadius: 6, color: C.brand, fontFamily: "'IBM Plex Mono', monospace" }}>{ex}</code>
        </div>
      ))}
    </div>
  );
}


export default function HelpPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#f4f8fb" }}>
      {/* Header */}
      <div style={{ background: `linear-gradient(150deg, ${C.brand} 0%, ${C.primary} 60%, ${C.mid} 100%)`, padding: "20px 16px 28px" }}>
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          <Link href="/deals" style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            background: "rgba(255,255,255,0.12)", borderRadius: 8,
            color: "rgba(255,255,255,0.9)", padding: "8px 14px",
            textDecoration: "none", fontSize: 14, fontWeight: 600, marginBottom: 18,
          }}>
            ← Back to Home
          </Link>
          <div style={{ fontSize: 26, fontWeight: 800, color: "#fff", letterSpacing: -0.5 }}>How to Use This App</div>
          <div style={{ fontSize: 14, color: "rgba(255,255,255,0.75)", marginTop: 6, lineHeight: 1.6 }}>
            Everything you need to know, explained simply.
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "20px 16px 48px" }}>

        {/* Quick Start */}
        <div style={{ background: `linear-gradient(135deg, ${C.subtle} 0%, #dce8f5 100%)`, borderRadius: 14, padding: "18px 20px", marginBottom: 14, border: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 17, fontWeight: 700, color: C.brand, marginBottom: 12 }}>Quick Start (30 seconds)</div>
          <Step n={1}><Hl>Pick a tool</Hl> from the home screen. Each card does something different (explained below).</Step>
          <Step n={2}><Hl>Type what you&apos;re looking for</Hl> in the search box. Use plain English — no special codes needed.</Step>
          <Step n={3}><Hl>Read your results.</Hl> Click on any result to see more details.</Step>
        </div>

        {/* My Deals */}
        <Section icon="💼" title="My Deals — Your Pipeline">
          View all your open HubSpot deals in one place. Each deal card shows the deal name, close date, stage, and amount.
          <br /><br />
          From any deal you can:
          <ul style={{ paddingLeft: 20, marginTop: 8, marginBottom: 0 }}>
            <li><Hl>Add a Note</Hl> — log what happened at the meeting</li>
            <li><Hl>Log a Task</Hl> — describe the meeting and AI will draft a follow-up task for HubSpot</li>
            <li><Hl>View Activity</Hl> — tap the Activity bar to see past notes, calls, tasks, and contacts</li>
          </ul>
          <br />
          Deals are sorted by close date — overdue at the top, upcoming next.
        </Section>

        {/* All Deals */}
        <Section icon="👥" title="All Deals — Team Pipeline">
          See every open deal across all team members — not just your own.
          Each deal shows the owner&apos;s name as a badge. Use the owner filter dropdown to focus on one rep.
          Expand any deal to see its contacts (surgeons) and recent activity.
        </Section>

        {/* NPI Lookup */}
        <Section icon="🔍" title="1 · NPI Lookup — Find a Provider">
          Searches the national provider registry (the official government database of all doctors).
          <br /><br />
          <Hl>What to type:</Hl> A doctor&apos;s name, an NPI number (the 10-digit ID every doctor has), or a specialty + city.
          <Examples items={["John Smith", "hip surgeon philadelphia", "1234567890"]} />
          Results automatically include orthopedic surgeons, podiatrists, and trauma specialists. Click any result to see their full profile.
          <br /><br />
          If no results are found, a link to the NPPES registry lets you search all specialties directly — with your search fields pre-filled.
        </Section>

        {/* Surgeon Profile */}
        <Section icon="📋" title="2 · Surgeon Profile — One-Page Report">
          Enter a surgeon&apos;s first and last name to get a full intelligence report on one page.
          <br /><br />
          The report includes:
          <ul style={{ paddingLeft: 20, margin: "8px 0" }}>
            <li><Hl>Professional summary</Hl> — education, training, clinical focus</li>
            <li><Hl>Industry payments</Hl> — how much they&apos;ve received from companies, year by year</li>
            <li><Hl>Surgical volume</Hl> — what procedures they do and where</li>
          </ul>
          You can print the report using the <Hl>Print</Hl> button at the top of the profile.
        </Section>

        {/* Open Payments */}
        <Section icon="💰" title="3 · Open Payments — Follow the Money">
          Ask questions about payments from medical companies to doctors. This data comes from the government&apos;s Sunshine Act database.
          <br /><br />
          <Hl>Top recipients</Hl>
          <Examples items={["top 10 paid surgeons in PA", "top 10 orthopedic surgeons in NJ 2023", "top podiatrists in FL", "top recipients of Stryker in PA"]} />
          <Hl>Company queries</Hl>
          <Examples items={["Stryker payments 2023", "who gets the most from Zimmer Biomet?", "top 10 companies in PA", "payments from Medtronic to NJ"]} />
          <Hl>Payment types &amp; specific surgeons</Hl>
          <Examples items={["royalty payments to John Smith", "consulting payments to Smith", "who paid John Smith the most", "total payments to John Smith"]} />
        </Section>

        {/* Volume Intelligence */}
        <Section icon="📊" title="4 · Volume Intelligence — Who Does What, Where">
          Ask questions about how many surgeries doctors perform — broken down by procedure, hospital, and setting.
          <br /><br />
          <Hl>Find top surgeons</Hl>
          <Examples items={["top 10 knee surgeons in PA", "top 5 hip surgeons at Jefferson", "who does the most hips in Pennsylvania?"]} />
          <Hl>Find top facilities</Hl>
          <Examples items={["top ASCs doing knees in PA", "top 10 hospitals doing hips in NJ", "ASC vs hospital volume for hip replacement"]} />
          <Hl>Procedure &amp; trend queries</Hl>
          <Examples items={["top procedures in PA", "how many knees in PA", "knee volume by state"]} />
          <br />
          <span style={{ fontSize: 13, color: "#6b7280" }}>💡 Voice tip: say &quot;top ten ASCs...&quot; instead of &quot;top 10...&quot; — word-numbers work too.</span>
        </Section>

        {/* Networks */}
        <Section icon="🕸️" title="5 · Networks — Find Affiliated Surgeons">
          Enter a surgeon&apos;s first and last name to see every surgeon who works at the same facilities.
          <br /><br />
          The tool finds all facilities where the surgeon operates, then identifies every other surgeon at those same locations.
          <ul style={{ paddingLeft: 20, margin: "8px 0" }}>
            <li>Click a surgeon name in the results to explore their network</li>
            <li>Click a facility name to see volume data for that location</li>
            <li>Download CSV to export the full affiliate list</li>
          </ul>
        </Section>

        {/* Comparison */}
        <Section icon="⚖️" title="6 · Comparison — Head-to-Head Analysis">
          Compare 2 or 3 surgeons side by side on surgical volume, industry payments, and shared facilities.
          <ul style={{ paddingLeft: 20, margin: "8px 0" }}>
            <li>Enter first and last name for each surgeon, then click <Hl>Compare</Hl></li>
            <li>Highest values are highlighted for each metric</li>
            <li>Shared facilities reveal competitive overlap between surgeons</li>
            <li>Shared industry relationships surface common payers across surgeons</li>
            <li>Download CSV to export the full comparison</li>
          </ul>
        </Section>

        {/* Target Lists */}
        <Section icon="🎯" title="7 · Target Lists — Build Prospect Lists">
          Cross-reference surgical volume with industry payments to build targeted surgeon lists.
          <Examples items={["200+ knee surgeons in FL with low payments", "300+ knee/hip surgeons with no ties to Stryker or Zimmer", "highest paid hip surgeons in CA", "top knee surgeons in PA"]} />
          Results include case volume, state, and payment totals. Download CSV to export your list.
        </Section>


        {/* Data Sources */}
        <div style={{ background: C.subtle, borderRadius: 14, padding: "18px 20px", border: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.brand, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
            <span>ℹ️</span> Where Does the Data Come From?
          </div>
          <ul style={{ paddingLeft: 20, margin: 0, fontSize: 14, color: C.text, lineHeight: 1.9 }}>
            <li><Hl>NPPES Registry</Hl> — The official government database of all healthcare providers (updated weekly by CMS).</li>
            <li><Hl>Open Payments</Hl> — Government records of payments from drug/device companies to doctors (Sunshine Act).</li>
            <li><Hl>Surgical Volume Data</Hl> — Case counts by procedure, facility, and setting.</li>
            <li><Hl>AI (Claude)</Hl> — Understands your questions and generates surgeon summaries.</li>
            <li><Hl>HubSpot CRM</Hl> — Your organisation&apos;s deals, contacts, tasks, and notes.</li>
          </ul>
        </div>

        {/* What's New — collapsible accordion */}
        <style>{`
          details.whats-new summary { list-style: none; cursor: pointer; }
          details.whats-new summary::-webkit-details-marker { display: none; }
          details.whats-new[open] .chevron { transform: rotate(180deg); }
          .chevron { transition: transform 0.2s; }
        `}</style>
        <details className="whats-new" style={{ background: "#fff", borderRadius: 14, border: `1px solid ${C.border}`, overflow: "hidden", marginBottom: 14, boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
          <summary style={{ padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, userSelect: "none" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 18, width: 36, height: 36, borderRadius: 9, background: C.subtle, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>🆕</span>
              <span style={{ fontSize: 15, fontWeight: 700, color: C.brand }}>What&apos;s New</span>
            </div>
            <svg className="chevron" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke={C.brand} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </summary>

          <div style={{ borderTop: `1px solid ${C.border}` }}>
            {([
              {
                version: "v2.1", date: "May 2026", latest: true, items: [
                  "Urgent items banner on dashboard — overdue and due-this-week deals & tasks at a glance",
                  "All Deals page — full team pipeline with owner names, close-date sort, contacts on expand",
                  "Help page with tool guides, What's New, and query examples",
                  "Title case formatting for deal names and owner names",
                  "Orange Connect HubSpot button and login page polish",
                  "Floating bubble animations removed for cleaner dashboard",
                ],
              },
              {
                version: "v2.0", date: "May 2026", items: [
                  "Full surgeon intelligence platform launched — 9 tools on one dashboard",
                  "Blue navy redesign: Outfit font, gradient headers, card grid",
                  "NPI Lookup: voice + text search of the national provider registry with Claude NLU",
                  "Open Payments: AI natural language queries over CMS Sunshine Act data",
                  "Volume Intelligence: surgical case volume queries by procedure, facility, and setting",
                  "Target Lists: cross-reference volume + payments to build targeted prospect lists",
                  "Surgeon Profile: one-page competitive intelligence report — NPI, bio, volume, payments",
                  "Networks: discover surgeons affiliated through shared facilities",
                  "Comparison: head-to-head analysis for 2–3 surgeons with highlighted top values",
                  "Surgeons page: HubSpot contacts filtered to medical professionals",
                  "Supabase integration for surgical volume and industry payment data",
                ],
              },
              {
                version: "v3.5", date: "May 2026", items: [
                  "ASC Research: surgeon names are now clickable — jump straight to Volume Intelligence",
                  "Opportunity indicator: amber highlight on ASCs identified in our database",
                  "Cross-view back navigation: returning from Volume Intelligence brings you back to where you started",
                ],
              },
              {
                version: "v3.4", date: "May 2026", items: [
                  "20+ new Volume Intelligence query patterns (facility-centric, state queries, breakdowns)",
                  "15 new Open Payments patterns (payment types, company queries, by-year trends)",
                  "ASC database expanded to 539 centers across 43 states",
                ],
              },
              {
                version: "v3.3", date: "Apr 2026", items: [
                  "Help guide expanded with real query examples for every tool",
                  "NPI Lookup broadened to include podiatrists and trauma specialists",
                  "Mobile layout improvements — 2-column card grid on small screens",
                ],
              },
              {
                version: "v3.2", date: "Apr 2026", items: [
                  "Networks feature — discover surgeons affiliated through shared facilities",
                  "Surgeon Comparison — head-to-head analysis for 2–3 surgeons",
                  "Clickable hospital names in Volume Intelligence jump to facility volume view",
                ],
              },
              {
                version: "v3.1", date: "Apr 2026", items: [
                  "Target Lists — cross-reference volume and payment data to build targeted surgeon lists",
                  "Surgeon Profile — one-page competitive intelligence report with bio, payments, and volume",
                  "AI-assisted badge on query results sourced from Claude",
                ],
              },
              {
                version: "v1.2", date: "Apr 2026", items: [
                  "Notes: log meeting notes against deals directly from the field",
                  "Voice recorder: speak your notes, transcribed instantly",
                  "Deal creation and editing from the field — no laptop needed",
                  "Mobile-first UI redesign with clean card layout",
                ],
              },
              {
                version: "v1.1", date: "Mar 2026", items: [
                  "Activity history: contacts, tasks, notes, and calls on each deal card",
                  "Deal search and sort by close date",
                  "Automatic HubSpot token refresh in the background",
                  "Deal stage labels, pagination, and loading states",
                ],
              },
              {
                version: "v1.0", date: "Mar 2026", items: [
                  "Initial release — HubSpot OAuth login in one tap",
                  "My Deals: view all open deals assigned to you",
                  "Log Task: describe a meeting in plain English, Claude AI drafts the follow-up task",
                  "Tasks saved directly to HubSpot with deal association",
                ],
              },
            ] as { version: string; date: string; latest?: boolean; items: string[] }[]).map((release, i, arr) => (
              <div key={release.version} style={{ padding: "14px 20px", borderBottom: i < arr.length - 1 ? `1px solid ${C.border}` : "none" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <span style={{
                    fontSize: 11, fontWeight: 800, padding: "3px 9px", borderRadius: 6,
                    background: release.latest ? C.primary : C.subtle,
                    color: release.latest ? "#fff" : C.brand,
                    letterSpacing: 0.3,
                  }}>
                    {release.version}
                  </span>
                  {release.latest && (
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#16a34a", background: "#dcfce7", padding: "2px 7px", borderRadius: 4, letterSpacing: 0.3 }}>LATEST</span>
                  )}
                  <span style={{ fontSize: 12, color: "#94a3b8", fontWeight: 500 }}>{release.date}</span>
                </div>
                <ul style={{ margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 4 }}>
                  {release.items.map((item, j) => (
                    <li key={j} style={{ fontSize: 13, color: C.text, lineHeight: 1.6 }}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </details>

        {/* Footer */}
        <div style={{ marginTop: 32, textAlign: "center" }}>
          <Link href="/deals" style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            background: C.primary, color: "#fff", borderRadius: 10,
            padding: "12px 24px", textDecoration: "none", fontSize: 14, fontWeight: 700,
          }}>
            ← Back to Dashboard
          </Link>
          <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 16 }}>
            © 2026 Maxx Orthopedics. All rights reserved. ·{" "}
            <a href="https://maxxortho.com/privacy-policy/" target="_blank" rel="noopener noreferrer" style={{ color: C.primary }}>Privacy Policy</a>
          </p>
        </div>

      </div>
    </div>
  );
}
