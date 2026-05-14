import { HUBSPOT_API_BASE, refreshSessionIfNeeded } from "@/lib/hubspot";
import { getSession } from "@/lib/session";

export type HistoryContact = {
  id: string;
  name: string;
  email?: string;
  title?: string;
};

export type HistoryActivity = {
  id: string;
  type: "note" | "call" | "email" | "task";
  timestamp: number;
  subject?: string;
  body?: string;
};

export type DealHistory = {
  contacts: HistoryContact[];
  activities: HistoryActivity[];
};

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authed = await refreshSessionIfNeeded();
  if (!authed) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id: dealId } = await params;
  const session = await getSession();
  const token = session.accessToken;
  const headers = { Authorization: `Bearer ${token}` };
  const serviceKey = process.env.HUBSPOT_SERVICE_KEY;
  const taskHeaders = {
    Authorization: `Bearer ${serviceKey ?? token}`,
    "Content-Type": "application/json",
  };

  const [engRes, assocRes, taskAssocRes] = await Promise.all([
    fetch(
      `${HUBSPOT_API_BASE}/engagements/v1/engagements/associated/deal/${dealId}/paged?count=25`,
      { headers }
    ).catch(() => null),
    fetch(
      `${HUBSPOT_API_BASE}/crm/v3/objects/deals/${dealId}/associations/contacts?limit=20`,
      { headers }
    ).catch(() => null),
    fetch(
      `${HUBSPOT_API_BASE}/crm/v3/objects/deals/${dealId}/associations/tasks?limit=50`,
      { headers: taskHeaders }
    ).catch(() => null),
  ]);

  const activities: HistoryActivity[] = [];

  const contactIds: string[] = assocRes?.ok
    ? ((await assocRes.json()).results ?? []).map((r: { id: string }) => r.id)
    : [];

  const taskIds: string[] = taskAssocRes?.ok
    ? ((await taskAssocRes.json()).results ?? []).map((r: { id: string }) => r.id)
    : [];

  const [contactBatchRes, taskBatchRes] = await Promise.all([
    contactIds.length > 0
      ? fetch(`${HUBSPOT_API_BASE}/crm/v3/objects/contacts/batch/read`, {
          method: "POST",
          headers: { ...headers, "Content-Type": "application/json" },
          body: JSON.stringify({
            properties: ["firstname", "lastname", "email", "jobtitle"],
            inputs: contactIds.map((id) => ({ id })),
          }),
        })
      : null,
    taskIds.length > 0
      ? fetch(`${HUBSPOT_API_BASE}/crm/v3/objects/tasks/batch/read`, {
          method: "POST",
          headers: taskHeaders,
          body: JSON.stringify({
            properties: ["hs_task_subject", "hs_task_body", "hs_task_status", "hs_timestamp"],
            inputs: taskIds.map((id) => ({ id })),
          }),
        })
      : null,
  ]);

  if (engRes?.ok) {
    const data = await engRes.json();
    for (const item of data.results ?? []) {
      const type: string = item.engagement?.type ?? "";
      if (!["NOTE", "CALL", "EMAIL"].includes(type)) continue;
      const raw = item.metadata?.body ?? item.metadata?.html ?? "";
      activities.push({
        id: String(item.engagement.id),
        type: type.toLowerCase() as HistoryActivity["type"],
        timestamp: item.engagement.timestamp ?? 0,
        subject: item.metadata?.subject ?? undefined,
        body: raw ? stripHtml(raw).slice(0, 300) || undefined : undefined,
      });
    }
  }

  if (taskBatchRes?.ok) {
    const taskBatchData = await taskBatchRes.json();
    for (const t of taskBatchData.results ?? []) {
      const p = t.properties ?? {};
      const createdAt = t.createdAt ? new Date(t.createdAt).getTime() : 0;
      const dueRaw = p.hs_timestamp ?? "";
      const dueAt = dueRaw
        ? /^\d+$/.test(dueRaw)
          ? Number(dueRaw)
          : new Date(dueRaw).getTime()
        : 0;
      activities.push({
        id: t.id,
        type: "task",
        timestamp: createdAt || dueAt,
        subject: p.hs_task_subject ?? undefined,
        body: p.hs_task_body ? stripHtml(p.hs_task_body).slice(0, 300) || undefined : undefined,
      });
    }
  }

  activities.sort((a, b) => b.timestamp - a.timestamp);

  const contacts: HistoryContact[] = [];

  if (contactBatchRes?.ok) {
    const batchData = await contactBatchRes.json();
    for (const c of batchData.results ?? []) {
      const p = c.properties ?? {};
      const name =
        [p.firstname, p.lastname].filter(Boolean).join(" ") ||
        p.email ||
        c.id;
      contacts.push({
        id: c.id,
        name,
        email: p.email ?? undefined,
        title: p.jobtitle ?? undefined,
      });
    }
  }

  return Response.json({ contacts, activities } satisfies DealHistory);
}
