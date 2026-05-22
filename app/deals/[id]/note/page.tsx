import { redirect } from "next/navigation";
import Link from "next/link";
import { getHubspotClient } from "@/lib/hubspot";
import NoteForm from "./NoteForm";

async function getDealName(dealId: string): Promise<string> {
  const client = await getHubspotClient();
  const deal = await client.crm.deals.basicApi.getById(dealId, ["dealname"]);
  return deal.properties["dealname"] ?? "this deal";
}

export default async function NotePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string }>;
}) {
  const { id } = await params;
  const { from } = await searchParams;
  const backHref = from === "all" ? "/deals/all" : "/deals/list";
  const backLabel = from === "all" ? "All Deals" : "My Deals";
  let dealName = "this deal";
  try {
    dealName = await getDealName(id);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "";
    if (msg === "Not authenticated" || msg.includes("refresh failed")) redirect("/login");
  }

  return (
    <div className="min-h-screen" style={{ background: "#f4f8fb" }}>
      {/* Gradient header */}
      <div style={{ background: "linear-gradient(150deg, #0c2d48 0%, #1565a0 60%, #2e86c1 100%)" }}>
        <div className="max-w-lg mx-auto px-4 py-4">
          <Link
            href={backHref}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.8)",
              background: "rgba(255,255,255,0.12)", borderRadius: 8,
              padding: "6px 12px", textDecoration: "none", marginBottom: 14,
            }}
          >
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            {backLabel}
          </Link>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: "#fff", lineHeight: 1.2, letterSpacing: -0.3 }}>{dealName}</h1>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.65)", marginTop: 4 }}>Add a note to this deal in HubSpot.</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-5 pb-12">
        <NoteForm dealId={id} dealName={dealName} from={from} />
      </div>
    </div>
  );
}
