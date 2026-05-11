import { Client } from "@hubspot/api-client";
import { getSession } from "@/lib/session";

export async function getHubspotClient(): Promise<Client> {
  const session = await getSession();
  if (!session.accessToken) throw new Error("Not authenticated");
  if (Date.now() > session.expiresAt - 60_000) throw new Error("Not authenticated");
  return new Client({ accessToken: session.accessToken });
}
