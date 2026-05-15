import { HUBSPOT_API_BASE, refreshSessionIfNeeded } from "@/lib/hubspot";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authed = await refreshSessionIfNeeded();
  if (!authed) return Response.json({ error: "Not authenticated" }, { status: 401 });
  if (!process.env.HUBSPOT_SERVICE_KEY) return Response.json({ error: "HUBSPOT_SERVICE_KEY not configured" }, { status: 500 });

  const { id } = await params;
  const res = await fetch(
    `${HUBSPOT_API_BASE}/crm/v3/objects/tasks/${id}?properties=hs_task_subject,hs_task_priority,hs_timestamp,hubspot_owner_id`,
    { headers: { Authorization: `Bearer ${process.env.HUBSPOT_SERVICE_KEY}` } }
  );

  if (!res.ok) return Response.json({ error: "Failed to fetch task" }, { status: 502 });

  const data = await res.json();
  const p = data.properties ?? {};
  const tsRaw = p.hs_timestamp ?? "";
  let due_date = "";
  if (tsRaw) {
    const ms = /^\d+$/.test(tsRaw) ? Number(tsRaw) : new Date(tsRaw).getTime();
    if (!isNaN(ms)) due_date = new Date(ms).toISOString().split("T")[0];
  }

  return Response.json({
    title: p.hs_task_subject ?? "",
    priority: p.hs_task_priority ?? "",
    due_date,
    owner_id: p.hubspot_owner_id ?? "",
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authed = await refreshSessionIfNeeded();
  if (!authed) return Response.json({ error: "Not authenticated" }, { status: 401 });
  if (!process.env.HUBSPOT_SERVICE_KEY) return Response.json({ error: "HUBSPOT_SERVICE_KEY not configured" }, { status: 500 });

  const { id } = await params;
  const { title, due_date, priority, owner_id } = await request.json();

  const properties: Record<string, string> = {};
  if (title?.trim()) properties.hs_task_subject = title.trim();
  if (priority) properties.hs_task_priority = priority;
  if (due_date) {
    const ms = new Date(due_date).getTime();
    if (!isNaN(ms)) properties.hs_timestamp = ms.toString();
  }
  if (owner_id) properties.hubspot_owner_id = owner_id;

  const res = await fetch(`${HUBSPOT_API_BASE}/crm/v3/objects/tasks/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.HUBSPOT_SERVICE_KEY}`,
    },
    body: JSON.stringify({ properties }),
  });

  if (!res.ok) return Response.json({ error: "Failed to update task" }, { status: 502 });
  return Response.json({ success: true });
}
