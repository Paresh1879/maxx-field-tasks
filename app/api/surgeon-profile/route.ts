import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";

/* ── Supabase (same instance as NPI lookup) ── */
const SUPABASE_URL = process.env.SUPABASE_URL || "https://qouiyqupoqrjojqnzicb.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_KEY || "";
const supabase = SUPABASE_KEY ? createClient(SUPABASE_URL, SUPABASE_KEY) : null;

/* ── Types ── */
type VolumeRow = { Doctor: string; Hospital: string; "Facility Type": string; Surgery: string; Qty: number };
type PaymentRow = { npi: number; first_name: string; last_name: string; city: string; state: string; specialty: string; company_name: string; program_year: number; payment_type: string; total_amount_usd: string; npi_is_synthetic: boolean };

/* ── DuckDuckGo web search ── */
async function webSearch(query: string): Promise<string[]> {
  try {
    const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; MaxxHubApp/1.0)" },
      signal: AbortSignal.timeout(3500),
    });
    if (!res.ok) return [];
    const html = await res.text();
    const snippets: string[] = [];
    const snippetRe = /<a class="result__snippet"[^>]*>([\s\S]*?)<\/a>/gi;
    const titleRe = /<a class="result__a"[^>]*>([\s\S]*?)<\/a>/gi;
    let m: RegExpExecArray | null;
    const clean = (s: string) => s.replace(/<\/?b>/gi, "").replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&#x27;/g, "'").replace(/&quot;/g, '"').trim();
    while ((m = snippetRe.exec(html)) !== null && snippets.length < 10) {
      const t = clean(m[1]); if (t.length > 20) snippets.push(t);
    }
    while ((m = titleRe.exec(html)) !== null && snippets.length < 14) {
      const t = clean(m[1]); if (t.length > 10) snippets.push(t);
    }
    return snippets;
  } catch { return []; }
}

/* ── NPPES lookup — searches broadly across all individual providers ── */
async function fetchNPPES(firstName: string, lastName: string) {
  // Search without taxonomy filter to find any specialty (thoracic, cardiac, ortho, etc.)
  const p1 = new URLSearchParams({ version: "2.1", enumeration_type: "NPI-1", limit: "10", last_name: lastName });
  if (firstName) p1.set("first_name", firstName);

  try {
    const r = await fetch(`https://npiregistry.cms.hhs.gov/api/?${p1}`, { signal: AbortSignal.timeout(8000) });
    const d = await r.json();
    const p = (d.results || [])[0];
    if (!p) return null;
    return {
      npi: p.number as string,
      firstName: (p.basic?.first_name || "") as string,
      lastName: (p.basic?.last_name || "") as string,
      credential: (p.basic?.credential || "") as string,
      specialty: (p.taxonomies?.[0]?.desc || "") as string,
      addresses: ((p.addresses || []) as Record<string,string>[])
        .filter(a => a.address_purpose === "LOCATION")
        .map(a => ({ city: a.city, state: a.state, zip: a.postal_code, phone: a.telephone_number })),
    };
  } catch {
    return null;
  }
}

/* ── Supabase: open_payments ── */
async function fetchPayments(firstName: string, lastName: string) {
  if (!supabase) return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let q: any = supabase.from("open_payments").select("*").eq("npi_is_synthetic", false).ilike("last_name", `%${lastName}%`);
  if (firstName) q = q.ilike("first_name", `%${firstName}%`);
  const { data } = await q.order("total_amount_usd", { ascending: false }).limit(2000);
  const rows: PaymentRow[] = data || [];
  if (!rows.length) return null;

  let total = 0;
  const byYear: Record<string, number> = {};
  const byCompany: Record<string, number> = {};
  const companyDisplay: Record<string, string> = {};
  const byType: Record<string, number> = {};

  for (const r of rows) {
    const amt = parseFloat(r.total_amount_usd) || 0;
    total += amt;
    const yr = String(r.program_year || "Unknown");
    byYear[yr] = (byYear[yr] || 0) + amt;
    const rawCo = r.company_name || "Unknown";
    const normCo = rawCo.trim().replace(/\s+/g, " ").toLowerCase();
    byCompany[normCo] = (byCompany[normCo] || 0) + amt;
    if (!companyDisplay[normCo] || rawCo.length > (companyDisplay[normCo] || "").length) companyDisplay[normCo] = rawCo;
    const pt = r.payment_type || "Unknown";
    byType[pt] = (byType[pt] || 0) + amt;
  }

  return {
    total,
    records: rows.length,
    npi: rows[0]?.npi || null,
    specialty: rows[0]?.specialty || "",
    byYear: Object.entries(byYear).sort((a,b) => String(b[0]).localeCompare(String(a[0]))).map(([year, amount]) => ({ year, amount: Math.round(amount * 100) / 100 })),
    byCompany: Object.entries(byCompany).sort((a,b) => b[1]-a[1]).map(([k, amount]) => ({ company: companyDisplay[k], amount: Math.round(amount * 100) / 100 })),
    byType: Object.entries(byType).sort((a,b) => b[1]-a[1]).map(([type, amount]) => ({ type, amount: Math.round(amount * 100) / 100 })),
  };
}

