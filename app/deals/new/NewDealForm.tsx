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
  const [showContact, setShowContact] = useState(false);
  const [showCompany, setShowCompany] = useState(false);
  const [contact, setContact] = useState({ firstname: "", lastname: "", email: "", jobtitle: "" });
  const [company, setCompany] = useState({ name: "", domain: "" });

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
      const dealId = data.dealId ?? null;

      const sideEffects: Promise<unknown>[] = [];
      if (dealId && showContact && (contact.firstname.trim() || contact.email.trim())) {
        sideEffects.push(fetch("/api/contacts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...contact, dealId }),
        }));
      }
      if (dealId && showCompany && company.name.trim()) {
        sideEffects.push(fetch("/api/companies", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...company, dealId }),
        }));
      }
      await Promise.allSettled(sideEffects);

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

      {/* Contact section */}
      <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #dce4ec", overflow: "hidden" }}>
        <button
          type="button"
          onClick={() => setShowContact((v) => !v)}
          style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", background: "none", border: "none", cursor: "pointer" }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#eaf2f8", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#1565a0" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0zM12 14a7 7 0 0 0-7 7h14a7 7 0 0 0-7-7z" />
              </svg>
            </div>
            <span style={{ fontSize: 14, fontWeight: 700, color: "#0c2d48" }}>Add a contact</span>
            <span style={{ fontSize: 12, color: "#94a3b8" }}>optional</span>
          </div>
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#94a3b8" strokeWidth={2.5} style={{ transform: showContact ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {showContact && (
          <div style={{ padding: "0 16px 16px", display: "flex", flexDirection: "column", gap: 10, borderTop: "1px solid #f1f5f9" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 14 }}>
              <input placeholder="First name" value={contact.firstname} onChange={(e) => setContact((c) => ({ ...c, firstname: e.target.value }))} disabled={state === "submitting"} style={fieldStyle} />
              <input placeholder="Last name" value={contact.lastname} onChange={(e) => setContact((c) => ({ ...c, lastname: e.target.value }))} disabled={state === "submitting"} style={fieldStyle} />
            </div>
            <input placeholder="Job title" value={contact.jobtitle} onChange={(e) => setContact((c) => ({ ...c, jobtitle: e.target.value }))} disabled={state === "submitting"} style={fieldStyle} />
            <input placeholder="Email" type="email" value={contact.email} onChange={(e) => setContact((c) => ({ ...c, email: e.target.value }))} disabled={state === "submitting"} style={fieldStyle} />
          </div>
        )}
      </div>

      {/* Company section */}
      <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #dce4ec", overflow: "hidden" }}>
        <button
          type="button"
          onClick={() => setShowCompany((v) => !v)}
          style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", background: "none", border: "none", cursor: "pointer" }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#f0f9ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#0369a1" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v16m14 0H5m14 0h2M5 21H3M9 7h1m-1 4h1m4-4h1m-1 4h1M9 21v-4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4" />
              </svg>
            </div>
            <span style={{ fontSize: 14, fontWeight: 700, color: "#0c2d48" }}>Add a company</span>
            <span style={{ fontSize: 12, color: "#94a3b8" }}>optional</span>
          </div>
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#94a3b8" strokeWidth={2.5} style={{ transform: showCompany ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {showCompany && (
          <div style={{ padding: "0 16px 16px", display: "flex", flexDirection: "column", gap: 10, borderTop: "1px solid #f1f5f9" }}>
            <input placeholder="Company name *" value={company.name} onChange={(e) => setCompany((c) => ({ ...c, name: e.target.value }))} disabled={state === "submitting"} style={{ ...fieldStyle, marginTop: 14 }} />
            <input placeholder="Website (e.g. riverside-medical.com)" value={company.domain} onChange={(e) => setCompany((c) => ({ ...c, domain: e.target.value }))} disabled={state === "submitting"} style={fieldStyle} />
          </div>
        )}
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
