import { Client } from "@hubspot/api-client";
import { getSession } from "@/lib/session";

async function refreshTokens(refreshToken: string) {
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    client_id: process.env.HUBSPOT_CLIENT_ID!,
    client_secret: process.env.HUBSPOT_CLIENT_SECRET!,
    refresh_token: refreshToken,
  });

  const res = await fetch("https://api.hubapi.com/oauth/v1/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!res.ok) throw new Error("HubSpot token refresh failed — re-auth required");

  const data = await res.json();
  return {
    accessToken: data.access_token as string,
    refreshToken: data.refresh_token as string,
    expiresAt: Date.now() + (data.expires_in as number) * 1000,
  };
}

function is401(err: unknown): boolean {
  if (typeof err !== "object" || err === null) return false;
  const e = err as Record<string, unknown>;
  return (
    e["statusCode"] === 401 ||
    e["code"] === 401 ||
    (typeof e["response"] === "object" &&
      e["response"] !== null &&
      (e["response"] as Record<string, unknown>)["status"] === 401)
  );
}

/**
 * For Server Components — read-only, no cookie writes.
 * If the token is missing or expired, throws "Not authenticated".
 * Callers should catch and redirect to /login.
 */
export async function getHubspotClient(): Promise<Client> {
  const session = await getSession();
  if (!session.accessToken) throw new Error("Not authenticated");
  if (Date.now() > session.expiresAt) throw new Error("Not authenticated");
  return new Client({ accessToken: session.accessToken });
}

/**
 * For Route Handlers — full refresh + save on 401.
 * Proactively refreshes if the token expires within 60 s.
 * Throws "Not authenticated" if there is no session at all.
 */
export async function withHubspot<T>(fn: (client: Client) => Promise<T>): Promise<T> {
  const session = await getSession();

  if (!session.accessToken) {
    throw new Error("Not authenticated");
  }

  // Proactive refresh: token expires within 60 seconds
  if (Date.now() > session.expiresAt - 60_000) {
    const fresh = await refreshTokens(session.refreshToken);
    session.accessToken = fresh.accessToken;
    session.refreshToken = fresh.refreshToken;
    session.expiresAt = fresh.expiresAt;
    await session.save();
  }

  const client = new Client({ accessToken: session.accessToken });

  try {
    return await fn(client);
  } catch (err) {
    if (!is401(err)) throw err;

    // Token expired mid-call — refresh and retry once
    const fresh = await refreshTokens(session.refreshToken);
    session.accessToken = fresh.accessToken;
    session.refreshToken = fresh.refreshToken;
    session.expiresAt = fresh.expiresAt;
    await session.save();

    return await fn(new Client({ accessToken: session.accessToken }));
  }
}
