import { HUBSPOT_API_BASE, refreshSessionIfNeeded, getServiceKey } from "@/lib/hubspot";

export async function POST(request: Request) {
  const authed = await refreshSessionIfNeeded();
  if (!authed) return Response.json({ error: "Not authenticated" }, { status: 401 });

  let serviceKey: string;
  try {
    serviceKey = await getServiceKey();
  } catch {
    return Response.json({ error: "Service key not configured for this portal" }, { status: 500 });
  }

  const { firstname, lastname, email, jobtitle, dealId } = await request.json();

  if (!firstname?.trim() && !email?.trim()) {
    return Response.json({ error: "firstname or email is required" }, { status: 400 });
  }

  const properties: Record<string, string> = {};
  if (firstname?.trim()) properties.firstname = firstname.trim();
  if (lastname?.trim()) properties.lastname = lastname.trim();
  if (email?.trim()) properties.email = email.trim().toLowerCase();
  if (jobtitle?.trim()) properties.jobtitle = jobtitle.trim();

  const body: Record<string, unknown> = { properties };
  if (dealId) {
    body.associations = [{
      to: { id: String(dealId) },
      types: [{ associationCategory: "HUBSPOT_DEFINED", associationTypeId: 4 }],
    }];
  }

  const res = await fetch(`${HUBSPOT_API_BASE}/crm/v3/objects/contacts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${serviceKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.error("HubSpot contact create error:", err);
    if (err?.category === "MISSING_SCOPES") {
      return Response.json(
        { error: "Missing scope: add crm.objects.contacts.write to your HubSpot private app." },
        { status: 403 }
      );
    }
    if (err?.category === "CONFLICT") {
      return Response.json(
        { error: "A contact with this email already exists in HubSpot." },
        { status: 409 }
      );
    }
    return Response.json({ error: "Failed to create contact" }, { status: 502 });
  }

  const data = await res.json();
  return Response.json({ contactId: data.id });
}
