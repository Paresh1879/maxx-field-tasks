import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL || "https://qouiyqupoqrjojqnzicb.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_KEY || "";
const supabase = SUPABASE_KEY ? createClient(SUPABASE_URL, SUPABASE_KEY) : null;

const SYSTEM_PROMPT = `You are a data analyst. You have access to a surgical case volume database table called "surgeon_volumes" with these columns:

- "Doctor" (text): Surgeon's full name, e.g. "Smith, John A"
- "Hospital" (text): Facility name, e.g. "Jefferson Hospital"
- "Facility Type" (text): Either "Hospital" or "ASC" (Ambulatory Surgery Center)
- "Hospital Address" (text): Full address of the facility
- "St Code" (text): 2-letter US state code, e.g. "PA", "NJ", "NY"
- "Surgery" (text): Procedure type. Known values include: "Hip", "Hip Partial", "Hip Revision", "Knee", "Knee Partial", "Knee Revision", "Shoulder", "Shoulder Revision"
- "Qty" (integer): Number of cases

Each row represents a surgeon performing a specific surgery type at a specific facility. A surgeon can have multiple rows.

Given a user's natural language question, return ONLY a raw JSON object (no markdown, no backticks) with:

1. "interpretation" (string): A human-readable sentence describing what you're querying
2. "filters" (object): WHERE conditions. Only include filters the user specified:
   - "surgery" (string or array): Surgery type(s) for ILIKE, e.g. "%Knee%" or ["%Hip%","%Hip Partial%"]
   - "state" (string): 2-letter state code, e.g. "PA"
   - "facility_type" (string): "Hospital" or "ASC"
   - "hospital" (string): Hospital name pattern for ILIKE, e.g. "%Jefferson%"
   - "doctor" (string): Doctor name pattern for ILIKE, e.g. "%Smith%"
3. "group_by" (string): One of: "doctor", "hospital", "state", "surgery", "facility_type", "doctor_detail"
4. "sort" (string): "desc" (default) or "asc"
5. "limit" (number): Number of results (default 10, max 50)

Examples:
- "top 10 knee surgeons in PA" → {"interpretation":"Top 10 surgeons by knee case volume in Pennsylvania","filters":{"surgery":"%Knee%","state":"PA"},"group_by":"doctor","sort":"desc","limit":10}
- "ASC vs Hospital volume for hips" → {"interpretation":"Hip case volume by setting","filters":{"surgery":"%Hip%"},"group_by":"facility_type","sort":"desc","limit":10}`;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyFilters(q: any, filters: Record<string, unknown>) {
  if (filters.surgery) {
    if (Array.isArray(filters.surgery)) {
      // multiple surgery types — OR condition via multiple ilike
      const surgeries = filters.surgery as string[];
      // Supabase doesn't support OR ilike natively in the JS client easily; use the first one for now
      // Better: build OR filter
      q = q.or(surgeries.map((s: string) => `Surgery.ilike.${s}`).join(","));
    } else {
      q = q.ilike("Surgery", filters.surgery as string);
    }
  }
  if (filters.state) q = q.eq("St Code", filters.state as string);
  if (filters.facility_type) q = q.eq("Facility Type", filters.facility_type as string);
  if (filters.hospital) q = q.ilike("Hospital", filters.hospital as string);
  if (filters.doctor) q = q.ilike("Doctor", filters.doctor as string);
  return q;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function aggregateRows(rows: any[], group_by: string, sort: string, limit: number) {
  const asc = sort === "asc";
  if (group_by === "doctor") {
    const grouped: Record<string, { Doctor: string; total: number; State: string }> = {};
    for (const r of rows) {
      const key = r.Doctor || "Unknown";
      if (!grouped[key]) grouped[key] = { Doctor: key, total: 0, State: r["St Code"] || "" };
      grouped[key].total += (r.Qty || 0);
    }
    const results = Object.values(grouped).sort((a, b) => asc ? a.total - b.total : b.total - a.total).slice(0, Math.min(limit, 50)).map(r => ({ Doctor: r.Doctor, "Total Cases": r.total, State: r.State }));
    return { results, columns: ["Doctor", "Total Cases", "State"] };
  }
  if (group_by === "hospital") {
    const grouped: Record<string, { Hospital: string; total: number; State: string }> = {};
    for (const r of rows) {
      const key = r.Hospital || "Unknown";
      if (!grouped[key]) grouped[key] = { Hospital: key, total: 0, State: r["St Code"] || "" };
      grouped[key].total += (r.Qty || 0);
    }
    const results = Object.values(grouped).sort((a, b) => asc ? a.total - b.total : b.total - a.total).slice(0, Math.min(limit, 50)).map(r => ({ Hospital: r.Hospital, "Total Cases": r.total, State: r.State }));
    return { results, columns: ["Hospital", "Total Cases", "State"] };
  }
  if (group_by === "state") {
    const grouped: Record<string, number> = {};
    for (const r of rows) { const k = r["St Code"] || "Unknown"; grouped[k] = (grouped[k] || 0) + (r.Qty || 0); }
    const results = Object.entries(grouped).sort((a, b) => asc ? a[1] - b[1] : b[1] - a[1]).slice(0, Math.min(limit, 50)).map(([State, qty]) => ({ State, "Total Cases": qty }));
    return { results, columns: ["State", "Total Cases"] };
  }
  if (group_by === "surgery") {
    const grouped: Record<string, number> = {};
    for (const r of rows) { const k = r.Surgery || "Unknown"; grouped[k] = (grouped[k] || 0) + (r.Qty || 0); }
    const results = Object.entries(grouped).sort((a, b) => asc ? a[1] - b[1] : b[1] - a[1]).slice(0, Math.min(limit, 50)).map(([Surgery, qty]) => ({ Surgery, "Total Cases": qty }));
    return { results, columns: ["Surgery", "Total Cases"] };
  }
  if (group_by === "facility_type") {
    const grouped: Record<string, number> = {};
    for (const r of rows) { const k = r["Facility Type"] || "Unknown"; grouped[k] = (grouped[k] || 0) + (r.Qty || 0); }
    const results = Object.entries(grouped).sort((a, b) => asc ? a[1] - b[1] : b[1] - a[1]).slice(0, Math.min(limit, 50)).map(([k, qty]) => ({ "Facility Type": k, "Total Cases": qty }));
    return { results, columns: ["Facility Type", "Total Cases"] };
  }
  // doctor_detail — raw rows
  const results = rows.slice(0, Math.min(limit, 50)).map(r => ({ Doctor: r.Doctor || "", Hospital: r.Hospital || "", Surgery: r.Surgery || "", Cases: r.Qty || 0, State: r["St Code"] || "" }));
  return { results, columns: ["Doctor", "Hospital", "Surgery", "Cases", "State"] };
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session?.accessToken) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  if (!supabase) return NextResponse.json({ error: "Supabase not configured. Add SUPABASE_KEY to .env.local" }, { status: 503 });

  const { query } = await request.json();
  if (!query) return NextResponse.json({ error: "Missing query" }, { status: 400 });

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY not configured" }, { status: 500 });
  }

  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const msg = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 400,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: query }],
    });
    const raw = msg.content[0].type === "text" ? msg.content[0].text.trim() : "{}";
    const cleaned = raw.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned);

    const { interpretation, filters = {}, group_by = "doctor", sort = "desc", limit = 10 } = parsed;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let q: any = supabase.from("surgeon_volumes").select("*");
    q = applyFilters(q, filters as Record<string, unknown>);
    q = q.limit(3000);

    const { data, error: dbErr } = await q;
    if (dbErr) return NextResponse.json({ error: "Database query failed." }, { status: 500 });

    const { results, columns } = aggregateRows(data || [], group_by, sort, limit);
    return NextResponse.json({ interpretation, results, columns });
  } catch (err) {
    return NextResponse.json({ error: "Query failed. Try rephrasing." }, { status: 500 });
  }
}
