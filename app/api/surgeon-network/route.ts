import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL || "https://qouiyqupoqrjojqnzicb.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_KEY || "";
const supabase = SUPABASE_KEY ? createClient(SUPABASE_URL, SUPABASE_KEY) : null;

function parseName(name: string): { first: string; last: string } {
  const clean = name.trim();
  if (clean.includes(",")) {
    const [last, rest] = clean.split(",").map((s: string) => s.trim());
    const first = (rest || "").split(/\s+/)[0] || "";
    return { first, last };
  }
  const parts = clean.split(/\s+/);
  if (parts.length === 1) return { first: "", last: parts[0] };
  return { first: parts[0], last: parts[parts.length - 1] };
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session?.accessToken) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  if (!supabase) return NextResponse.json({ error: "Supabase not configured. Add SUPABASE_KEY to .env.local" }, { status: 503 });

  const { name } = await request.json();
  if (!name) return NextResponse.json({ error: "Missing name" }, { status: 400 });

  const { last, first } = parseName(name);
  if (!last) return NextResponse.json({ error: "Could not parse surgeon name" }, { status: 400 });

  // Step 1: Find the surgeon's facilities
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let q: any = supabase.from("surgeon_volumes").select("*").ilike("Doctor", `%${last}%`);
  if (first) q = q.ilike("Doctor", `%${first}%`);

  const { data: surgeonRows, error: surgeonErr } = await q.limit(500);
  if (surgeonErr) return NextResponse.json({ error: "Database query failed." }, { status: 500 });

  if (!surgeonRows || surgeonRows.length === 0) {
    return NextResponse.json({ surgeon: name, facilities: [], affiliates: [] });
  }

  const surgeonName = surgeonRows[0]?.Doctor || name;
  const facilities = [...new Set((surgeonRows as { Hospital?: string }[]).map(r => r.Hospital).filter(Boolean))] as string[];

  if (facilities.length === 0) {
    return NextResponse.json({ surgeon: surgeonName, facilities: [], affiliates: [] });
  }

  // Step 2: Find co-affiliated surgeons at those facilities
  // Supabase doesn't support direct IN with ilike on the same field for multiple values
  // We'll query for each facility if <= 5, else top 5
  const topFacilities = facilities.slice(0, 5);
  const orFilter = topFacilities.map((f: string) => `Hospital.eq.${f}`).join(",");

  const { data: affiliateRows, error: affiliateErr } = await supabase
    .from("surgeon_volumes")
    .select("Doctor,Hospital,Qty,\"St Code\"")
    .or(orFilter)
    .limit(2000);

  if (affiliateErr) return NextResponse.json({ error: "Affiliate query failed." }, { status: 500 });

  // Aggregate by doctor
  const docMap: Record<string, { doctor: string; totalQty: number; facilities: Set<string>; state: string }> = {};
  for (const r of (affiliateRows || [])) {
    const doc = r.Doctor || "Unknown";
    if (doc.toLowerCase().includes(last.toLowerCase())) continue; // Skip the surgeon themselves
    if (!docMap[doc]) docMap[doc] = { doctor: doc, totalQty: 0, facilities: new Set(), state: r["St Code"] || "" };
    docMap[doc].totalQty += (r.Qty || 0);
    if (r.Hospital) docMap[doc].facilities.add(r.Hospital);
  }

  const affiliates = Object.values(docMap)
    .map(d => ({ Doctor: d.doctor, State: d.state, "Total Cases": d.totalQty, "Shared Facilities": d.facilities.size }))
    .sort((a, b) => b["Total Cases"] - a["Total Cases"])
    .slice(0, 50);

  return NextResponse.json({ surgeon: surgeonName, facilities, affiliates });
}
