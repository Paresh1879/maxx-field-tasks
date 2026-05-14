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
  const currentOwner = (ownersRes.results ?? []).find(
    (o) => o.userId === tokenInfo.user_id
  );
  const ownerId = currentOwner ? String(currentOwner.id) : null;

  const filters = [
    {
      propertyName: "dealstage",
      operator: FilterOperatorEnum.NotIn,
      values: ["closedwon", "closedlost"],
    },
    ...(ownerId
      ? [{ propertyName: "hubspot_owner_id", operator: FilterOperatorEnum.Eq, value: ownerId }]
      : []),
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
    for (const stage of pipeline.stages ?? []) {
      stageMap[stage.id] = stage.label;
    }
  }

  return (res.results ?? []).map((d) => ({
    id: d.id,
    properties: {
      dealname: d.properties.dealname ?? undefined,
      dealstage: d.properties.dealstage
        ? (stageMap[d.properties.dealstage] ?? undefined)
        : undefined,
      pipeline: d.properties.pipeline
        ? (pipelineMap[d.properties.pipeline] ?? undefined)
        : undefined,
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
    if (msg === "Not authenticated" || msg.includes("refresh failed")) {
      redirect("/login");
    }
    throw err;
  }

  return (
    <main className="flex-1 px-4 py-6 max-w-lg mx-auto w-full">
      <div className="flex items-center justify-between mb-6">
        <Image src="/logo.png" alt="Maxx Orthopedics" width={120} height={60} style={{ height: "auto" }} priority />
        <form action="/api/auth/logout" method="POST">
          <button
            type="submit"
            className="text-sm font-medium text-gray-600 border border-gray-300 rounded-lg px-3 py-1.5 active:bg-gray-100 transition"
          >
            Sign out
          </button>
        </form>
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Open Deals</h1>
      <p className="text-gray-400 text-sm mb-6">
        Tap a deal to log a task after your visit.
      </p>
      <DealsClient deals={deals} />
    </main>
  );
}
