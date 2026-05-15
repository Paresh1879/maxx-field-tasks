"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { PipelineOption } from "./page";

type State = "idle" | "submitting" | "done";

export default function NewDealForm({ pipelines }: { pipelines: PipelineOption[] }) {
  const router = useRouter();
  const [state, setState] = useState<State>("idle");
  const [error, setError] = useState<string | null>(null);
  const [dealUrl, setDealUrl] = useState<string | null>(null);
  const [fields, setFields] = useState({
    dealname: "",
    amount: "",
    closedate: "",
    pipeline: pipelines[0]?.id ?? "",
    dealstage: pipelines[0]?.stages[0]?.id ?? "",
  });

  const currentPipeline = pipelines.find((p) => p.id === fields.pipeline);

  function handlePipelineChange(pipelineId: string) {
    const pipeline = pipelines.find((p) => p.id === pipelineId);
    setFields((f) => ({ ...f, pipeline: pipelineId, dealstage: pipeline?.stages[0]?.id ?? "" }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!fields.dealname.trim()) return;
    setState("submitting");
    setError(null);
    try {
      const res = await fetch("/api/deals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      });
      if (res.status === 401) { router.push("/login"); return; }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to create deal");
      }
      const data = await res.json();
      setDealUrl(data.dealUrl ?? null);
      setState("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't create the deal. Try again.");
      setState("idle");
    }
  }

  const fieldClass = "w-full bg-white border border-[#ebebeb] rounded-xl px-3.5 py-3 text-[15px] text-[#111111] placeholder-[#999999] focus:outline-none focus:border-[#F97316] transition disabled:opacity-50";

  if (state === "done") {
    return (
      <div className="bg-white rounded-xl border border-[#ebebeb] px-6 py-10 text-center">
        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
          <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="text-[17px] font-semibold text-[#111111] mb-1">Deal created</p>
        <p className="text-[13px] text-[#999999] mb-6">{fields.dealname} is now in HubSpot.</p>
        <div className="flex flex-col gap-2.5">
          {dealUrl && (
            <a
              href={dealUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3.5 rounded-xl bg-[#F97316] text-white font-semibold text-[15px] text-center active:opacity-80 transition"
            >
              View in HubSpot
            </a>
          )}
          <button
            onClick={() => { setFields({ dealname: "", amount: "", closedate: "", pipeline: pipelines[0]?.id ?? "", dealstage: pipelines[0]?.stages[0]?.id ?? "" }); setDealUrl(null); setState("idle"); }}
            className="w-full py-3.5 rounded-xl border border-[#ebebeb] text-[#111111] font-medium text-[15px] active:bg-[#FAFAF8] transition"
          >
            Create another deal
          </button>
          <button
            onClick={() => router.push("/deals")}
            className="text-[13px] text-[#999999] py-2 active:text-[#666666] transition"
          >
            Back to My Deals
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="bg-white rounded-xl border border-[#ebebeb] overflow-hidden">
        <div className="p-4 flex flex-col gap-4">
          <div>
            <label className="block text-[11px] font-semibold text-[#999999] uppercase tracking-wider mb-1.5">
              Deal name <span className="text-[#F97316]">*</span>
            </label>
            <input
              type="text"
              className={fieldClass}
              placeholder="e.g. Riverside Medical — Hip System"
              value={fields.dealname}
              disabled={state === "submitting"}
              onChange={(e) => setFields((f) => ({ ...f, dealname: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[#999999] uppercase tracking-wider mb-1.5">Amount</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#999999] text-[15px]">$</span>
              <input
                type="number"
                min="0"
                step="any"
                className={`${fieldClass} pl-7`}
                placeholder="0"
                value={fields.amount}
                disabled={state === "submitting"}
                onChange={(e) => setFields((f) => ({ ...f, amount: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[#999999] uppercase tracking-wider mb-1.5">Close date</label>
            <input
              type="date"
              className={fieldClass}
              value={fields.closedate}
              disabled={state === "submitting"}
              onChange={(e) => setFields((f) => ({ ...f, closedate: e.target.value }))}
            />
          </div>

          {pipelines.length > 0 && (
            <div>
              <label className="block text-[11px] font-semibold text-[#999999] uppercase tracking-wider mb-1.5">Pipeline</label>
              <select
                className={fieldClass}
                value={fields.pipeline}
                disabled={state === "submitting"}
                onChange={(e) => handlePipelineChange(e.target.value)}
              >
                {pipelines.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
              </select>
            </div>
          )}

          {currentPipeline && currentPipeline.stages.length > 0 && (
            <div>
              <label className="block text-[11px] font-semibold text-[#999999] uppercase tracking-wider mb-1.5">Stage</label>
              <select
                className={fieldClass}
                value={fields.dealstage}
                disabled={state === "submitting"}
                onChange={(e) => setFields((f) => ({ ...f, dealstage: e.target.value }))}
              >
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

      <button
        type="submit"
        disabled={!fields.dealname.trim() || state === "submitting"}
        className="w-full py-4 rounded-xl bg-[#F97316] text-white font-semibold text-[15px] disabled:opacity-40 active:opacity-80 transition flex items-center justify-center gap-2"
      >
        {state === "submitting" ? (
          <>
            <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
            Creating…
          </>
        ) : (
          "Create deal in HubSpot"
        )}
      </button>
    </form>
  );
}
