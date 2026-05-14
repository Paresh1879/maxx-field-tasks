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
  const [fields, setFields] = useState<TaskFields>({
    title: "",
    due_date: "",
    priority: "",
    owner_id: currentOwnerId,
  });
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
      setFields((f) => ({
        title: data.title ?? "",
        due_date: data.due_date ?? "",
        priority: data.priority ?? "",
        owner_id: data.owner_id ?? f.owner_id,
      }));
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

  const inputClass =
    "w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:bg-white transition disabled:opacity-50";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">

      {/* Note textarea */}
      <div className="flex flex-col gap-3">
        <VoiceRecorder
          disabled={submitting || suggesting}
          onTranscript={(t) => setNote((prev) => prev ? `${prev} ${t}` : t)}
        />
        <textarea
          className="w-full rounded-2xl border border-gray-200 bg-white p-4 text-base text-gray-900 placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none transition disabled:opacity-50"
          rows={5}
          placeholder={`What happened with ${dealName}?`}
          value={note}
          disabled={submitting}
          onChange={(e) => setNote(e.target.value)}
        />
        <button
          type="button"
          onClick={handleSuggest}
          disabled={!note.trim() || suggesting || submitting}
          className="w-full rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-500 py-3.5 text-white font-semibold text-base shadow-md disabled:opacity-40 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          {suggesting ? (
            <>
              <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
              Thinking…
            </>
          ) : (
            <>✦ Suggest task</>
          )}
        </button>
      </div>

      {/* Fields card */}
      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
        {suggested && (
          <div className="bg-indigo-50 border-b border-indigo-100 px-4 py-2 flex items-center gap-2">
            <span className="text-indigo-400 text-xs">✦</span>
            <span className="text-xs font-medium text-indigo-600">
              Review and edit before saving
            </span>
          </div>
        )}
        <div className="p-4 flex flex-col gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1.5">
              Task title
            </label>
            <input
              type="text"
              className={inputClass}
              placeholder="e.g. Send follow-up quote"
              value={fields.title}
              disabled={submitting}
              onChange={(e) => setFields((f) => ({ ...f, title: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1.5">
              Due date
            </label>
            <input
              type="date"
              className={inputClass}
              value={fields.due_date}
              disabled={submitting}
              onChange={(e) => setFields((f) => ({ ...f, due_date: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1.5">
              Priority
            </label>
            <select
              className={inputClass}
              value={fields.priority}
              disabled={submitting}
              onChange={(e) =>
                setFields((f) => ({ ...f, priority: e.target.value as Priority | "" }))
              }
            >
              <option value="">Select…</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>
          </div>

          {owners.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1.5">
                Owner
              </label>
              <select
                className={inputClass}
                value={fields.owner_id}
                disabled={submitting}
                onChange={(e) => setFields((f) => ({ ...f, owner_id: e.target.value }))}
              >
                <option value="">Unassigned</option>
                {owners.map((o) => (
                  <option key={o.id} value={o.id}>{o.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={!fields.title.trim() || submitting || suggesting}
        className="w-full rounded-2xl bg-gray-900 py-4 text-white font-semibold text-base shadow-md disabled:opacity-30 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
      >
        {submitting ? (
          <>
            <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
            Saving…
          </>
        ) : (
          "Save task to HubSpot"
        )}
      </button>
    </form>
  );
}
