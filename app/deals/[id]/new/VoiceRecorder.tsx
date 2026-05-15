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
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        setState("processing");
        try {
          const blob = new Blob(chunksRef.current, { type: mimeType });
          const res = await fetch("/api/transcribe", { method: "POST", body: blob, headers: { "Content-Type": mimeType } });
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
    <div>
      {state === "idle" && (
        <button
          type="button"
          onClick={startRecording}
          disabled={disabled}
          className="flex items-center gap-1.5 text-[13px] text-[#666666] font-medium py-2 disabled:opacity-40 active:text-[#111111] transition"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4m-4 0h8" />
          </svg>
          Record instead
        </button>
      )}

      {state === "recording" && (
        <button
          type="button"
          onClick={stopRecording}
          className="flex items-center gap-1.5 text-[13px] text-red-600 font-medium py-2 active:opacity-70 transition"
        >
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          Recording — tap to stop
        </button>
      )}

      {state === "processing" && (
        <div className="flex items-center gap-1.5 text-[13px] text-[#999999] py-2">
          <div className="w-3.5 h-3.5 rounded-full border-2 border-[#ebebeb] border-t-[#999] animate-spin" />
          Transcribing…
        </div>
      )}

      {error && <p className="text-[12px] text-red-600 mt-1">{error}</p>}
    </div>
  );
}
