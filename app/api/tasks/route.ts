import { getSession } from "@/lib/session";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session.accessToken) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  if (!process.env.HUBSPOT_SERVICE_KEY) {
    return Response.json({ error: "HUBSPOT_SERVICE_KEY is not configured" }, { status: 500 });
  }

  const { title, due_date, priority, owner_id, dealId } = await request.json();

  if (!title?.trim() || !dealId) {
    return Response.json(
      { error: "title and dealId are required" },
      { status: 400 }
    );
  }

  const dueTimestamp = due_date
    ? new Date(due_date).getTime()
    : Date.now() + 7 * 24 * 60 * 60 * 1000;

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

  const res = await fetch("https://api.hubapi.com/engagements/v1/engagements", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.HUBSPOT_SERVICE_KEY}`,
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
