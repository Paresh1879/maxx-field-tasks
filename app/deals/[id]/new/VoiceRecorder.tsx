"use client";

import { useRef, useState } from "react";

type RecorderState = "idle" | "recording" | "processing";

export default function VoiceRecorder({
  onTranscript,
  disabled,
}: {
  onTranscript: (transcript: string) => void;
  disabled?: boolean;
}) {
  const [state, setState] = useState<RecorderState>("idle");
  const [error, setError] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  async function startRecording() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4";
      const recorder = new MediaRecorder(stream, { mimeType });
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        setState("processing");
        try {
          const blob = new Blob(chunksRef.current, { type: mimeType });
          const res = await fetch("/api/transcribe", {
            method: "POST",
            body: blob,
            headers: { "Content-Type": mimeType },
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
          if (data.transcript) onTranscript(data.transcript);
          else setError("No speech detected. Try again.");
        } catch (err) {
          setError(err instanceof Error ? err.message : "Transcription failed.");
        } finally {
          setState("idle");
        }
      };

      recorder.start();
      recorderRef.current = recorder;
      setState("recording");
    } catch {
      setError("Microphone access denied.");
    }
  }

  function stopRecording() {
    recorderRef.current?.stop();
    recorderRef.current = null;
  }

  return (
    <div className="flex flex-col gap-1">
      {state === "idle" && (
        <button
          type="button"
          onClick={startRecording}
          disabled={disabled}
          className="w-full rounded-2xl border border-indigo-200 bg-indigo-50 py-3 text-indigo-600 font-semibold text-sm flex items-center justify-center gap-2 active:bg-indigo-100 transition disabled:opacity-40"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4m-4 0h8" />
          </svg>
          Record note
        </button>
      )}

      {state === "recording" && (
        <button
          type="button"
          onClick={stopRecording}
          className="w-full rounded-2xl border border-red-200 bg-red-50 py-3 text-red-600 font-semibold text-sm flex items-center justify-center gap-2 active:bg-red-100 transition"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
          Recording — tap to stop
        </button>
      )}

      {state === "processing" && (
        <div className="w-full rounded-2xl border border-gray-100 bg-gray-50 py-3 text-gray-400 text-sm flex items-center justify-center gap-2">
          <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v8H4z" />
          </svg>
          Transcribing…
        </div>
      )}

      {error && <p className="text-xs text-red-400 text-center">{error}</p>}
    </div>
  );
}
