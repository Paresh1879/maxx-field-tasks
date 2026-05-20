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

function parseDoctorName(fullName: string): { first: string; last: string } {
  const clean = fullName.trim();
  if (clean.includes(",")) {
    const [last, rest] = clean.split(",").map(s => s.trim());
    const first = (rest || "").split(/\s+/)[0] || "";
    return { first: first.toUpperCase(), last: last.toUpperCase() };
  }
  const parts = clean.split(/\s+/);
  return { first: (parts[0] || "").toUpperCase(), last: (parts[parts.length - 1] || "").toUpperCase() };
}

function buildNameKey(first: string, last: string) {
  return `${first.toUpperCase().slice(0, 4)}_${last.toUpperCase()}`;
}

const SYSTEM_PROMPT = `You analyze cross-reference queries about orthopedic surgeons combining surgical volume data with industry payment data.

Tables:
- surgeon_volumes: Doctor (text, "Last, First M"), Hospital, "Facility Type" ("Hospital"/"ASC"), "St Code" (2-letter), Surgery ("Hip","Knee","Shoulder" + Partial/Revision variants), Qty (integer cases)
- open_payments: npi, first_name, last_name, state (2-letter), company_name, program_year (2013-2024), payment_type, total_amount_usd

Return ONLY a raw JSON object (no markdown, no backticks):
{
  "interpretation": "human-readable description",
  "volume_filters": {
    "surgery": "%Knee%" or ["%Knee%","%Hip%"] for ILIKE,
    "state": "FL" (2-letter, optional),
    "facility_type": "Hospital" or "ASC" (optional),
    "min_qty": 200 (minimum total cases, optional)
  },
  "payment_condition": "low" | "exclude_company" | "high" | "none",
  "payment_filters": {
    "max_company_amount": 5000 (max from any single company, for "low"),
    "min_amount": 10000 (min total payments, for "high"),
    "year": 2024 (optional)
  },
  "exclude_companies": ["Stryker"],
  "limit": 25
}

payment_condition meanings:
- "low": surgeon's max payment from any single company < max_company_amount
- "exclude_company": surgeon has $0 from listed companies
- "high": surgeon total payments > min_amount
- "none": show all with payment data, no filtering`;

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
    // Parse with Claude
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const msg = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 600,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: query }],
    });
    const raw = msg.content[0].type === "text" ? msg.content[0].text.trim() : "{}";
    const cleaned = raw.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned);

    const { interpretation, volume_filters = {}, payment_condition = "none", payment_filters = {}, exclude_companies = [], limit = 25 } = parsed;
    const vf = volume_filters as Record<string, unknown>;
    const pf = payment_filters as Record<string, unknown>;

    // Step 1: Query surgeon_volumes
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let vq: any = supabase.from("surgeon_volumes").select("*");
    if (vf.surgery) {
      if (Array.isArray(vf.surgery)) {
        vq = vq.or((vf.surgery as string[]).map((s: string) => `Surgery.ilike.${s}`).join(","));
      } else {
        vq = vq.ilike("Surgery", vf.surgery as string);
      }
    }
    if (vf.state) vq = vq.eq("St Code", vf.state as string);
    if (vf.facility_type) vq = vq.eq("Facility Type", vf.facility_type as string);
    if (vf.hospital) vq = vq.ilike("Hospital", vf.hospital as string);
    vq = vq.limit(5000);

    const { data: volRows, error: volErr } = await vq;
    if (volErr) return NextResponse.json({ error: "Volume query failed." }, { status: 500 });

    // Aggregate volume by doctor
    const volByDoc: Record<string, { doctor: string; total: number; state: string; surgeries: Record<string, number>; facilities: Set<string> }> = {};
    for (const r of (volRows || [])) {
      const key = r.Doctor || "Unknown";
      if (!volByDoc[key]) volByDoc[key] = { doctor: key, total: 0, state: r["St Code"] || "", surgeries: {}, facilities: new Set() };
      volByDoc[key].total += (r.Qty || 0);
      const surg = r.Surgery || "Other";
      volByDoc[key].surgeries[surg] = (volByDoc[key].surgeries[surg] || 0) + (r.Qty || 0);
      if (r.Hospital) volByDoc[key].facilities.add(r.Hospital);
    }

    const minQty = (vf.min_qty as number) || 0;
    const qualifiedDoctors = Object.values(volByDoc).filter(d => d.total >= minQty);

    if (qualifiedDoctors.length === 0) {
      return NextResponse.json({ interpretation: parsed.interpretation || "No surgeons matched volume criteria.", results: [], columns: [] });
    }

    // Step 2: Batch-query open_payments for matched doctors
    const nameList = qualifiedDoctors.map(d => ({ ...parseDoctorName(d.doctor), originalName: d.doctor }));
    const validNameKeys = new Set(nameList.map(n => buildNameKey(n.first, n.last)));
    const uniqueLastNames = [...new Set(nameList.map(n => n.last).filter(Boolean))];

    const paymentsByDoc: Record<string, { total: number; byCompany: Record<string, number>; companies: Set<string> }> = {};

    // Query in batches of 10
    const CONCURRENT = 10;
    for (let i = 0; i < uniqueLastNames.length; i += CONCURRENT) {
      const batch = uniqueLastNames.slice(i, i + CONCURRENT);
      const promises = batch.map(async (ln: string) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let pq: any = supabase!.from("open_payments")
          .select("first_name,last_name,company_name,total_amount_usd")
          .eq("npi_is_synthetic", false)
          .ilike("last_name", `%${ln}%`);
        if (pf.year) pq = pq.eq("program_year", pf.year as number);
        pq = pq.limit(500);
        return pq;
      });

      const results = await Promise.all(promises);
      for (const { data: payRows, error: payErr } of results) {
        if (payErr) continue;
        for (const r of (payRows || [])) {
          const rFirst = (r.first_name || "").toUpperCase().split(/\s+/)[0];
          const rLast = (r.last_name || "").toUpperCase();
          const key = buildNameKey(rFirst, rLast);
          if (!validNameKeys.has(key)) continue;
          if (!paymentsByDoc[key]) paymentsByDoc[key] = { total: 0, byCompany: {}, companies: new Set() };
          const amt = parseFloat(r.total_amount_usd || 0);
          paymentsByDoc[key].total += amt;
          const co = (r.company_name || "Unknown").toLowerCase();
          paymentsByDoc[key].byCompany[co] = (paymentsByDoc[key].byCompany[co] || 0) + amt;
          paymentsByDoc[key].companies.add(r.company_name || "Unknown");
        }
      }
    }

    // Step 3: Merge and apply payment conditions
    const condition = payment_condition as string;
    const excludeCompaniesLower = (exclude_companies as string[]).map((c: string) => c.toLowerCase());
    const maxCoAmt = (pf.max_company_amount as number) || 5000;

    const merged = [];
    for (const doc of qualifiedDoctors) {
      const { first, last } = parseDoctorName(doc.doctor);
      const key = buildNameKey(first, last);
      const pay = paymentsByDoc[key] || { total: 0, byCompany: {}, companies: new Set() };

      let maxSingleCo = 0, topCompany = "None";
      for (const [co, amt] of Object.entries(pay.byCompany)) {
        if (amt > maxSingleCo) { maxSingleCo = amt; topCompany = co; }
      }
      topCompany = topCompany !== "None" ? ([...pay.companies].find((c: string) => c.toLowerCase() === topCompany) || topCompany) : "None";

      if (condition === "low") {
        if (maxSingleCo > maxCoAmt) continue;
      } else if (condition === "exclude_company") {
        const hasExcluded = excludeCompaniesLower.some((ec: string) => Object.keys(pay.byCompany).some((co: string) => co.includes(ec)));
        if (hasExcluded) continue;
      } else if (condition === "high") {
        const minAmt = (pf.min_amount as number) || 10000;
        if (pay.total < minAmt) continue;
      }

      const topSurgery = Object.entries(doc.surgeries).sort((a, b) => b[1] - a[1])[0];

      merged.push({
        Doctor: doc.doctor,
        State: doc.state,
        "Total Cases": doc.total,
        "Top Surgery": topSurgery ? `${topSurgery[0]} (${topSurgery[1]})` : "N/A",
        "Total Payments": fmtUsd(pay.total),
        "Top Company": topCompany,
      });
    }

    merged.sort((a, b) => b["Total Cases"] - a["Total Cases"]);
    const limited = merged.slice(0, Math.min(limit as number, 100));

    const columns = ["Doctor", "State", "Total Cases", "Top Surgery", "Total Payments", "Top Company"];
    return NextResponse.json({ interpretation, results: limited, columns });

  } catch (err) {
    return NextResponse.json({ error: "Query failed. Try rephrasing." }, { status: 500 });
  }
}
