import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL || "https://qouiyqupoqrjojqnzicb.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_KEY || "";
const supabase = SUPABASE_KEY ? createClient(SUPABASE_URL, SUPABASE_KEY) : null;

function fmtUsd(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
}

const SYSTEM_PROMPT = `You are a data analyst. You have access to an open payments database table called "open_payments" with these columns:

- "npi" (bigint): 10-digit NPI number of the provider
- "first_name" (text): Provider's first name
- "last_name" (text): Provider's last name
- "city" (text): Provider's city
- "state" (text): 2-letter US state code, e.g. "PA", "NJ"
- "specialty" (text): Medical specialty, e.g. "Orthopaedic Surgery"
- "company_name" (text): The company making the payment (e.g. "Stryker", "Zimmer Biomet", "DePuy Synthes")
- "program_year" (integer): Year of payment (2013-2024)
- "payment_type" (text): Nature of payment (e.g. "Food and Beverage", "Consulting Fee", "Travel and Lodging", "Royalty or License")
- "total_amount_usd" (numeric): Payment amount in USD
- "npi_is_synthetic" (boolean): True if the NPI was assigned synthetically (filter these out by default)

Each row is a summarized payment record. A provider can have many rows (different companies, years, payment types).

Given a user's natural language question, return ONLY a raw JSON object (no markdown, no backticks) with:

1. "interpretation" (string): A human-readable sentence describing what you're querying
2. "filters" (object): WHERE conditions. Only include filters the user specified:
   - "last_name" (string): ILIKE pattern, e.g. "%Shah%"
   - "first_name" (string): ILIKE pattern, e.g. "%Asit%"
   - "company_name" (string): ILIKE pattern, e.g. "%Stryker%"
   - "state" (string): 2-letter state code, e.g. "PA"
   - "specialty" (string): ILIKE pattern, e.g. "%Orthopaedic%"
   - "payment_type" (string): ILIKE pattern, e.g. "%Consulting%"
   - "program_year" (integer): Exact year
   - "min_amount" (number): Minimum total_amount_usd
   - "npi" (integer): Exact NPI number
3. "group_by" (string): One of: "doctor", "company", "state", "specialty", "payment_type", "year", "doctor_detail"
4. "sort" (string): "desc" (default) or "asc"
5. "limit" (number): Number of results (default 10, max 50)

Examples:
- "top paid surgeons in PA" → {"interpretation":"Top paid providers in Pennsylvania","filters":{"state":"PA"},"group_by":"doctor","sort":"desc","limit":10}
- "Stryker payments 2023" → {"interpretation":"All Stryker payments in 2023","filters":{"company_name":"%Stryker%","program_year":2023},"group_by":"doctor","sort":"desc","limit":10}`;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyFilters(q: any, filters: Record<string, unknown>) {
  if (filters.last_name) q = q.ilike("last_name", filters.last_name as string);
  if (filters.first_name) q = q.ilike("first_name", filters.first_name as string);
  if (filters.company_name) q = q.ilike("company_name", filters.company_name as string);
  if (filters.state) q = q.eq("state", filters.state as string);
  if (filters.specialty) q = q.ilike("specialty", filters.specialty as string);
  if (filters.payment_type) q = q.ilike("payment_type", filters.payment_type as string);
  if (filters.program_year) q = q.eq("program_year", filters.program_year as number);
  if (filters.min_amount) q = q.gte("total_amount_usd", filters.min_amount as number);
  if (filters.npi) q = q.eq("npi", filters.npi as number);
  return q;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function aggregateRows(rows: any[], group_by: string, sort: string, limit: number) {
  const asc = sort === "asc";
  if (group_by === "doctor") {
    const grouped: Record<string, { Doctor: string; NPI: string; total: number; State: string; Specialty: string }> = {};
    for (const r of rows) {
      const key = r.npi || `${r.last_name}_${r.first_name}`;
      if (!grouped[key]) grouped[key] = { Doctor: `${r.first_name || ""} ${r.last_name || ""}`.trim(), NPI: String(r.npi || ""), total: 0, State: r.state || "", Specialty: r.specialty || "" };
      grouped[key].total += parseFloat(r.total_amount_usd || 0);
    }
    const results = Object.values(grouped)
      .sort((a, b) => asc ? a.total - b.total : b.total - a.total)
      .slice(0, Math.min(limit, 50))
      .map(r => ({ Doctor: r.Doctor, NPI: r.NPI, "Total Payments": fmtUsd(r.total), State: r.State, Specialty: r.Specialty }));
    return { results, columns: ["Doctor", "NPI", "Total Payments", "State", "Specialty"] };
  }
  if (group_by === "company") {
    const grouped: Record<string, number> = {};
    for (const r of rows) { const k = r.company_name || "Unknown"; grouped[k] = (grouped[k] || 0) + parseFloat(r.total_amount_usd || 0); }
    const results = Object.entries(grouped).sort((a, b) => asc ? a[1] - b[1] : b[1] - a[1]).slice(0, Math.min(limit, 50)).map(([Company, total]) => ({ Company, "Total Payments": fmtUsd(total) }));
    return { results, columns: ["Company", "Total Payments"] };
  }
  if (group_by === "state") {
    const grouped: Record<string, number> = {};
    for (const r of rows) { const k = r.state || "Unknown"; grouped[k] = (grouped[k] || 0) + parseFloat(r.total_amount_usd || 0); }
    const results = Object.entries(grouped).sort((a, b) => asc ? a[1] - b[1] : b[1] - a[1]).slice(0, Math.min(limit, 50)).map(([State, total]) => ({ State, "Total Payments": fmtUsd(total) }));
    return { results, columns: ["State", "Total Payments"] };
  }
  if (group_by === "payment_type") {
    const grouped: Record<string, number> = {};
    for (const r of rows) { const k = r.payment_type || "Unknown"; grouped[k] = (grouped[k] || 0) + parseFloat(r.total_amount_usd || 0); }
    const results = Object.entries(grouped).sort((a, b) => asc ? a[1] - b[1] : b[1] - a[1]).slice(0, Math.min(limit, 50)).map(([k, total]) => ({ "Payment Type": k, "Total Payments": fmtUsd(total) }));
    return { results, columns: ["Payment Type", "Total Payments"] };
  }
  if (group_by === "year") {
    const grouped: Record<string, number> = {};
    for (const r of rows) { const k = String(r.program_year || "Unknown"); grouped[k] = (grouped[k] || 0) + parseFloat(r.total_amount_usd || 0); }
    const results = Object.entries(grouped).sort((a, b) => asc ? a[0].localeCompare(b[0]) : b[0].localeCompare(a[0])).slice(0, Math.min(limit, 50)).map(([Year, total]) => ({ Year, "Total Payments": fmtUsd(total) }));
    return { results, columns: ["Year", "Total Payments"] };
  }
  // doctor_detail — raw rows
  const results = rows.slice(0, Math.min(limit, 50)).map(r => ({
    Doctor: `${r.first_name || ""} ${r.last_name || ""}`.trim(),
    Company: r.company_name || "",
    Year: String(r.program_year || ""),
    "Payment Type": r.payment_type || "",
    Amount: fmtUsd(parseFloat(r.total_amount_usd || 0)),
  }));
  return { results, columns: ["Doctor", "Company", "Year", "Payment Type", "Amount"] };
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
    let q: any = supabase.from("open_payments").select("*").eq("npi_is_synthetic", false);
    q = applyFilters(q, filters as Record<string, unknown>);
    q = q.order("total_amount_usd", { ascending: false }).limit(5000);

    const { data, error: dbErr } = await q;
    if (dbErr) return NextResponse.json({ error: "Database query failed." }, { status: 500 });

    const { results, columns } = aggregateRows(data || [], group_by, sort, limit);
    return NextResponse.json({ interpretation, results, columns });
  } catch (err) {
    return NextResponse.json({ error: "Query failed. Try rephrasing." }, { status: 500 });
  }
}
