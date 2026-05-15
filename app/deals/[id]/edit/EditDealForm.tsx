"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { PipelineOption } from "@/app/deals/new/page";

type Fields = { dealname: string; amount: string; closedate: string; pipeline: string; dealstage: string };

export default function EditDealForm({
  dealId,
  initialValues,
  pipelines,
}: {
  dealId: string;
  initialValues: Fields;
  pipelines: PipelineOption[];
}) {
  const router = useRouter();
  const [fields, setFields] = useState<Fields>(initialValues);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentPipeline = pipelines.find((p) => p.id === fields.pipeline);

  function handlePipelineChange(pipelineId: string) {
    const pipeline = pipelines.find((p) => p.id === pipelineId);
    setFields((f) => ({ ...f, pipeline: pipelineId, dealstage: pipeline?.stages[0]?.id ?? "" }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!fields.dealname.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/deals/${dealId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      });
      if (res.status === 401) { router.push("/login"); return; }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to update deal");
      }
      router.push("/deals");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't update the deal. Try again.");
    } finally {
      setSaving(false);
    }
  }

  const fieldClass = "w-full bg-white border border-[#ebebeb] rounded-xl px-3.5 py-3 text-[15px] text-[#111111] placeholder-[#999999] focus:outline-none focus:border-[#F97316] transition disabled:opacity-50";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="bg-white rounded-xl border border-[#ebebeb] overflow-hidden">
        <div className="p-4 flex flex-col gap-4">
          <div>
            <label className="block text-[11px] font-semibold text-[#999999] uppercase tracking-wider mb-1.5">Deal name *</label>
            <input type="text" className={fieldClass} value={fields.dealname} disabled={saving}
              onChange={(e) => setFields((f) => ({ ...f, dealname: e.target.value }))} />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-[#999999] uppercase tracking-wider mb-1.5">Amount</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#999999]">$</span>
              <input type="number" min="0" step="any" className={`${fieldClass} pl-7`} value={fields.amount} disabled={saving}
                onChange={(e) => setFields((f) => ({ ...f, amount: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-[#999999] uppercase tracking-wider mb-1.5">Close date</label>
            <input type="date" className={fieldClass} value={fields.closedate} disabled={saving}
              onChange={(e) => setFields((f) => ({ ...f, closedate: e.target.value }))} />
          </div>
          {pipelines.length > 0 && (
            <div>
              <label className="block text-[11px] font-semibold text-[#999999] uppercase tracking-wider mb-1.5">Pipeline</label>
              <select className={fieldClass} value={fields.pipeline} disabled={saving}
                onChange={(e) => handlePipelineChange(e.target.value)}>
                {pipelines.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
              </select>
            </div>
          )}
          {currentPipeline && currentPipeline.stages.length > 0 && (
            <div>
              <label className="block text-[11px] font-semibold text-[#999999] uppercase tracking-wider mb-1.5">Stage</label>
              <select className={fieldClass} value={fields.dealstage} disabled={saving}
                onChange={(e) => setFields((f) => ({ ...f, dealstage: e.target.value }))}>
                {currentPipeline.stages.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="px-4 py-3 bg-red-50 border border-red-100 rounded-xl">
          <p className="text-[13px] text-red-600">{error}</p>
        </div>
      )}

      <button type="submit" disabled={!fields.dealname.trim() || saving}
        className="w-full py-4 rounded-xl bg-[#F97316] text-white font-semibold text-[15px] disabled:opacity-40 active:opacity-80 transition flex items-center justify-center gap-2">
        {saving ? <><span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />Saving…</> : "Save changes"}
      </button>
    </form>
  );
}
