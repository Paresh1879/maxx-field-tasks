import { redirect } from "next/navigation";
import Link from "next/link";
import { getHubspotClient } from "@/lib/hubspot";
import { getSession } from "@/lib/session";
import TaskDraftForm from "./TaskDraftForm";

export type Owner = { id: string; name: string };

async function getPageData(dealId: string): Promise<{
  dealName: string;
  owners: Owner[];
  currentOwnerId: string;
}> {
  const [client, session] = await Promise.all([getHubspotClient(), getSession()]);

  const [deal, ownersRes, tokenInfo] = await Promise.all([
    client.crm.deals.basicApi.getById(dealId, ["dealname"]),
    client.crm.owners.ownersApi.getPage(undefined, undefined, 100),
    fetch(`https://api.hubapi.com/oauth/v1/access-tokens/${session.accessToken}`).then(
      (r) => r.json() as Promise<{ user_id: number }>
    ),
  ]);

  const dealName = deal.properties["dealname"] ?? "this deal";
  const owners: Owner[] = (ownersRes.results ?? []).map((o) => ({
    id: String(o.id),
    name: [o.firstName, o.lastName].filter(Boolean).join(" ") || o.email || String(o.id),
  }));

  const currentOwner = (ownersRes.results ?? []).find(
    (o) => o.userId === tokenInfo.user_id
  );
  const currentOwnerId = currentOwner ? String(currentOwner.id) : "";

  return { dealName, owners, currentOwnerId };
}

export default async function NewTaskPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let dealName = "this deal";
  let owners: Owner[] = [];
  let currentOwnerId = "";

  try {
    ({ dealName, owners, currentOwnerId } = await getPageData(id));
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

      <TaskDraftForm dealId={id} dealName={dealName} owners={owners} currentOwnerId={currentOwnerId} />
    </main>
  );
}
