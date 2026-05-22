"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import Link from "next/link";

export default function EditNotePage() {
  const router = useRouter();
  const params = useParams<{ id: string; noteId: string }>();
  const searchParams = useSearchParams();
  const { id: dealId, noteId } = params;
  const from = searchParams.get("from");
  const backHref = from === "all" ? "/deals/all" : from === "deal" ? `/deals/${dealId}/new` : "/deals/list";
  const backLabel = from === "all" ? "All Deals" : from === "deal" ? "Back to Deal" : "My Deals";

  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/notes/${noteId}`)
      .then((r) => r.json())
      .then((data) => { setBody(data.body ?? ""); setLoading(false); })
      .catch(() => { setError("Could not load note."); setLoading(false); });
  }, [noteId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/notes/${noteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      if (res.status === 401) { router.push("/login"); return; }
      if (!res.ok) throw new Error("Failed to update note");
      router.push(backHref);
    } catch {
      setError("Couldn't update the note. Try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen" style={{ background: "#f4f8fb" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Gradient header */}
      <div style={{ background: "linear-gradient(150deg, #0c2d48 0%, #1565a0 60%, #2e86c1 100%)" }}>
        <div className="max-w-lg mx-auto px-4 py-4">
          <Link
            href={backHref}
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
            {backLabel}
          </Link>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: "#fff", letterSpacing: -0.3 }}>Edit Note</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-5 pb-12">
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "48px 0" }}>
            <div style={{ width: 20, height: 20, borderRadius: "50%", border: "2.5px solid #d1d5db", borderTopColor: "#1565a0", animation: "spin 0.7s linear infinite" }} />
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #dce4ec", padding: "16px" }}>
              <textarea
                style={{ width: "100%", fontSize: 15, color: "#0c2d48", resize: "none", outline: "none", background: "transparent", border: "none", opacity: saving ? 0.5 : 1, boxSizing: "border-box" }}
                rows={8}
                value={body}
                disabled={saving}
                onChange={(e) => setBody(e.target.value)}
              />
            </div>

            {error && (
              <div style={{ padding: "12px 16px", background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 12 }}>
                <p style={{ fontSize: 13, color: "#dc2626" }}>{error}</p>
              </div>
            )}

            <button
              type="submit" disabled={!body.trim() || saving}
              style={{
                width: "100%", padding: "16px 0", borderRadius: 12,
                background: "#1565a0", color: "#fff", fontWeight: 700, fontSize: 15,
                border: "none", cursor: "pointer", display: "flex", alignItems: "center",
                justifyContent: "center", gap: 8, transition: "opacity 0.15s",
                opacity: (!body.trim() || saving) ? 0.4 : 1,
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
