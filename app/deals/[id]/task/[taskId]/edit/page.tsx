"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

type Priority = "LOW" | "MEDIUM" | "HIGH";

export default function EditTaskPage() {
  const router = useRouter();
  const params = useParams<{ id: string; taskId: string }>();
  const { taskId } = params;

  const [fields, setFields] = useState({ title: "", due_date: "", priority: "" as Priority | "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/tasks/${taskId}`)
      .then((r) => r.json())
      .then((data) => {
        setFields({ title: data.title ?? "", due_date: data.due_date ?? "", priority: data.priority ?? "" });
        setLoading(false);
      })
      .catch(() => { setError("Could not load task."); setLoading(false); });
  }, [taskId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!fields.title.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      });
      if (res.status === 401) { router.push("/login"); return; }
      if (!res.ok) throw new Error("Failed to update task");
      router.push("/deals/list");
    } catch {
      setError("Couldn't update the task. Try again.");
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
    <div className="min-h-screen" style={{ background: "#f4f8fb" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

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
          <h1 style={{ fontSize: 20, fontWeight: 800, color: "#fff", letterSpacing: -0.3 }}>Edit Task</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-5 pb-12">
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "48px 0" }}>
            <div style={{ width: 20, height: 20, borderRadius: "50%", border: "2.5px solid #d1d5db", borderTopColor: "#1565a0", animation: "spin 0.7s linear infinite" }} />
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #dce4ec", overflow: "hidden" }}>
              <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>Task title</label>
                  <input
                    type="text" style={fieldStyle} value={fields.title} disabled={saving}
                    onChange={(e) => setFields((f) => ({ ...f, title: e.target.value }))}
                    onFocus={(e) => { e.currentTarget.style.borderColor = "#1565a0"; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = "#dce4ec"; }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>Due date</label>
                  <input
                    type="date" style={fieldStyle} value={fields.due_date} disabled={saving}
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
                        key={p} type="button" disabled={saving}
                        onClick={() => setFields((f) => ({ ...f, priority: p }))}
                        style={{
                          flex: 1, padding: "10px 0", borderRadius: 12, fontSize: 13, fontWeight: 700,
                          border: "1px solid", cursor: "pointer", transition: "all 0.15s",
                          opacity: saving ? 0.4 : 1,
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
              </div>
            </div>

            {error && (
              <div style={{ padding: "12px 16px", background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 12 }}>
                <p style={{ fontSize: 13, color: "#dc2626" }}>{error}</p>
              </div>
            )}

            <button
              type="submit" disabled={!fields.title.trim() || saving}
              style={{
                width: "100%", padding: "16px 0", borderRadius: 12,
                background: "#1565a0", color: "#fff", fontWeight: 700, fontSize: 15,
                border: "none", cursor: "pointer", display: "flex", alignItems: "center",
                justifyContent: "center", gap: 8, transition: "opacity 0.15s",
                opacity: (!fields.title.trim() || saving) ? 0.4 : 1,
              }}
            >
              {saving
                ? <><span style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "#fff", display: "inline-block", animation: "spin 0.7s linear infinite" }} />Saving…</>
                : "Save changes"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
