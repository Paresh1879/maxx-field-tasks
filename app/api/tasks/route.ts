import { HUBSPOT_API_BASE, refreshSessionIfNeeded, getServiceKey } from "@/lib/hubspot";

export async function POST(request: Request) {
  const authed = await refreshSessionIfNeeded();
  if (!authed) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  let serviceKey: string;
  try { serviceKey = await getServiceKey(); }
  catch { return Response.json({ error: "Service key not configured for this portal" }, { status: 500 }); }

  const { title, due_date, priority, owner_id, dealId } = await request.json();

  if (!title?.trim() || !dealId || isNaN(Number(dealId))) {
    return Response.json(
      { error: "title and dealId are required" },
      { status: 400 }
    );
  }

  if (priority && !["LOW", "MEDIUM", "HIGH"].includes(priority)) {
    return Response.json({ error: "Invalid priority" }, { status: 400 });
  }

  const dueMs = due_date ? new Date(due_date).getTime() : NaN;
  if (due_date && (isNaN(dueMs) || !/^\d{4}-\d{2}-\d{2}$/.test(due_date))) {
    return Response.json({ error: "Invalid due_date" }, { status: 400 });
  }

  const dueTimestamp = !isNaN(dueMs) ? dueMs : Date.now() + 7 * 24 * 60 * 60 * 1000;

  const body: Record<string, unknown> = {
    engagement: {
      active: true,
      type: "TASK",
      timestamp: dueTimestamp,
    },
    associations: {
      dealIds: [Number(dealId)],
    },
    metadata: {
      subject: title,
      status: "NOT_STARTED",
      priority: priority ?? "MEDIUM",
      taskType: "TODO",
    },
  };

  if (owner_id) {
    (body.engagement as Record<string, unknown>).ownerId = Number(owner_id);
  }

  const res = await fetch(`${HUBSPOT_API_BASE}/engagements/v1/engagements`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${serviceKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json();
    console.error("HubSpot engagement error:", err);
    return Response.json({ error: "Failed to create task" }, { status: 502 });
  }

  const data = await res.json();
  const taskId = data.engagement?.id?.toString() ?? "";
  const portalId = data.engagement?.portalId;
  const taskUrl = portalId
    ? `https://app.hubspot.com/contacts/${portalId}/record/0-3/${dealId}?taskId=${taskId}`
    : `https://app.hubspot.com/tasks`;

  return Response.json({ taskId, taskUrl });
}
