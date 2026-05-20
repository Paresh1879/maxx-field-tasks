import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import Anthropic from "@anthropic-ai/sdk";

const SYSTEM_PROMPT = `You are a medical provider search assistant. Given a user's search query, extract search parameters for the NPPES NPI registry. Return ONLY a raw JSON object with: last_name (string), first_name (optional string), city (optional string), state (optional 2-letter string), number (optional 10-digit NPI string), organization_name (optional string for org searches). Only include fields that are clearly specified.`;

export async function POST(request: Request) {
  const session = await getSession();
  if (!session?.accessToken) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { text } = await request.json();
  if (!text) return NextResponse.json({ error: "Missing text" }, { status: 400 });

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY not configured" }, { status: 500 });
  }

  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const msg = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 300,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: text }],
    });
    const raw = msg.content[0].type === "text" ? msg.content[0].text.trim() : "{}";
    const cleaned = raw.replace(/```json|```/g, "").trim();
    return NextResponse.json(JSON.parse(cleaned));
  } catch (err) {
    return NextResponse.json({ error: "Parse failed" }, { status: 500 });
  }
}
