"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

export default function EditNotePage() {
  const router = useRouter();
  const params = useParams<{ id: string; noteId: string }>();
  const { id: dealId, noteId } = params;

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
      router.push("/deals");
    } catch {
      setError("Couldn't update the note. Try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      <div className="bg-white border-b border-[#ebebeb]">
        <div className="max-w-lg mx-auto px-4 py-4">
          <Link href="/deals" className="flex items-center gap-1 text-[13px] text-[#666666] active:text-[#111111] transition mb-4">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            My Deals
          </Link>
          <h1 className="text-[18px] font-semibold text-[#111111]">Edit Note</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-5 pb-12">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-5 h-5 rounded-full border-2 border-[#ebebeb] border-t-[#F97316] animate-spin" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div className="bg-white rounded-xl border border-[#ebebeb] px-4 py-3">
              <textarea
                className="w-full text-[15px] text-[#111111] placeholder-[#999999] resize-none focus:outline-none bg-transparent"
                rows={8}
                value={body}
                disabled={saving}
                onChange={(e) => setBody(e.target.value)}
              />
            </div>

            {error && (
              <div className="px-4 py-3 bg-red-50 border border-red-100 rounded-xl">
                <p className="text-[13px] text-red-600">{error}</p>
              </div>
            )}

            <button type="submit" disabled={!body.trim() || saving}
              className="w-full py-4 rounded-xl bg-[#F97316] text-white font-semibold text-[15px] disabled:opacity-40 active:opacity-80 transition flex items-center justify-center gap-2">
              {saving ? <><span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />Saving…</> : "Save changes"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
