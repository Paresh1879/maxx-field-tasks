import { refreshSessionIfNeeded } from "@/lib/hubspot";

export async function POST(request: Request) {
  const authed = await refreshSessionIfNeeded();
  if (!authed) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  if (!process.env.DEEPGRAM_API_KEY) {
    return Response.json({ error: "DEEPGRAM_API_KEY is not configured" }, { status: 500 });
  }

  const audio = await request.blob();
  if (!audio.size) {
    return Response.json({ error: "No audio received" }, { status: 400 });
  }

  const res = await fetch(
    "https://api.deepgram.com/v1/listen?model=nova-2&smart_format=true",
    {
      method: "POST",
      headers: {
        Authorization: `Token ${process.env.DEEPGRAM_API_KEY}`,
        "Content-Type": audio.type || "audio/webm",
      },
      body: audio,
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.error("Deepgram error:", err);
    return Response.json(
      { error: err?.err_msg || `Deepgram error ${res.status}` },
      { status: 502 }
    );
  }

  const data = await res.json();
  const transcript =
    data.results?.channels?.[0]?.alternatives?.[0]?.transcript ?? "";

  return Response.json({ transcript });
}
