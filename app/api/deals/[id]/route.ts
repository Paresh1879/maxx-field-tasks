import { HUBSPOT_API_BASE, refreshSessionIfNeeded, getHubspotClient } from "@/lib/hubspot";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authed = await refreshSessionIfNeeded();
  if (!authed) return Response.json({ error: "Not authenticated" }, { status: 401 });

  const { id } = await params;
  try {
    const client = await getHubspotClient();
    const deal = await client.crm.deals.basicApi.getById(id, [
      "dealname", "amount", "closedate", "pipeline", "dealstage",
    ]);
    return Response.json({
      dealname: deal.properties.dealname ?? "",
      amount: deal.properties.amount ?? "",
      closedate: deal.properties.closedate ?? "",
      pipeline: deal.properties.pipeline ?? "",
      dealstage: deal.properties.dealstage ?? "",
    });
  } catch {
    return Response.json({ error: "Failed to fetch deal" }, { status: 502 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authed = await refreshSessionIfNeeded();
  if (!authed) return Response.json({ error: "Not authenticated" }, { status: 401 });
  if (!process.env.HUBSPOT_SERVICE_KEY) return Response.json({ error: "HUBSPOT_SERVICE_KEY not configured" }, { status: 500 });

  const { id } = await params;
  const body = await request.json();

  const properties: Record<string, string> = {};
  if (body.dealname?.trim()) properties.dealname = body.dealname.trim();
  if (body.amount !== undefined && body.amount !== "") properties.amount = parseFloat(body.amount).toString();
  if (body.closedate !== undefined) properties.closedate = body.closedate;
  if (body.pipeline) properties.pipeline = body.pipeline;
  if (body.dealstage) properties.dealstage = body.dealstage;

  if (Object.keys(properties).length === 0) {
    return Response.json({ success: true });
  }

  const res = await fetch(`${HUBSPOT_API_BASE}/crm/v3/objects/deals/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.HUBSPOT_SERVICE_KEY}`,
    },
    body: JSON.stringify({ properties }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    if (err?.category === "MISSING_SCOPES") {
      return Response.json({ error: "Missing scope: crm.objects.deals.write" }, { status: 403 });
    }
    return Response.json({ error: "Failed to update deal" }, { status: 502 });
  }

  return Response.json({ success: true });
}
