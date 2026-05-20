"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import VoiceRecorder from "../new/VoiceRecorder";

type State = "idle" | "submitting" | "done";

export default function NoteForm({ dealId, dealName }: { dealId: string; dealName: string }) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [state, setState] = useState<State>("idle");
  const [error, setError] = useState<string | null>(null);
  const [dealUrl, setDealUrl] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setState("submitting");
    setError(null);
    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body, dealId }),
      });
      if (res.status === 401) { router.push("/login"); return; }
      if (!res.ok) throw new Error("Save failed");
      const data = await res.json();
      setDealUrl(data.dealUrl ?? null);
      setState("done");
    } catch {
      setError("Couldn't save the note. Check your connection and try again.");
      setState("idle");
    }
  }

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
        <p style={{ fontSize: 18, fontWeight: 700, color: "#0c2d48", marginBottom: 4 }}>Note saved</p>
        <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 24 }}>Added to {dealName} in HubSpot.</p>
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
            onClick={() => { setBody(""); setDealUrl(null); setState("idle"); setError(null); }}
            style={{
              width: "100%", padding: "14px 0", borderRadius: 12,
              border: "1px solid #dce4ec", background: "#fff",
              color: "#0c2d48", fontWeight: 600, fontSize: 15, cursor: "pointer",
            }}
          >
            Add another note
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

      <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #dce4ec", padding: "16px" }}>
        <textarea
          style={{ width: "100%", fontSize: 15, color: "#0c2d48", resize: "none", outline: "none", background: "transparent", border: "none", opacity: state === "submitting" ? 0.5 : 1, boxSizing: "border-box" }}
          rows={7}
          placeholder={`Notes about ${dealName}…`}
          value={body}
          disabled={state === "submitting"}
          onChange={(e) => setBody(e.target.value)}
        />
        <div style={{ paddingTop: 12, borderTop: "1px solid #dce4ec", marginTop: 4 }}>
          <VoiceRecorder
            disabled={state === "submitting"}
            onTranscript={(t) => setBody((prev) => prev ? `${prev} ${t}` : t)}
          />
        </div>
      </div>

      {error && (
        <div style={{ padding: "12px 16px", background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 12 }}>
          <p style={{ fontSize: 13, color: "#dc2626" }}>{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={!body.trim() || state === "submitting"}
        style={{
          width: "100%", padding: "16px 0", borderRadius: 12,
          background: "#1565a0", color: "#fff", fontWeight: 700, fontSize: 15,
          border: "none", cursor: "pointer", display: "flex", alignItems: "center",
          justifyContent: "center", gap: 8, transition: "opacity 0.15s",
          opacity: (!body.trim() || state === "submitting") ? 0.4 : 1,
        }}
      >
        {state === "submitting" ? (
          <>
            <span style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "#fff", display: "inline-block", animation: "spin 0.7s linear infinite" }} />
            Saving…
          </>
        ) : (
          "Save note to HubSpot"
        )}
      </button>
    </form>
  );
}
