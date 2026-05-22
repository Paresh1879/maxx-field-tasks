import { redirect } from "next/navigation";
import Link from "next/link";
import { getHubspotClient } from "@/lib/hubspot";
import { getSession } from "@/lib/session";
import TaskDraftForm from "./TaskDraftForm";
import ActivityPanel from "./ActivityPanel";

export type Owner = { id: string; name: string };

async function getPageData(dealId: string): Promise<{ dealName: string; owners: Owner[]; currentOwnerId: string }> {
  const [client, session] = await Promise.all([getHubspotClient(), getSession()]);
  const [deal, ownersRes, tokenInfo] = await Promise.all([
    client.crm.deals.basicApi.getById(dealId, ["dealname"]),
    client.crm.owners.ownersApi.getPage(undefined, undefined, 100),
    fetch(`https://api.hubapi.com/oauth/v1/access-tokens/${session.accessToken}`).then((r) => r.json() as Promise<{ user_id: number }>),
  ]);
  const dealName = deal.properties["dealname"] ?? "this deal";
  const owners: Owner[] = (ownersRes.results ?? []).map((o) => ({
    id: String(o.id),
    name: [o.firstName, o.lastName].filter(Boolean).join(" ") || o.email || String(o.id),
  }));
  const currentOwner = (ownersRes.results ?? []).find((o) => o.userId === tokenInfo.user_id);
  return { dealName, owners, currentOwnerId: currentOwner ? String(currentOwner.id) : "" };
}

export default async function NewTaskPage({
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
  let owners: Owner[] = [];
  let currentOwnerId = "";

  try {
    ({ dealName, owners, currentOwnerId } = await getPageData(id));
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
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.65)", marginTop: 4 }}>Describe what happened — AI will draft the task.</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-5 pb-6">
        <TaskDraftForm dealId={id} dealName={dealName} owners={owners} currentOwnerId={currentOwnerId} from={from} />
      </div>

      <div className="max-w-lg mx-auto px-4 pb-12">
        <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #dce4ec", padding: "16px" }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 12 }}>Deal Activity</p>
          <ActivityPanel dealId={id} />
        </div>
      </div>
    </div>
  );
}
