import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session?.accessToken) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const params = new URLSearchParams(searchParams);
  params.set("version", "2.1");

  try {
    const res = await fetch(`https://npiregistry.cms.hhs.gov/api/?${params}`, {
      signal: AbortSignal.timeout(8000),
    });
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: "NPPES request failed", results: [] }, { status: 502 });
  }
}
