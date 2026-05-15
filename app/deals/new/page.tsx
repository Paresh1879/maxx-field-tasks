import { redirect } from "next/navigation";
import Link from "next/link";
import { getHubspotClient } from "@/lib/hubspot";
import NewDealForm from "./NewDealForm";

export type PipelineOption = {
  id: string;
  label: string;
  stages: { id: string; label: string }[];
};

async function getPipelines(): Promise<PipelineOption[]> {
  const client = await getHubspotClient();
  const res = await client.crm.pipelines.pipelinesApi.getAll("deals");
  return (res.results ?? []).map((p) => ({
    id: p.id,
    label: p.label,
    stages: (p.stages ?? []).map((s) => ({ id: s.id, label: s.label })),
  }));
}

export default async function NewDealPage() {
  let pipelines: PipelineOption[] = [];
  try {
    pipelines = await getPipelines();
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
          <h1 className="text-[18px] font-semibold text-[#111111]">New Deal</h1>
          <p className="text-[13px] text-[#999999] mt-0.5">Add a deal to HubSpot right from the field.</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-5 pb-12">
        <NewDealForm pipelines={pipelines} />
      </div>
    </div>
  );
}
