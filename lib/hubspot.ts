import { Client } from "@hubspot/api-client";
import { getSession } from "@/lib/session";

export const HUBSPOT_API_BASE = "https://api.hubapi.com";

export async function getHubspotClient(): Promise<Client> {
  const session = await getSession();
  if (!session.accessToken) throw new Error("Not authenticated");
  if (Date.now() > session.expiresAt - 60_000) throw new Error("Not authenticated");
  return new Client({ accessToken: session.accessToken });
}

// For use in Route Handlers only — refreshes the token if near expiry and saves the cookie.
// Returns false if there is no session or refresh fails (caller should return 401).
export async function refreshSessionIfNeeded(): Promise<boolean> {
  const session = await getSession();
  if (!session.accessToken) return false;
  if (Date.now() <= session.expiresAt - 60_000) {
    await session.save(); // reset the 30-min inactivity timer on each active request
    return true;
  }

  try {
    const body = new URLSearchParams({
      grant_type: "refresh_token",
      client_id: process.env.HUBSPOT_CLIENT_ID!,
      client_secret: process.env.HUBSPOT_CLIENT_SECRET!,
      refresh_token: session.refreshToken,
    });
    const res = await fetch(`${HUBSPOT_API_BASE}/oauth/v1/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });
    if (!res.ok) {
      session.accessToken = "";
      session.refreshToken = "";
      session.expiresAt = 0;
      await session.save();
      return false;
    }
    const data = await res.json();
    session.accessToken = data.access_token;
    session.refreshToken = data.refresh_token;
    session.expiresAt = Date.now() + data.expires_in * 1000;
    await session.save();
    return true;
  } catch {
    return false;
  }
}
