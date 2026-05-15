import { redirect } from "next/navigation";
import Image from "next/image";
import { FilterOperatorEnum } from "@hubspot/api-client/lib/codegen/crm/deals/models/Filter";
import { HUBSPOT_API_BASE, getHubspotClient } from "@/lib/hubspot";
import { getSession } from "@/lib/session";
import DealsClient from "./DealsClient";

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

export default async function DealsPage() {
  let deals: Deal[] = [];
  try {
    deals = await getOpenDeals();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "";
    if (msg === "Not authenticated" || msg.includes("refresh failed")) redirect("/login");
    throw err;
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      {/* Header */}
      <div className="bg-white border-b border-[#ebebeb]">
        <div className="max-w-lg mx-auto px-4 pt-5 pb-4">
          <div className="flex justify-end mb-4">
            <form action="/api/auth/logout" method="POST">
              <button
                type="submit"
                className="text-[13px] text-[#666666] font-medium active:text-[#111111] transition"
              >
                Sign out
              </button>
            </form>
          </div>
          <div className="flex justify-center mb-5">
            <Image src="/logo.png" alt="Maxx Orthopedics" width={148} height={74} style={{ height: "auto" }} priority />
          </div>
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-[#111111]">My Deals</h1>
            <a
              href="/deals/new"
              className="flex items-center gap-1.5 text-[13px] font-semibold text-[#F97316] active:opacity-70 transition"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              New Deal
            </a>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-lg mx-auto px-4 pt-4 pb-12">
        <DealsClient deals={deals} />
      </div>
    </div>
  );
}
