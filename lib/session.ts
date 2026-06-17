import { getIronSession, IronSession } from "iron-session";
import { cookies } from "next/headers";

export type SessionData = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  hubId: string;
};

const sessionOptions = {
  cookieName: "maxx_session",
  password: process.env.SESSION_SECRET!,
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: 60 * 30, // 30 minutes of inactivity
  },
};

export async function getSession(): Promise<IronSession<SessionData>> {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, sessionOptions);
}
