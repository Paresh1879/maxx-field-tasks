import { HUBSPOT_API_BASE, refreshSessionIfNeeded } from "@/lib/hubspot";

export async function POST(request: Request) {
  const authed = await refreshSessionIfNeeded();
  if (!authed) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  if (!process.env.HUBSPOT_SERVICE_KEY) {
    return Response.json({ error: "HUBSPOT_SERVICE_KEY is not configured" }, { status: 500 });
  }

  const { body, dealId } = await request.json();

  if (!body?.trim() || !dealId || isNaN(Number(dealId))) {
    return Response.json({ error: "body and dealId are required" }, { status: 400 });
  }

  const payload = {
    engagement: {
      active: true,
      type: "NOTE",
      timestamp: Date.now(),
    },
    associations: {
      dealIds: [Number(dealId)],
    },
    metadata: {
      body: body.trim().replace(/\n/g, "<br>"),
    },
  };

  const res = await fetch(`${HUBSPOT_API_BASE}/engagements/v1/engagements`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.HUBSPOT_SERVICE_KEY}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.error("HubSpot note error:", err);
    return Response.json({ error: "Failed to create note" }, { status: 502 });
  }

  const data = await res.json();
  const noteId = data.engagement?.id?.toString() ?? "";
  const portalId = data.engagement?.portalId;
  const dealUrl = portalId
    ? `https://app.hubspot.com/contacts/${portalId}/record/0-3/${dealId}`
    : null;
  return Response.json({ noteId, dealUrl });
}
