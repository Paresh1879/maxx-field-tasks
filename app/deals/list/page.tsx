import { redirect } from "next/navigation";
import Link from "next/link";
import { FilterOperatorEnum } from "@hubspot/api-client/lib/codegen/crm/deals/models/Filter";
import { HUBSPOT_API_BASE, getHubspotClient } from "@/lib/hubspot";
import { getSession } from "@/lib/session";
import DealsClient from "../DealsClient";

type Deal = {
  id: string;
  properties: {
    dealname?: string;
    dealstage?: string;
    pipeline?: string;
    amount?: string;
    closedate?: string;
  };
};

async function getOpenDeals(): Promise<Deal[]> {
  const [client, session] = await Promise.all([getHubspotClient(), getSession()]);
  const [tokenInfo, pipelines] = await Promise.all([
    fetch(`${HUBSPOT_API_BASE}/oauth/v1/access-tokens/${session.accessToken}`)
      .then((r) => r.json() as Promise<{ user_id: number }>),
    client.crm.pipelines.pipelinesApi.getAll("deals"),
  ]);

  const ownersRes = await client.crm.owners.ownersApi.getPage(undefined, undefined, 100);
  const currentOwner = (ownersRes.results ?? []).find((o) => o.userId === tokenInfo.user_id);
  const ownerId = currentOwner ? String(currentOwner.id) : null;

  const filters = [
    { propertyName: "dealstage", operator: FilterOperatorEnum.NotIn, values: ["closedwon", "closedlost"] },
    ...(ownerId ? [{ propertyName: "hubspot_owner_id", operator: FilterOperatorEnum.Eq, value: ownerId }] : []),
  ];

  const res = await client.crm.deals.searchApi.doSearch({
    filterGroups: [{ filters }],
    properties: ["dealname", "dealstage", "pipeline", "amount", "closedate"],
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

  return (res.results ?? []).map((d) => ({
    id: d.id,
    properties: {
      dealname: d.properties.dealname ?? undefined,
      dealstage: d.properties.dealstage ? (stageMap[d.properties.dealstage] ?? undefined) : undefined,
      pipeline: d.properties.pipeline ? (pipelineMap[d.properties.pipeline] ?? undefined) : undefined,
      amount: d.properties.amount ?? undefined,
      closedate: d.properties.closedate ?? undefined,
    },
  })) as Deal[];
}

export default async function DealsListPage() {
  let deals: Deal[] = [];
  try {
    deals = await getOpenDeals();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "";
    if (msg === "Not authenticated" || msg.includes("refresh failed")) redirect("/login");
    throw err;
  }

  return (
    <div className="min-h-screen" style={{ background: "#f4f8fb" }}>
      {/* Gradient header */}
      <div style={{ background: "linear-gradient(150deg, #0c2d48 0%, #1565a0 60%, #2e86c1 100%)" }}>
        <div className="max-w-lg mx-auto px-4 pt-4 pb-5">
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
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: "#fff", letterSpacing: -0.3 }}>My Deals</h1>
            <a
              href="/deals/new"
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                fontSize: 13, fontWeight: 700, color: "#fff",
                background: "rgba(255,255,255,0.15)", borderRadius: 8,
                padding: "6px 12px", textDecoration: "none",
              }}
            >
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              New Deal
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-4 pb-12">
        <DealsClient deals={deals} />
      </div>
    </div>
  );
}
