import { HUBSPOT_API_BASE, refreshSessionIfNeeded } from "@/lib/hubspot";

export async function POST(request: Request) {
  const authed = await refreshSessionIfNeeded();
  if (!authed) return Response.json({ error: "Not authenticated" }, { status: 401 });

  if (!process.env.HUBSPOT_SERVICE_KEY) {
    return Response.json({ error: "HUBSPOT_SERVICE_KEY is not configured" }, { status: 500 });
  }

  const { name, domain, dealId } = await request.json();

  if (!name?.trim()) {
    return Response.json({ error: "name is required" }, { status: 400 });
  }

  const properties: Record<string, string> = { name: name.trim() };
  if (domain?.trim()) properties.domain = domain.trim().toLowerCase().replace(/^https?:\/\//, "");

  const body: Record<string, unknown> = { properties };
  if (dealId) {
    body.associations = [{
      to: { id: String(dealId) },
      types: [{ associationCategory: "HUBSPOT_DEFINED", associationTypeId: 6 }],
    }];
  }

  const res = await fetch(`${HUBSPOT_API_BASE}/crm/v3/objects/companies`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.HUBSPOT_SERVICE_KEY}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.error("HubSpot company create error:", err);
    if (err?.category === "MISSING_SCOPES") {
      return Response.json(
        { error: "Missing scope: add crm.objects.companies.write to your HubSpot private app." },
        { status: 403 }
      );
    }
    return Response.json({ error: "Failed to create company" }, { status: 502 });
  }

  const data = await res.json();
  return Response.json({ companyId: data.id });
}
