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

  const fieldStyle: React.CSSProperties = {
    width: "100%", background: "#fff", border: "1px solid #dce4ec", borderRadius: 12,
    padding: "12px 14px", fontSize: 15, color: "#0c2d48", outline: "none",
    boxSizing: "border-box", transition: "border-color 0.15s",
    opacity: state === "submitting" ? 0.5 : 1,
  };

  if (state === "done") {
    return (
      <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #dce4ec", padding: "40px 24px", textAlign: "center" }}>
        <div style={{
          width: 48, height: 48, borderRadius: "50%", background: "#dcfce7",
          display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px",
        }}>
          <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="#16a34a" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p style={{ fontSize: 18, fontWeight: 700, color: "#0c2d48", marginBottom: 4 }}>Deal created</p>
        <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 24 }}>{fields.dealname} is now in HubSpot.</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {dealUrl && (
            <a
              href={dealUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "block", padding: "14px 0", borderRadius: 12,
                background: "#1565a0", color: "#fff", fontWeight: 700, fontSize: 15,
                textAlign: "center", textDecoration: "none",
              }}
            >
              View in HubSpot
            </a>
          )}
          <button
            onClick={() => { setFields({ dealname: "", amount: "", closedate: "", pipeline: pipelines[0]?.id ?? "", dealstage: pipelines[0]?.stages[0]?.id ?? "" }); setDealUrl(null); setState("idle"); }}
            style={{
              width: "100%", padding: "14px 0", borderRadius: 12,
              border: "1px solid #dce4ec", background: "#fff",
              color: "#0c2d48", fontWeight: 600, fontSize: 15, cursor: "pointer",
            }}
          >
            Create another deal
          </button>
          <button
            onClick={() => router.push("/deals/list")}
            style={{ fontSize: 13, color: "#6b7280", padding: "8px 0", background: "none", border: "none", cursor: "pointer" }}
          >
            Back to My Deals
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #dce4ec", overflow: "hidden" }}>
        <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>
              Deal name <span style={{ color: "#1565a0" }}>*</span>
            </label>
            <input
              type="text"
              style={fieldStyle}
              placeholder="e.g. Riverside Medical — Hip System"
              value={fields.dealname}
              disabled={state === "submitting"}
              onChange={(e) => setFields((f) => ({ ...f, dealname: e.target.value }))}
              onFocus={(e) => { e.currentTarget.style.borderColor = "#1565a0"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "#dce4ec"; }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>Amount</label>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", fontSize: 15 }}>$</span>
              <input
                type="number"
                min="0"
                step="any"
                style={{ ...fieldStyle, paddingLeft: 28 }}
                placeholder="0"
                value={fields.amount}
                disabled={state === "submitting"}
                onChange={(e) => setFields((f) => ({ ...f, amount: e.target.value }))}
                onFocus={(e) => { e.currentTarget.style.borderColor = "#1565a0"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "#dce4ec"; }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>Close date</label>
            <input
              type="date"
              style={fieldStyle}
              value={fields.closedate}
              disabled={state === "submitting"}
              onChange={(e) => setFields((f) => ({ ...f, closedate: e.target.value }))}
              onFocus={(e) => { e.currentTarget.style.borderColor = "#1565a0"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "#dce4ec"; }}
            />
          </div>

          {pipelines.length > 0 && (
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>Pipeline</label>
              <select
                style={fieldStyle}
                value={fields.pipeline}
                disabled={state === "submitting"}
                onChange={(e) => handlePipelineChange(e.target.value)}
                onFocus={(e) => { e.currentTarget.style.borderColor = "#1565a0"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "#dce4ec"; }}
              >
                {pipelines.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
              </select>
            </div>
          )}

          {currentPipeline && currentPipeline.stages.length > 0 && (
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>Stage</label>
              <select
                style={fieldStyle}
                value={fields.dealstage}
                disabled={state === "submitting"}
                onChange={(e) => setFields((f) => ({ ...f, dealstage: e.target.value }))}
                onFocus={(e) => { e.currentTarget.style.borderColor = "#1565a0"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "#dce4ec"; }}
              >
                {currentPipeline.stages.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div style={{ padding: "12px 16px", background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 12 }}>
          <p style={{ fontSize: 13, color: "#dc2626" }}>{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={!fields.dealname.trim() || state === "submitting"}
        style={{
          width: "100%", padding: "16px 0", borderRadius: 12,
          background: "#1565a0", color: "#fff", fontWeight: 700, fontSize: 15,
          border: "none", cursor: "pointer", display: "flex", alignItems: "center",
          justifyContent: "center", gap: 8, transition: "opacity 0.15s",
          opacity: (!fields.dealname.trim() || state === "submitting") ? 0.4 : 1,
        }}
      >
        {state === "submitting" ? (
          <>
            <span style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "#fff", display: "inline-block", animation: "spin 0.7s linear infinite" }} />
            Creating…
          </>
        ) : (
          "Create deal in HubSpot"
        )}
      </button>
    </form>
  );
}
