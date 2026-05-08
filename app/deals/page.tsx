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

      {deals.length === 0 ? (
        <p className="text-gray-400 text-center mt-16">No open deals found.</p>
      ) : (
        <ul className="space-y-3">
          {deals.map((deal) => {
            const name = deal.properties.dealname ?? "Unnamed Deal";
            const amount = formatCurrency(deal.properties.amount);
            const closeDate = formatDate(deal.properties.closedate);

            return (
              <li key={deal.id}>
                <Link
                  href={`/deals/${deal.id}/new`}
                  className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white px-4 py-4 shadow-sm active:bg-gray-50 transition"
                >
                  {/* Avatar */}
                  <div className="shrink-0 w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                    <span className="text-indigo-600 font-bold text-sm">
                      {name.charAt(0).toUpperCase()}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-base leading-snug truncate">
                      {name}
                    </p>
                    <div className="flex gap-3 mt-0.5 text-sm text-gray-400">
                      {amount && (
                        <span className="font-medium text-emerald-600">{amount}</span>
                      )}
                      {closeDate && <span>Closes {closeDate}</span>}
                    </div>
                  </div>

                  {/* Chevron */}
                  <svg
                    className="shrink-0 text-gray-300 w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
