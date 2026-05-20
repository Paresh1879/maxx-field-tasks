import { NextResponse } from "next/server";
import { HUBSPOT_API_BASE, getHubspotClient } from "@/lib/hubspot";
import { getSession } from "@/lib/session";
import { FilterOperatorEnum } from "@hubspot/api-client/lib/codegen/crm/deals/models/Filter";

export type UrgentItem = {
  id: string;
  type: "task" | "deal";
  title: string;
  dueMs: number;
  dealId?: string;
  priority?: string;
};

export type UrgentResponse = {
  overdue: UrgentItem[];
  dueSoon: UrgentItem[];
};

export async function GET(): Promise<NextResponse> {
  const session = await getSession();
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const now = Date.now();
  const weekFromNow = now + 7 * 24 * 60 * 60 * 1000;

  try {
    const client = await getHubspotClient();

    // Get current user's owner ID
    let ownerId: string | null = null;
    try {
      const [tokenInfo, ownersRes] = await Promise.all([
        fetch(`${HUBSPOT_API_BASE}/oauth/v1/access-tokens/${session.accessToken}`).then(r => r.json() as Promise<{ user_id: number }>),
        client.crm.owners.ownersApi.getPage(undefined, undefined, 100),
      ]);
      const owner = (ownersRes.results ?? []).find(o => o.userId === tokenInfo.user_id);
      ownerId = owner ? String(owner.id) : null;
    } catch { /* proceed without owner filter */ }

    // ── Fetch overdue + due-soon deals ──
    const dealFilters = [
      { propertyName: "dealstage", operator: FilterOperatorEnum.NotIn, values: ["closedwon", "closedlost"] },
      { propertyName: "closedate", operator: FilterOperatorEnum.Lte, value: new Date(weekFromNow).toISOString() },
    ];
    if (ownerId) dealFilters.push({ propertyName: "hubspot_owner_id", operator: FilterOperatorEnum.Eq, value: ownerId });

    const dealsPromise = client.crm.deals.searchApi.doSearch({
      filterGroups: [{ filters: dealFilters }],
      properties: ["dealname", "closedate", "dealstage"],
      sorts: ["closedate"],
      limit: 15,
      after: "0",
    }).catch(() => ({ results: [] }));

    // ── Fetch tasks via CRM v3 tasks search ──
    const tasksPromise = fetch(`${HUBSPOT_API_BASE}/crm/v3/objects/tasks/search`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.accessToken}`,
      },
      body: JSON.stringify({
        filterGroups: [{
          filters: [
            { propertyName: "hs_task_status", operator: "NOT_IN", values: ["COMPLETED", "DEFERRED"] },
            { propertyName: "hs_timestamp", operator: "LTE", value: String(weekFromNow) },
            ...(ownerId ? [{ propertyName: "hubspot_owner_id", operator: "EQ", value: ownerId }] : []),
          ],
        }],
        properties: ["hs_task_subject", "hs_timestamp", "hs_task_priority", "hs_task_status"],
        sorts: [{ propertyName: "hs_timestamp", direction: "ASCENDING" }],
        limit: 15,
      }),
    }).then(r => r.ok ? r.json() : { results: [] }).catch(() => ({ results: [] }));

    const [dealsRes, tasksJson] = await Promise.all([dealsPromise, tasksPromise]);

    // Process deals
    const dealItems: UrgentItem[] = (dealsRes.results ?? [])
      .filter(d => d.properties.closedate)
      .map(d => {
        const dueMs = /^\d+$/.test(d.properties.closedate!)
          ? Number(d.properties.closedate)
          : new Date(d.properties.closedate!).getTime();
        return {
          id: d.id,
          type: "deal" as const,
          title: d.properties.dealname ?? "Unnamed Deal",
          dueMs,
          dealId: d.id,
        };
      })
      .filter(d => !isNaN(d.dueMs));

    // Process tasks
    const taskItems: UrgentItem[] = ((tasksJson.results ?? []) as Array<{ id: string; properties: Record<string, string> }>)
      .filter(t => t.properties.hs_timestamp)
      .map(t => ({
        id: t.id,
        type: "task" as const,
        title: t.properties.hs_task_subject ?? "Task",
        dueMs: Number(t.properties.hs_timestamp),
        priority: t.properties.hs_task_priority ?? "",
      }))
      .filter(t => !isNaN(t.dueMs));

    // Merge, deduplicate, sort
    const all = [...dealItems, ...taskItems].sort((a, b) => a.dueMs - b.dueMs);

    const overdue = all.filter(i => i.dueMs < now);
    const dueSoon = all.filter(i => i.dueMs >= now);

    return NextResponse.json({ overdue, dueSoon } satisfies UrgentResponse);
  } catch {
    return NextResponse.json({ overdue: [], dueSoon: [] } satisfies UrgentResponse);
  }
}
