import { redirect } from "next/navigation";
import Link from "next/link";
import { FilterOperatorEnum } from "@hubspot/api-client/lib/codegen/crm/deals/models/Filter";
import { HUBSPOT_API_BASE, getHubspotClient } from "@/lib/hubspot";
import { getSession } from "@/lib/session";
import AllDealsClient from "./AllDealsClient";

export type AllDeal = {
  id: string;
  properties: {
    dealname?: string;
    dealstage?: string;
    pipeline?: string;
    amount?: string;
    closedate?: string;
    ownerName?: string;
    ownerId?: string;
  };
};

async function getAllDeals(): Promise<AllDeal[]> {
  const [client, session] = await Promise.all([getHubspotClient(), getSession()]);
  const [pipelines, ownersRes] = await Promise.all([
    client.crm.pipelines.pipelinesApi.getAll("deals"),
    client.crm.owners.ownersApi.getPage(undefined, undefined, 100),
  ]);

  // Map owner IDs to names
  const ownerMap: Record<string, string> = {};
  for (const o of ownersRes.results ?? []) {
    ownerMap[String(o.id)] = [o.firstName, o.lastName].filter(Boolean).join(" ") || o.email || String(o.id);
  }

  const res = await client.crm.deals.searchApi.doSearch({
    filterGroups: [{ filters: [
      { propertyName: "dealstage", operator: FilterOperatorEnum.NotIn, values: ["closedwon", "closedlost"] },
    ]}],
    properties: ["dealname", "dealstage", "pipeline", "amount", "closedate", "hubspot_owner_id"],
    sorts: ["-hs_lastmodifieddate"],
    limit: 200,
    after: "0",
  });

  const stageMap: Record<string, string> = {};
  const pipelineMap: Record<string, string> = {};
  for (const pipeline of pipelines.results ?? []) {
    pipelineMap[pipeline.id] = pipeline.label;
    for (const stage of pipeline.stages ?? []) stageMap[stage.id] = stage.label;
  }

  // Get current user's owner ID for highlighting
  let currentOwnerId: string | null = null;
  try {
    const tokenInfo = await fetch(`${HUBSPOT_API_BASE}/oauth/v1/access-tokens/${session.accessToken}`).then((r) => r.json() as Promise<{ user_id: number }>);
    const currentOwner = (ownersRes.results ?? []).find((o) => o.userId === tokenInfo.user_id);
    currentOwnerId = currentOwner ? String(currentOwner.id) : null;
  } catch { /* ignore */ }

  return (res.results ?? []).map((d) => ({
    id: d.id,
    properties: {
      dealname: d.properties.dealname ?? undefined,
      dealstage: d.properties.dealstage ? (stageMap[d.properties.dealstage] ?? undefined) : undefined,
      pipeline: d.properties.pipeline ? (pipelineMap[d.properties.pipeline] ?? undefined) : undefined,
      amount: d.properties.amount ?? undefined,
      closedate: d.properties.closedate ?? undefined,
      ownerName: d.properties.hubspot_owner_id ? (ownerMap[d.properties.hubspot_owner_id] ?? "Unknown") : "Unassigned",
      ownerId: d.properties.hubspot_owner_id ?? undefined,
    },
    isCurrentUser: currentOwnerId ? d.properties.hubspot_owner_id === currentOwnerId : false,
  })) as AllDeal[];
}

export default async function AllDealsPage() {
  let deals: AllDeal[] = [];
  try {
    deals = await getAllDeals();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "";
    if (msg === "Not authenticated" || msg.includes("refresh failed")) redirect("/login");
    throw err;
  }

  return (
    <div className="min-h-screen" style={{ background: "#f4f8fb" }}>
      <div style={{ background: "linear-gradient(150deg, #0c2d48 0%, #4a148c 60%, #7b1fa2 100%)" }}>
        <div className="max-w-2xl mx-auto px-4 pt-4 pb-5">
          <Link
            href="/deals"
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
            Dashboard
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: "rgba(255,255,255,0.15)", display: "flex",
              alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="7" width="20" height="14" rx="2" />
                <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
              </svg>
            </div>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 800, color: "#fff", letterSpacing: -0.3 }}>All Deals</h1>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.65)", marginTop: 2 }}>
                {deals.length} open deal{deals.length !== 1 ? "s" : ""} · all team members
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-4 pb-12">
        <AllDealsClient deals={deals} />
      </div>
    </div>
  );
}
