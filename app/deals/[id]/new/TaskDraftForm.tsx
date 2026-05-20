"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Owner } from "./page";
import VoiceRecorder from "./VoiceRecorder";

type Priority = "LOW" | "MEDIUM" | "HIGH";

type TaskFields = {
  title: string;
  due_date: string;
  priority: Priority | "";
  owner_id: string;
};

export default function TaskDraftForm({
  dealId,
  dealName,
  owners,
  currentOwnerId,
}: {
  dealId: string;
  dealName: string;
  owners: Owner[];
  currentOwnerId: string;
}) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [fields, setFields] = useState<TaskFields>({ title: "", due_date: "", priority: "", owner_id: currentOwnerId });
  const [suggesting, setSuggesting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [suggested, setSuggested] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSuggest() {
    if (!note.trim()) return;
    setSuggesting(true);
    setSuggested(false);
    setError(null);
    try {
      const res = await fetch("/api/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note, dealId }),
      });
      if (res.status === 401) { router.push("/login"); return; }
      if (!res.ok) throw new Error("Suggestion failed");
      const data = await res.json();
      setFields((f) => ({ title: data.title ?? "", due_date: data.due_date ?? "", priority: data.priority ?? "", owner_id: data.owner_id ?? f.owner_id }));
      setSuggested(true);
    } catch {
      setError("Couldn't generate suggestion. Check your connection and try again.");
    } finally {
      setSuggesting(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!fields.title.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...fields, dealId }),
      });
      if (res.status === 401) { router.push("/login"); return; }
      if (!res.ok) throw new Error("Task creation failed");
      const data = await res.json();
      router.push(`/deals/${dealId}/done?taskId=${data.taskId}&taskUrl=${encodeURIComponent(data.taskUrl)}`);
      return;
    } catch {
      setError("Couldn't save the task. Check your connection and try again.");
    }
    setSubmitting(false);
  }

  const fieldStyle: React.CSSProperties = {
    width: "100%", background: "#fff", border: "1px solid #dce4ec", borderRadius: 12,
    padding: "12px 14px", fontSize: 15, color: "#0c2d48", outline: "none",
    boxSizing: "border-box", transition: "border-color 0.15s",
    opacity: submitting ? 0.5 : 1,
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Note */}
      <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #dce4ec", padding: "16px" }}>
        <textarea
          style={{ width: "100%", fontSize: 15, color: "#0c2d48", resize: "none", outline: "none", background: "transparent", border: "none", opacity: submitting ? 0.5 : 1, boxSizing: "border-box" }}
          rows={5}
          placeholder={`What happened with ${dealName}?`}
          value={note}
          disabled={submitting}
          onChange={(e) => setNote(e.target.value)}
        />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 12, borderTop: "1px solid #dce4ec", marginTop: 4 }}>
          <VoiceRecorder
            disabled={submitting || suggesting}
            onTranscript={(t) => setNote((prev) => prev ? `${prev} ${t}` : t)}
          />
          <button
            type="button"
            onClick={handleSuggest}
            disabled={!note.trim() || suggesting || submitting}
            style={{
              display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 700,
              color: "#0c2d48", background: "none", border: "none", cursor: "pointer",
              opacity: (!note.trim() || suggesting || submitting) ? 0.3 : 1, transition: "opacity 0.15s",
            }}
          >
            {suggesting ? (
              <>
                <span style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid #dce4ec", borderTopColor: "#0c2d48", display: "inline-block", animation: "spin 0.7s linear infinite" }} />
                Thinking…
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2l2.09 6.26L20 10l-5.91 1.74L12 18l-2.09-6.26L4 10l5.91-1.74L12 2z" />
                </svg>
                Draft Task
              </>
            )}
          </button>
        </div>
      </div>

      {/* Task fields */}
      <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #dce4ec", overflow: "hidden" }}>
        {suggested && (
          <div style={{ padding: "10px 16px", background: "#eaf2f8", borderBottom: "1px solid #dce4ec" }}>
            <p style={{ fontSize: 12, color: "#374151" }}>AI suggestion — review before saving</p>
          </div>
        )}

        <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>Task title</label>
            <input
              type="text"
              style={fieldStyle}
              placeholder="e.g. Send follow-up quote"
              value={fields.title}
              disabled={submitting}
              onChange={(e) => setFields((f) => ({ ...f, title: e.target.value }))}
              onFocus={(e) => { e.currentTarget.style.borderColor = "#1565a0"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "#dce4ec"; }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>Due date</label>
            <input
              type="date"
              style={fieldStyle}
              value={fields.due_date}
              disabled={submitting}
              onChange={(e) => setFields((f) => ({ ...f, due_date: e.target.value }))}
              onFocus={(e) => { e.currentTarget.style.borderColor = "#1565a0"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "#dce4ec"; }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>Priority</label>
            <div style={{ display: "flex", gap: 8 }}>
              {(["LOW", "MEDIUM", "HIGH"] as Priority[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  disabled={submitting}
                  onClick={() => setFields((f) => ({ ...f, priority: p }))}
                  style={{
                    flex: 1, padding: "10px 0", borderRadius: 12, fontSize: 13, fontWeight: 700,
                    border: "1px solid", cursor: "pointer", transition: "all 0.15s",
                    opacity: submitting ? 0.4 : 1,
                    background: fields.priority === p ? "#1565a0" : "#fff",
                    color: fields.priority === p ? "#fff" : "#374151",
                    borderColor: fields.priority === p ? "#1565a0" : "#dce4ec",
                  }}
                >
                  {p.charAt(0) + p.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>

          {owners.length > 0 && (
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>Owner</label>
              <select
                style={fieldStyle}
                value={fields.owner_id}
                disabled={submitting}
                onChange={(e) => setFields((f) => ({ ...f, owner_id: e.target.value }))}
                onFocus={(e) => { e.currentTarget.style.borderColor = "#1565a0"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "#dce4ec"; }}
              >
                <option value="">Unassigned</option>
                {owners.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
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
        disabled={!fields.title.trim() || submitting || suggesting}
        style={{
          width: "100%", padding: "16px 0", borderRadius: 12,
          background: "#1565a0", color: "#fff", fontWeight: 700, fontSize: 15,
          border: "none", cursor: "pointer", display: "flex", alignItems: "center",
          justifyContent: "center", gap: 8, transition: "opacity 0.15s",
          opacity: (!fields.title.trim() || submitting || suggesting) ? 0.4 : 1,
        }}
      >
        {submitting ? (
          <>
            <span style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "#fff", display: "inline-block", animation: "spin 0.7s linear infinite" }} />
            Saving…
          </>
        ) : (
          "Save task to HubSpot"
        )}
      </button>
    </form>
  );
}
