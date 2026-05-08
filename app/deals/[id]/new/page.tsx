import { redirect } from "next/navigation";
import Link from "next/link";
import { getHubspotClient } from "@/lib/hubspot";
import TaskDraftForm from "./TaskDraftForm";

export type Owner = { id: string; name: string };

async function getPageData(dealId: string): Promise<{ dealName: string; owners: Owner[] }> {
  const client = await getHubspotClient();

  const [deal, ownersRes] = await Promise.all([
    client.crm.deals.basicApi.getById(dealId, ["dealname"]),
    client.crm.owners.ownersApi.getPage(undefined, undefined, 100),
  ]);

  const dealName = deal.properties["dealname"] ?? "this deal";
  const owners: Owner[] = (ownersRes.results ?? []).map((o) => ({
    id: String(o.id),
    name: [o.firstName, o.lastName].filter(Boolean).join(" ") || o.email || String(o.id),
  }));

  return { dealName, owners };
}

export default async function NewTaskPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let dealName = "this deal";
  let owners: Owner[] = [];

  try {
    ({ dealName, owners } = await getPageData(id));
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "";
    if (msg === "Not authenticated" || msg.includes("refresh failed")) {
      redirect("/login");
    }
  }

  return (
    <main className="flex-1 px-4 py-6 max-w-lg mx-auto w-full">
      <Link href="/deals" className="text-sm text-indigo-500 mb-4 inline-block">
        ← Back to deals
      </Link>
      <h1 className="text-xl font-bold text-gray-900 mb-1 leading-snug">{dealName}</h1>
      <p className="text-gray-400 text-sm mb-6">
        Describe your visit to generate the task.
      </p>

      <TaskDraftForm dealId={id} dealName={dealName} owners={owners} />
    </main>
  );
}
