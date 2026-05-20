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
          <h1 style={{ fontSize: 20, fontWeight: 800, color: "#fff", letterSpacing: -0.3 }}>New Deal</h1>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.65)", marginTop: 4 }}>Add a deal to HubSpot right from the field.</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-5 pb-12">
        <NewDealForm pipelines={pipelines} />
      </div>
    </div>
  );
}
