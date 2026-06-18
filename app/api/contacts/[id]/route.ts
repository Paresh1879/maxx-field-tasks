import { HUBSPOT_API_BASE, refreshSessionIfNeeded } from "@/lib/hubspot";
import { getSession } from "@/lib/session";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authed = await refreshSessionIfNeeded();
  if (!authed) return Response.json({ error: "Not authenticated" }, { status: 401 });

  const { id } = await params;
  const session = await getSession();

  const res = await fetch(
    `${HUBSPOT_API_BASE}/crm/v3/objects/contacts/${id}?properties=firstname,lastname,email,jobtitle,phone,mobilephone`,
    { headers: { Authorization: `Bearer ${session.accessToken}` } }
  );

  if (!res.ok) return Response.json({ error: "Failed to fetch contact" }, { status: 502 });

  const data = await res.json();
  const p = data.properties ?? {};
  return Response.json({
    id: data.id,
    name: [p.firstname, p.lastname].filter(Boolean).join(" ") || p.email || data.id,
    email: p.email ?? null,
    title: p.jobtitle ?? null,
    phone: p.phone ?? p.mobilephone ?? null,
  });
}
