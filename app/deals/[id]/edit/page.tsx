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
    <div className="min-h-screen" style={{ background: "#f4f8fb" }}>
      {/* Gradient header */}
      <div style={{ background: "linear-gradient(150deg, #0c2d48 0%, #1565a0 60%, #2e86c1 100%)" }}>
        <div className="max-w-lg mx-auto px-4 py-4">
          <Link
            href="/deals/list"
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.8)",
              background: "rgba(255,255,255,0.12)", borderRadius: 8,
              padding: "6px 12px", textDecoration: "none", marginBottom: 14,
            }}
          >
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            My Deals
          </Link>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: "#fff", letterSpacing: -0.3 }}>Edit Deal</h1>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.65)", marginTop: 4 }}>{data.dealname}</p>
        </div>
      </div>
      <div className="max-w-lg mx-auto px-4 pt-5 pb-12">
        <EditDealForm dealId={id} initialValues={data} pipelines={data.pipelines} />
      </div>
    </div>
  );
}
