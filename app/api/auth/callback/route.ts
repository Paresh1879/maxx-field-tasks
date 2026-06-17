import { redirect } from "next/navigation";
import { HUBSPOT_API_BASE } from "@/lib/hubspot";
import { getSession } from "@/lib/session";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return Response.json({ error: "Missing code" }, { status: 400 });
  }

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: process.env.HUBSPOT_CLIENT_ID!,
    client_secret: process.env.HUBSPOT_CLIENT_SECRET!,
    redirect_uri: process.env.HUBSPOT_REDIRECT_URI!,
    code,
  });

  const res = await fetch(`${HUBSPOT_API_BASE}/oauth/v1/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!res.ok) {
    return Response.json({ error: "Failed to exchange token" }, { status: 502 });
  }

  const tokens = await res.json();

  const infoRes = await fetch(`${HUBSPOT_API_BASE}/oauth/v1/access-tokens/${tokens.access_token}`);
  const info = infoRes.ok ? await infoRes.json() : {};

  const session = await getSession();
  session.accessToken = tokens.access_token;
  session.refreshToken = tokens.refresh_token;
  session.expiresAt = Date.now() + tokens.expires_in * 1000;
  session.hubId = String(info.hub_id ?? "");
  await session.save();

  redirect("/deals");
}
