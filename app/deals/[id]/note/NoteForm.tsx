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
      <div className="bg-white rounded-xl border border-[#ebebeb] px-6 py-10 text-center">
        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
          <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="text-[17px] font-semibold text-[#111111] mb-1">Note saved</p>
        <p className="text-[13px] text-[#999999] mb-6">Added to {dealName} in HubSpot.</p>
        <div className="flex flex-col gap-2.5">
          {dealUrl && (
            <a
              href={dealUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3.5 rounded-xl bg-[#F97316] text-white font-semibold text-[15px] text-center active:opacity-80 transition"
            >
              View in HubSpot
            </a>
          )}
          <button
            onClick={() => { setBody(""); setDealUrl(null); setState("idle"); setError(null); }}
            className="w-full py-3.5 rounded-xl border border-[#ebebeb] text-[#111111] font-medium text-[15px] active:bg-[#FAFAF8] transition"
          >
            Add another note
          </button>
          <button
            onClick={() => router.push("/deals")}
            className="text-[13px] text-[#999999] py-2 active:text-[#666666] transition"
          >
            Back to My Deals
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="bg-white rounded-xl border border-[#ebebeb] px-4 py-3">
        <textarea
          className="w-full text-[15px] text-[#111111] placeholder-[#999999] resize-none focus:outline-none disabled:opacity-50 bg-transparent"
          rows={7}
          placeholder={`Notes about ${dealName}…`}
          value={body}
          disabled={state === "submitting"}
          onChange={(e) => setBody(e.target.value)}
        />
        <div className="pt-2 border-t border-[#f0f0f0]">
          <VoiceRecorder
            disabled={state === "submitting"}
            onTranscript={(t) => setBody((prev) => prev ? `${prev} ${t}` : t)}
          />
        </div>
      </div>

      {error && (
        <div className="px-4 py-3 bg-red-50 border border-red-100 rounded-xl">
          <p className="text-[13px] text-red-600">{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={!body.trim() || state === "submitting"}
        className="w-full py-4 rounded-xl bg-[#F97316] text-white font-semibold text-[15px] disabled:opacity-40 active:opacity-80 transition flex items-center justify-center gap-2"
      >
        {state === "submitting" ? (
          <>
            <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
            Saving…
          </>
        ) : (
          "Save note to HubSpot"
        )}
      </button>
    </form>
  );
}
