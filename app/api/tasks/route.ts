import { getSession } from "@/lib/session";
import { withHubspot } from "@/lib/hubspot";
import { AssociationSpecAssociationCategoryEnum } from "@hubspot/api-client/lib/codegen/crm/objects/tasks/models/AssociationSpec";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session.accessToken) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { title, due_date, priority, owner_id, dealId } = await request.json();

  if (!title?.trim() || !dealId) {
    return Response.json(
      { error: "title and dealId are required" },
      { status: 400 }
    );
  }

  // Convert ISO date (YYYY-MM-DD) to millisecond timestamp HubSpot expects
  const dueTimestamp = due_date
    ? new Date(due_date).getTime().toString()
    : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).getTime().toString();

  const properties: Record<string, string> = {
    hs_task_subject: title,
    hs_task_type: "TODO",
    hs_task_priority: priority ?? "MEDIUM",
    hs_timestamp: dueTimestamp,
  };

  if (owner_id) {
    properties["hubspot_owner_id"] = owner_id;
  }

  const task = await withHubspot((client) =>
    client.crm.objects.tasks.basicApi.create({
      properties,
      associations: [
        {
          to: { id: dealId },
          types: [
            {
              associationCategory:
                AssociationSpecAssociationCategoryEnum.HubspotDefined,
              associationTypeId: 216,
            },
          ],
        },
      ],
    })
  );

  const taskUrl = `https://app.hubspot.com/contacts/${task.id}`;

  return Response.json({ taskId: task.id, taskUrl });
}
