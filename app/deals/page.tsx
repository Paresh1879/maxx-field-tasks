import { redirect } from "next/navigation";
import Link from "next/link";
import { FilterOperatorEnum } from "@hubspot/api-client/lib/codegen/crm/deals/models/Filter";
import { getHubspotClient } from "@/lib/hubspot";

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
  return (res.results ?? []) as Deal[];
}

function formatCurrency(amount?: string) {
  if (!amount) return null;
  const n = parseFloat(amount);
  if (isNaN(n)) return null;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

function formatDate(dateStr?: string) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function stageLabel(stage?: string) {
  if (!stage) return "Unknown";
  return stage
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
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
      <h1 className="text-2xl font-bold mb-1">Open Deals</h1>
      <p className="text-gray-500 text-sm mb-6">
        Tap a deal to log a task after your visit.
      </p>

      {deals.length === 0 ? (
        <p className="text-gray-400 text-center mt-16">No open deals found.</p>
      ) : (
        <ul className="space-y-3">
          {deals.map((deal) => {
            const name = deal.properties.dealname ?? "Unnamed Deal";
            const amount = formatCurrency(deal.properties.amount);
            const closeDate = formatDate(deal.properties.closedate);
            const stage = stageLabel(deal.properties.dealstage);

            return (
              <li key={deal.id}>
                <Link
                  href={`/deals/${deal.id}/new`}
                  className="block rounded-xl border border-gray-200 bg-white p-4 shadow-sm active:bg-gray-50"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-semibold text-base leading-snug">
                      {name}
                    </span>
                    <span className="shrink-0 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                      {stage}
                    </span>
                  </div>

                  {(amount || closeDate) && (
                    <div className="mt-2 flex gap-4 text-sm text-gray-500">
                      {amount && <span>{amount}</span>}
                      {closeDate && <span>Closes {closeDate}</span>}
                    </div>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
