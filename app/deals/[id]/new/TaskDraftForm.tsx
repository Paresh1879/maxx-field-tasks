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

  const fieldClass = "w-full bg-white border border-[#ebebeb] rounded-xl px-3.5 py-3 text-[15px] text-[#111111] placeholder-[#999999] focus:outline-none focus:border-[#F97316] transition disabled:opacity-50";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">

      {/* Note */}
      <div className="bg-white rounded-xl border border-[#ebebeb] px-4 py-3">
        <textarea
          className="w-full text-[15px] text-[#111111] placeholder-[#999999] resize-none focus:outline-none disabled:opacity-50 bg-transparent"
          rows={5}
          placeholder={`What happened with ${dealName}?`}
          value={note}
          disabled={submitting}
          onChange={(e) => setNote(e.target.value)}
        />
        <div className="flex items-center justify-between pt-2 border-t border-[#f0f0f0]">
          <VoiceRecorder
            disabled={submitting || suggesting}
            onTranscript={(t) => setNote((prev) => prev ? `${prev} ${t}` : t)}
          />
          <button
            type="button"
            onClick={handleSuggest}
            disabled={!note.trim() || suggesting || submitting}
            className="flex items-center gap-1.5 text-[13px] font-semibold text-[#111111] disabled:opacity-30 active:opacity-60 transition"
          >
            {suggesting ? (
              <>
                <span className="w-3.5 h-3.5 rounded-full border-2 border-[#ebebeb] border-t-[#111] animate-spin" />
                Thinking…
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2l2.09 6.26L20 10l-5.91 1.74L12 18l-2.09-6.26L4 10l5.91-1.74L12 2z" />
                </svg>
                Draft Task
              </>
            )}
          </button>
        </div>
      </div>

      {/* Task fields */}
      <div className="bg-white rounded-xl border border-[#ebebeb] overflow-hidden">
        {suggested && (
          <div className="px-4 py-2.5 bg-[#FAFAF8] border-b border-[#ebebeb]">
            <p className="text-[12px] text-[#666666]">AI suggestion — review before saving</p>
          </div>
        )}

        <div className="p-4 flex flex-col gap-4">
          <div>
            <label className="block text-[11px] font-semibold text-[#999999] uppercase tracking-wider mb-1.5">Task title</label>
            <input
              type="text"
              className={fieldClass}
              placeholder="e.g. Send follow-up quote"
              value={fields.title}
              disabled={submitting}
              onChange={(e) => setFields((f) => ({ ...f, title: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[#999999] uppercase tracking-wider mb-1.5">Due date</label>
            <input
              type="date"
              className={fieldClass}
              value={fields.due_date}
              disabled={submitting}
              onChange={(e) => setFields((f) => ({ ...f, due_date: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[#999999] uppercase tracking-wider mb-1.5">Priority</label>
            <div className="flex gap-2">
              {(["LOW", "MEDIUM", "HIGH"] as Priority[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  disabled={submitting}
                  onClick={() => setFields((f) => ({ ...f, priority: p }))}
                  className={`flex-1 py-2.5 rounded-xl text-[13px] font-semibold border transition disabled:opacity-40 ${
                    fields.priority === p
                      ? "bg-[#111111] text-white border-[#111111]"
                      : "bg-white text-[#666666] border-[#ebebeb] active:bg-[#FAFAF8]"
                  }`}
                >
                  {p.charAt(0) + p.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>

          {owners.length > 0 && (
            <div>
              <label className="block text-[11px] font-semibold text-[#999999] uppercase tracking-wider mb-1.5">Owner</label>
              <select
                className={fieldClass}
                value={fields.owner_id}
                disabled={submitting}
                onChange={(e) => setFields((f) => ({ ...f, owner_id: e.target.value }))}
              >
                <option value="">Unassigned</option>
                {owners.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="px-4 py-3 bg-red-50 border border-red-100 rounded-xl">
          <p className="text-[13px] text-red-600">{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={!fields.title.trim() || submitting || suggesting}
        className="w-full py-4 rounded-xl bg-[#F97316] text-white font-semibold text-[15px] disabled:opacity-40 active:opacity-80 transition flex items-center justify-center gap-2"
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
