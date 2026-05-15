import { HUBSPOT_API_BASE, refreshSessionIfNeeded } from "@/lib/hubspot";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authed = await refreshSessionIfNeeded();
  if (!authed) return Response.json({ error: "Not authenticated" }, { status: 401 });
  if (!process.env.HUBSPOT_SERVICE_KEY) return Response.json({ error: "HUBSPOT_SERVICE_KEY not configured" }, { status: 500 });

  const { id } = await params;
  const res = await fetch(`${HUBSPOT_API_BASE}/engagements/v1/engagements/${id}`, {
    headers: { Authorization: `Bearer ${process.env.HUBSPOT_SERVICE_KEY}` },
  });

  if (!res.ok) return Response.json({ error: "Failed to fetch note" }, { status: 502 });

  const data = await res.json();
  const raw = data.metadata?.body ?? "";
  const body = raw.replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, "").trim();
  return Response.json({ body });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authed = await refreshSessionIfNeeded();
  if (!authed) return Response.json({ error: "Not authenticated" }, { status: 401 });
  if (!process.env.HUBSPOT_SERVICE_KEY) return Response.json({ error: "HUBSPOT_SERVICE_KEY not configured" }, { status: 500 });

  const { id } = await params;
  const { body } = await request.json();

  if (!body?.trim()) return Response.json({ error: "body is required" }, { status: 400 });

  const res = await fetch(`${HUBSPOT_API_BASE}/engagements/v1/engagements/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.HUBSPOT_SERVICE_KEY}`,
    },
    body: JSON.stringify({ metadata: { body: body.trim().replace(/\n/g, "<br>") } }),
  });

  if (!res.ok) return Response.json({ error: "Failed to update note" }, { status: 502 });
  return Response.json({ success: true });
}
