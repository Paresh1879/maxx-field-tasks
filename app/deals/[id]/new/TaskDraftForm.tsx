"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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
}: {
  dealId: string;
  dealName: string;
}) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [fields, setFields] = useState<TaskFields>({
    title: "",
    due_date: "",
    priority: "",
    owner_id: "",
  });
  const [suggesting, setSuggesting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSuggest() {
    if (!note.trim()) return;
    setSuggesting(true);
    setError(null);
    try {
      const res = await fetch("/api/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note, dealId }),
      });
      if (!res.ok) throw new Error("Suggestion failed");
      const data = await res.json();
      setFields({
        title: data.title ?? "",
        due_date: data.due_date ?? "",
        priority: data.priority ?? "",
        owner_id: data.owner_id ?? "",
      });
    } catch {
      setError("Couldn't generate suggestion. Try again.");
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
      if (!res.ok) throw new Error("Task creation failed");
      const data = await res.json();
      router.push(`/deals/${dealId}/done?taskId=${data.taskId}`);
    } catch {
      setError("Couldn't save the task. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          What happened?
        </label>
        <textarea
          className="w-full rounded-xl border border-gray-300 p-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          rows={4}
          placeholder={`Summarise your visit with ${dealName}…`}
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        <button
          type="button"
          onClick={handleSuggest}
          disabled={!note.trim() || suggesting}
          className="mt-2 w-full rounded-xl bg-blue-600 py-3 text-white font-semibold text-base disabled:opacity-40 active:bg-blue-700"
        >
          {suggesting ? "Thinking…" : "✦ Suggest task"}
        </button>
      </div>

      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 flex flex-col gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">
            Task title
          </label>
          <input
            type="text"
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g. Send follow-up quote"
            value={fields.title}
            onChange={(e) => setFields((f) => ({ ...f, title: e.target.value }))}
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">
            Due date
          </label>
          <input
            type="date"
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={fields.due_date}
            onChange={(e) => setFields((f) => ({ ...f, due_date: e.target.value }))}
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">
            Priority
          </label>
          <select
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={fields.priority}
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
      </div>

      {error && (
        <p className="text-sm text-red-600 text-center">{error}</p>
      )}

      <button
        type="submit"
        disabled={!fields.title.trim() || submitting}
        className="w-full rounded-xl bg-green-600 py-3 text-white font-semibold text-base disabled:opacity-40 active:bg-green-700"
      >
        {submitting ? "Saving…" : "Save task to HubSpot"}
      </button>
    </form>
  );
}
