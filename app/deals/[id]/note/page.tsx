import { redirect } from "next/navigation";
import Link from "next/link";
import { getHubspotClient } from "@/lib/hubspot";
import NoteForm from "./NoteForm";

async function getDealName(dealId: string): Promise<string> {
  const client = await getHubspotClient();
  const deal = await client.crm.deals.basicApi.getById(dealId, ["dealname"]);
  return deal.properties["dealname"] ?? "this deal";
}

export default async function NotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let dealName = "this deal";
  try {
    dealName = await getDealName(id);
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
          <p className="text-[13px] text-[#999999] mt-0.5">Add a note to this deal in HubSpot.</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-5 pb-12">
        <NoteForm dealId={id} dealName={dealName} />
      </div>
    </div>
  );
}
