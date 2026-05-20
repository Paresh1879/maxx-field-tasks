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
      router.push("/deals/list");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't update the deal. Try again.");
    } finally {
      setSaving(false);
    }
  }

  const fieldStyle: React.CSSProperties = {
    width: "100%", background: "#fff", border: "1px solid #dce4ec", borderRadius: 12,
    padding: "12px 14px", fontSize: 15, color: "#0c2d48", outline: "none",
    boxSizing: "border-box", transition: "border-color 0.15s",
    opacity: saving ? 0.5 : 1,
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #dce4ec", overflow: "hidden" }}>
        <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>Deal name *</label>
            <input
              type="text" style={fieldStyle} value={fields.dealname} disabled={saving}
              onChange={(e) => setFields((f) => ({ ...f, dealname: e.target.value }))}
              onFocus={(e) => { e.currentTarget.style.borderColor = "#1565a0"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "#dce4ec"; }}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>Amount</label>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }}>$</span>
              <input
                type="number" min="0" step="any"
                style={{ ...fieldStyle, paddingLeft: 28 }}
                value={fields.amount} disabled={saving}
                onChange={(e) => setFields((f) => ({ ...f, amount: e.target.value }))}
                onFocus={(e) => { e.currentTarget.style.borderColor = "#1565a0"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "#dce4ec"; }}
              />
            </div>
          </div>
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>Close date</label>
            <input
              type="date" style={fieldStyle} value={fields.closedate} disabled={saving}
              onChange={(e) => setFields((f) => ({ ...f, closedate: e.target.value }))}
              onFocus={(e) => { e.currentTarget.style.borderColor = "#1565a0"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "#dce4ec"; }}
            />
          </div>
          {pipelines.length > 0 && (
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>Pipeline</label>
              <select
                style={fieldStyle} value={fields.pipeline} disabled={saving}
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
                style={fieldStyle} value={fields.dealstage} disabled={saving}
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
        disabled={!fields.dealname.trim() || saving}
        style={{
          width: "100%", padding: "16px 0", borderRadius: 12,
          background: "#1565a0", color: "#fff", fontWeight: 700, fontSize: 15,
          border: "none", cursor: "pointer", display: "flex", alignItems: "center",
          justifyContent: "center", gap: 8, transition: "opacity 0.15s",
          opacity: (!fields.dealname.trim() || saving) ? 0.4 : 1,
        }}
      >
        {saving ? (
          <>
            <span style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "#fff", display: "inline-block", animation: "spin 0.7s linear infinite" }} />
            Saving…
          </>
        ) : (
          "Save changes"
        )}
      </button>
    </form>
  );
}
