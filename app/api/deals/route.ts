// Uses HUBSPOT_SERVICE_KEY (private app) for write — same pattern as /api/tasks.
// Required private app scope: crm.objects.deals.write
// Add it in HubSpot → Settings → Integrations → Private Apps → your app → Scopes.
import { HUBSPOT_API_BASE, refreshSessionIfNeeded, getServiceKey } from "@/lib/hubspot";
import { getSession } from "@/lib/session";

export async function POST(request: Request) {
  const authed = await refreshSessionIfNeeded();
  if (!authed) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  let serviceKey: string;
  try { serviceKey = await getServiceKey(); }
  catch { return Response.json({ error: "Service key not configured for this portal" }, { status: 500 }); }

  const { dealname, amount, closedate, pipeline, dealstage } = await request.json();

  if (!dealname?.trim()) {
    return Response.json({ error: "dealname is required" }, { status: 400 });
  }

  // Resolve current user's owner ID using the OAuth token (read-only, no extra scope needed).
  const session = await getSession();
  const [tokenInfo, ownersJson] = await Promise.all([
    fetch(`${HUBSPOT_API_BASE}/oauth/v1/access-tokens/${session.accessToken}`)
      .then((r) => r.json() as Promise<{ user_id: number; hub_id: number }>)
      .catch(() => ({ user_id: 0, hub_id: 0 })),
    fetch(`${HUBSPOT_API_BASE}/crm/v3/owners/?limit=100`, {
      headers: { Authorization: `Bearer ${session.accessToken}` },
    })
      .then((r) => r.json())
      .catch(() => ({ results: [] })),
  ]);

  const currentOwner = (ownersJson.results ?? []).find(
    (o: { userId: number; id: string }) => o.userId === tokenInfo.user_id
  );

  const properties: Record<string, string> = { dealname: dealname.trim() };
  if (amount && !isNaN(parseFloat(amount))) properties.amount = parseFloat(amount).toString();
  if (closedate) properties.closedate = closedate;
  if (pipeline) properties.pipeline = pipeline;
  if (dealstage) properties.dealstage = dealstage;
  if (currentOwner) properties.hubspot_owner_id = String(currentOwner.id);

  const res = await fetch(`${HUBSPOT_API_BASE}/crm/v3/objects/deals`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${serviceKey}`,
    },
    body: JSON.stringify({ properties }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.error("HubSpot deal create error:", err);
    if (err?.category === "MISSING_SCOPES") {
      return Response.json(
        { error: "Missing scope: add crm.objects.deals.write to your HubSpot private app, then retry." },
        { status: 403 }
      );
    }
    return Response.json({ error: "Failed to create deal" }, { status: 502 });
  }

  const data = await res.json();
  const dealUrl = tokenInfo.hub_id
    ? `https://app.hubspot.com/contacts/${tokenInfo.hub_id}/record/0-3/${data.id}`
    : null;
  return Response.json({ dealId: data.id, dealUrl });
}
