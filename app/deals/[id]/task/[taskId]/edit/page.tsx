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
      router.push("/deals");
    } catch {
      setError("Couldn't update the task. Try again.");
    } finally {
      setSaving(false);
    }
  }

  const fieldClass = "w-full bg-white border border-[#ebebeb] rounded-xl px-3.5 py-3 text-[15px] text-[#111111] placeholder-[#999999] focus:outline-none focus:border-[#F97316] transition disabled:opacity-50";

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
          <h1 className="text-[18px] font-semibold text-[#111111]">Edit Task</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-5 pb-12">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-5 h-5 rounded-full border-2 border-[#ebebeb] border-t-[#2563EB] animate-spin" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div className="bg-white rounded-xl border border-[#ebebeb] overflow-hidden">
              <div className="p-4 flex flex-col gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-[#999999] uppercase tracking-wider mb-1.5">Task title</label>
                  <input type="text" className={fieldClass} value={fields.title} disabled={saving}
                    onChange={(e) => setFields((f) => ({ ...f, title: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#999999] uppercase tracking-wider mb-1.5">Due date</label>
                  <input type="date" className={fieldClass} value={fields.due_date} disabled={saving}
                    onChange={(e) => setFields((f) => ({ ...f, due_date: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#999999] uppercase tracking-wider mb-1.5">Priority</label>
                  <div className="flex gap-2">
                    {(["LOW", "MEDIUM", "HIGH"] as Priority[]).map((p) => (
                      <button key={p} type="button" disabled={saving}
                        onClick={() => setFields((f) => ({ ...f, priority: p }))}
                        className={`flex-1 py-2.5 rounded-xl text-[13px] font-semibold border transition disabled:opacity-40 ${
                          fields.priority === p
                            ? "bg-[#111111] text-white border-[#111111]"
                            : "bg-white text-[#666666] border-[#ebebeb] active:bg-[#FAFAF8]"
                        }`}>
                        {p.charAt(0) + p.slice(1).toLowerCase()}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {error && (
              <div className="px-4 py-3 bg-red-50 border border-red-100 rounded-xl">
                <p className="text-[13px] text-red-600">{error}</p>
              </div>
            )}

            <button type="submit" disabled={!fields.title.trim() || saving}
              className="w-full py-4 rounded-xl bg-[#2563EB] text-white font-semibold text-[15px] disabled:opacity-40 active:opacity-80 transition flex items-center justify-center gap-2">
              {saving
                ? <><span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />Saving…</>
                : "Save changes"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
