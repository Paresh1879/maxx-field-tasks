import { redirect } from "next/navigation";
import { FilterOperatorEnum } from "@hubspot/api-client/lib/codegen/crm/deals/models/Filter";
import { getHubspotClient } from "@/lib/hubspot";
import DealsClient from "./DealsClient";

type Deal = {
  id: string;
  properties: {
    dealname?: string;
    dealstage?: string;
    amount?: string;
    closedate?: string;
  };
};

async function getOpenDeals(): Promise<Deal[]> {
  const client = await getHubspotClient();
  const res = await client.crm.deals.searchApi.doSearch({
    filterGroups: [
      {
        filters: [
          {
            propertyName: "dealstage",
            operator: FilterOperatorEnum.NotIn,
            values: ["closedwon", "closedlost"],
          },
        ],
      },
    ],
    properties: ["dealname", "dealstage", "amount", "closedate"],
    sorts: ["-hs_lastmodifieddate"],
    limit: 100,
    after: "0",
  });
  return (res.results ?? []).map((d) => ({
    id: d.id,
    properties: {
      dealname: d.properties.dealname ?? undefined,
      dealstage: d.properties.dealstage ?? undefined,
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
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Open Deals</h1>
      <p className="text-gray-400 text-sm mb-6">
        Tap a deal to log a task after your visit.
      </p>
      <DealsClient deals={deals} />
    </main>
  );
}
