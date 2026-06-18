import { HUBSPOT_API_BASE, refreshSessionIfNeeded, getServiceKey } from "@/lib/hubspot";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authed = await refreshSessionIfNeeded();
  if (!authed) return Response.json({ error: "Not authenticated" }, { status: 401 });

  const { id } = await params;

  let serviceKey: string;
  try {
    serviceKey = await getServiceKey();
  } catch {
    return Response.json({ error: "Service key not configured for this portal" }, { status: 500 });
  }

  const res = await fetch(
    `${HUBSPOT_API_BASE}/crm/v3/objects/companies/${id}?properties=name,domain,phone,city,state`,
    { headers: { Authorization: `Bearer ${serviceKey}` } }
  );

  if (!res.ok) return Response.json({ error: "Failed to fetch company" }, { status: 502 });

  const data = await res.json();
  const p = data.properties ?? {};
  return Response.json({
    id: data.id,
    name: p.name ?? data.id,
    domain: p.domain ?? null,
    phone: p.phone ?? null,
    city: p.city ?? null,
    state: p.state ?? null,
  });
}
