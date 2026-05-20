import Link from "next/link";

export default async function DonePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ taskId?: string; taskUrl?: string }>;
}) {
  const { id } = await params;
  const { taskId, taskUrl } = await searchParams;

  const decoded = taskUrl ? (() => { try { return decodeURIComponent(taskUrl); } catch { return null; } })() : null;
  const hubspotLink = decoded?.startsWith("https://app.hubspot.com/") ? decoded : null;

  return (
    <main className="min-h-screen flex flex-col" style={{ background: "#f4f8fb" }}>
      {/* Gradient top */}
      <div style={{ background: "linear-gradient(150deg, #0c2d48 0%, #1565a0 60%, #2e86c1 100%)", padding: "48px 24px 56px", textAlign: "center" }}>
        <div style={{
          width: 56, height: 56, borderRadius: "50%",
          background: "rgba(255,255,255,0.15)", display: "flex",
          alignItems: "center", justifyContent: "center", margin: "0 auto 16px",
        }}>
          <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: "#fff", marginBottom: 8, letterSpacing: -0.3 }}>Task saved</h1>
        <p style={{ fontSize: 15, color: "rgba(255,255,255,0.75)", maxWidth: 260, margin: "0 auto", lineHeight: 1.5 }}>
          Your follow-up is in HubSpot, linked to this deal.
        </p>
        {taskId && (
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 10 }}>#{taskId}</p>
        )}
      </div>

      {/* Actions card */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: "0 20px 40px", marginTop: -20 }}>
        <div style={{
          background: "#fff", borderRadius: 20, border: "1px solid #dce4ec",
          boxShadow: "0 4px 24px rgba(12,45,72,0.08)",
          padding: "24px 20px", display: "flex", flexDirection: "column", gap: 10,
        }}>
          {hubspotLink && (
            <a
              href={hubspotLink}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "block", width: "100%", padding: "14px 0", borderRadius: 12,
                background: "#1565a0", color: "#fff", fontWeight: 700, fontSize: 15,
                textAlign: "center", textDecoration: "none",
              }}
            >
              View in HubSpot
            </a>
          )}
          <Link
            href={`/deals/${id}/new`}
            style={{
              display: "block", width: "100%", padding: "14px 0", borderRadius: 12,
              border: "1px solid #dce4ec", color: "#0c2d48", fontWeight: 600, fontSize: 15,
              textAlign: "center", textDecoration: "none",
            }}
          >
            Log another task
          </Link>
          <Link
            href="/deals/list"
            style={{
              display: "block", width: "100%", padding: "10px 0",
              color: "#6b7280", fontSize: 13, textAlign: "center", textDecoration: "none",
            }}
          >
            Back to My Deals
          </Link>
        </div>
      </div>
    </main>
  );
}
