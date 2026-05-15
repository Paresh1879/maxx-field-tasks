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

export default async function NewTaskPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
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
    <div className="min-h-screen bg-[#FAFAF8]">
      <div className="bg-white border-b border-[#ebebeb]">
        <div className="max-w-lg mx-auto px-4 py-4">
          <Link href="/deals" className="flex items-center gap-1 text-[13px] text-[#666666] active:text-[#111111] transition mb-4">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            My Deals
          </Link>
          <h1 className="text-[18px] font-semibold text-[#111111] leading-snug">{dealName}</h1>
          <p className="text-[13px] text-[#999999] mt-0.5">Describe what happened — AI will draft the task.</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-5 pb-6">
        <TaskDraftForm dealId={id} dealName={dealName} owners={owners} currentOwnerId={currentOwnerId} />
      </div>

      <div className="max-w-lg mx-auto px-4 pb-12">
        <div className="bg-white rounded-xl border border-[#ebebeb] px-4 py-4">
          <p className="text-[11px] font-semibold text-[#999999] uppercase tracking-wider mb-3">Deal Activity</p>
          <ActivityPanel dealId={id} />
        </div>
      </div>
    </div>
  );
}