/* ── Supabase: surgeon_volumes ── */
async function fetchVolume(firstName: string, lastName: string) {
  if (!supabase) return null;
  // Doctor field is stored "LAST, FIRST" — search by last name only for reliable matching
  const pattern = `%${lastName}%`;
  const { data } = await supabase.from("surgeon_volumes").select("*").ilike("Doctor", pattern).order("Qty", { ascending: false }).limit(500);
  const rows: VolumeRow[] = data || [];
  if (!rows.length) return null;

  let totalQty = 0;
  const bySurgery: Record<string, number> = {};
  const byFacility: Record<string, { name: string; qty: number; type: string }> = {};
  const bySetting = { Hospital: 0, ASC: 0 };

  for (const r of rows) {
    const qty = r.Qty || 0;
    totalQty += qty;
    const s = r.Surgery || "Unknown";
    bySurgery[s] = (bySurgery[s] || 0) + qty;
    const h = r.Hospital || "Unknown";
    if (!byFacility[h]) byFacility[h] = { name: h, qty: 0, type: r["Facility Type"] || "" };
    byFacility[h].qty += qty;
    const ft = (r["Facility Type"] || "").toLowerCase();
    if (ft.includes("asc")) bySetting.ASC += qty; else bySetting.Hospital += qty;
  }

  return {
    totalQty,
    doctorName: rows[0]?.Doctor || "",
    bySurgery: Object.entries(bySurgery).sort((a,b) => b[1]-a[1]).map(([surgery, qty]) => ({ surgery, qty })),
    byFacility: Object.values(byFacility).sort((a,b) => b.qty - a.qty),
    bySetting,
  };
}

/* ── Claude bio generation ── */
const BIO_SYSTEM = `You are a medical research expert producing detailed surgeon intelligence profiles. Use the web search results to find REAL, verified information. Extract specific institution names for education, residency, fellowship, and affiliations. Only say "Not publicly available" if truly absent.

Return ONLY a raw JSON object (no markdown) with:
- "summary": 3-4 sentence professional biography in third person
- "education": object with "medical_school" (string), "residency" (string), "fellowship" (string or null)
- "hospital_affiliations": array of strings
- "clinical_focus": array of 3-5 strings
- "board_certifications": array of strings
- "research_interests": array of strings (can be empty)
- "industry_relationships": 1-2 sentence string or null`;

async function generateBio(firstName: string, lastName: string, provider: Awaited<ReturnType<typeof fetchNPPES>>, payments: Awaited<ReturnType<typeof fetchPayments>>, volume: Awaited<ReturnType<typeof fetchVolume>>, snippets: string[]) {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  try {
    const name = `${firstName} ${lastName}`.trim();
    const ctx: string[] = [
      `Surgeon: ${name}`,
      provider ? `NPI: ${provider.npi}` : "",
      provider ? `Specialty: ${provider.specialty}` : "",
      provider?.addresses?.length ? `Location: ${provider.addresses.map(a => `${a.city}, ${a.state}`).join("; ")}` : "",
    ].filter(Boolean);

    if (payments && payments.total > 0) {
      ctx.push(`Total industry payments: $${Math.round(payments.total).toLocaleString()} across ${payments.records} records`);
      if (payments.byCompany.length) ctx.push(`Top paying companies: ${payments.byCompany.slice(0,5).map(c => `${c.company} ($${Math.round(c.amount).toLocaleString()})`).join(", ")}`);
    }
    if (volume && volume.totalQty > 0) {
      ctx.push(`Surgical volume: ${volume.totalQty} cases`);
      if (volume.bySurgery.length) ctx.push(`Surgery types: ${volume.bySurgery.slice(0,5).map(s => `${s.surgery} (${s.qty})`).join(", ")}`);
      if (volume.byFacility.length) ctx.push(`Facilities: ${volume.byFacility.slice(0,3).map(f => `${f.name} (${f.type})`).join(", ")}`);
    }
    if (snippets.length) {
      ctx.push("\n--- WEB SEARCH RESULTS ---");
      ctx.push(snippets.join("\n"));
      ctx.push("--- END ---");
    }

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const msg = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1400,
      system: BIO_SYSTEM,
      messages: [{ role: "user", content: ctx.join("\n") }],
    });
    const raw = msg.content[0].type === "text" ? msg.content[0].text.trim() : "{}";
    return JSON.parse(raw.replace(/```json|```/g, "").trim());
  } catch { return null; }
}

/* ── Main handler ── */
export async function GET(request: Request) {
  const session = await getSession();
  if (!session?.accessToken) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const firstName = searchParams.get("first_name")?.trim() || "";
  const lastName = searchParams.get("last_name")?.trim() || "";
  if (!lastName) return NextResponse.json({ error: "last_name required" }, { status: 400 });

  // Run all data fetches in parallel
  const [nppesResult, paymentsResult, volumeResult] = await Promise.allSettled([
    fetchNPPES(firstName, lastName),
    fetchPayments(firstName, lastName),
    fetchVolume(firstName, lastName),
  ]);

  const provider = nppesResult.status === "fulfilled" ? nppesResult.value : null;
  const payments = paymentsResult.status === "fulfilled" ? paymentsResult.value : null;
  const volume = volumeResult.status === "fulfilled" ? volumeResult.value : null;

  // Web search — skip if Supabase already gives rich context (speeds up response)
  const name = `${firstName} ${lastName}`.trim();
  const specialty = provider?.specialty || "";
  const hasRichData = (volume?.totalQty ?? 0) > 0 || (payments?.total ?? 0) > 0;
  const snippets = hasRichData
    ? []  // Supabase data is enough context for Claude
    : await webSearch(`Dr. ${name} ${specialty} education residency fellowship medical school hospital`);
  const bio = await generateBio(firstName, lastName, provider, payments, volume, snippets);

  return NextResponse.json({ provider, payments, volume, bio });
}
