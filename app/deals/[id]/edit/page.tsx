import { redirect } from "next/navigation";
import Link from "next/link";
import { getHubspotClient } from "@/lib/hubspot";
import EditDealForm from "./EditDealForm";
import type { PipelineOption } from "@/app/deals/new/page";

async function getPageData(dealId: string) {
  const client = await getHubspotClient();
  const [deal, pipelinesRes] = await Promise.all([
    client.crm.deals.basicApi.getById(dealId, ["dealname", "amount", "closedate", "pipeline", "dealstage"]),
    client.crm.pipelines.pipelinesApi.getAll("deals"),
  ]);

  const pipelines: PipelineOption[] = (pipelinesRes.results ?? []).map((p) => ({
    id: p.id,
    label: p.label,
    stages: (p.stages ?? []).map((s) => ({ id: s.id, label: s.label })),
  }));

  return {
    dealname: deal.properties.dealname ?? "",
    amount: deal.properties.amount ?? "",
    closedate: deal.properties.closedate ?? "",
    pipeline: deal.properties.pipeline ?? "",
    dealstage: deal.properties.dealstage ?? "",
    pipelines,
  };
}

export default async function EditDealPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let data = { dealname: "", amount: "", closedate: "", pipeline: "", dealstage: "", pipelines: [] as PipelineOption[] };

  try {
    data = await getPageData(id);
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
          <h1 className="text-[18px] font-semibold text-[#111111]">Edit Deal</h1>
          <p className="text-[13px] text-[#999999] mt-0.5">{data.dealname}</p>
        </div>
      </div>
      <div className="max-w-lg mx-auto px-4 pt-5 pb-12">
        <EditDealForm dealId={id} initialValues={data} pipelines={data.pipelines} />
      </div>
    </div>
  );
}
