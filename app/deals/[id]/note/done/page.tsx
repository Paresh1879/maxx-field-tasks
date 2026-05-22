import Link from "next/link";

export default async function NoteDonePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ dealUrl?: string; from?: string }>;
}) {
  const { id } = await params;
  const { dealUrl, from } = await searchParams;
  const backHref = from === "all" ? "/deals/all" : "/deals/list";
  const backLabel = from === "all" ? "All Deals" : "My Deals";

  const decoded = dealUrl ? (() => { try { return decodeURIComponent(dealUrl); } catch { return null; } })() : null;
  const hubspotLink = decoded?.startsWith("https://app.hubspot.com/") ? decoded : null;

  return (
    <main className="min-h-screen" style={{ background: "#f4f8fb" }}>
      {/* Gradient header — compact */}
      <div style={{
        background: "linear-gradient(150deg, #0c2d48 0%, #1565a0 60%, #2e86c1 100%)",
        padding: "28px 24px 44px",
        textAlign: "center",
      }}>
        <div style={{
          width: 44, height: 44, borderRadius: "50%",
          background: "rgba(255,255,255,0.18)",
          border: "2px solid rgba(255,255,255,0.28)",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 10px",
        }}>
          <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: "#fff", marginBottom: 4, letterSpacing: -0.3 }}>
          Note saved
        </h1>
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.72)", maxWidth: 240, margin: "0 auto", lineHeight: 1.5 }}>
          Added to this deal in HubSpot.
        </p>
      </div>

      {/* Action card — overlaps gradient */}
      <div style={{ maxWidth: 480, margin: "-20px auto 0", padding: "0 20px 40px" }}>
        <div style={{
          background: "#fff", borderRadius: 20, border: "1px solid #dce4ec",
          boxShadow: "0 4px 24px rgba(12,45,72,0.08)",
          padding: "20px",
          display: "flex", flexDirection: "column", gap: 10,
        }}>
          {/* PRIMARY */}
          <Link
            href={backHref}
            style={{
              display: "block", width: "100%", padding: "15px 0", borderRadius: 12,
              background: "#1565a0", color: "#fff", fontWeight: 700, fontSize: 15,
              textAlign: "center", textDecoration: "none",
            }}
          >
            Back to {backLabel}
          </Link>

          {/* SECONDARY */}
          <Link
            href={`/deals/${id}/note${from ? `?from=${from}` : ""}`}
            style={{
              display: "block", width: "100%", padding: "14px 0", borderRadius: 12,
              border: "1.5px solid #dce4ec", background: "#fff",
              color: "#0c2d48", fontWeight: 600, fontSize: 15,
              textAlign: "center", textDecoration: "none",
            }}
          >
            Add another note
          </Link>

          {/* TERTIARY */}
          {hubspotLink && (
            <a
              href={hubspotLink}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                padding: "13px 0", borderRadius: 12,
                border: "1.5px solid #dce4ec", background: "#fff",
                color: "#374151", fontSize: 14, fontWeight: 600,
                textDecoration: "none",
              }}
            >
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              View in HubSpot
            </a>
          )}
        </div>
      </div>
    </main>
  );
}
