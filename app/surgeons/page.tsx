import { redirect } from "next/navigation";
import Link from "next/link";
import { getHubspotClient } from "@/lib/hubspot";
import SurgeonsClient, { type Contact } from "./SurgeonsClient";

// Keywords that indicate a surgeon / physician in job title or name
const SURGEON_TITLE_KEYWORDS = [
  "surgeon", "surgery", "orthopedic", "orthopaedic", "ortho",
  "physician", "doctor", "spine", "sports medicine", "trauma",
  "joint", "arthroplasty", "reconstructive", "podiatrist", "podiatry",
  "neurosurgeon", "neurosurgery", "cardiac", "thoracic", "vascular",
  "oncologist", "urologist", "gastroenterologist", "cardiologist",
];
const CREDENTIAL_PATTERN = /\b(md|do|mbbs|ms|dpm|phd)\b/i;
const DR_PREFIX = /^dr\.?\s/i;

function isSurgeon(c: Contact): boolean {
  const title = c.jobtitle.toLowerCase();
  const fullName = `${c.firstname} ${c.lastname}`.toLowerCase();
  if (SURGEON_TITLE_KEYWORDS.some((k) => title.includes(k))) return true;
  if (CREDENTIAL_PATTERN.test(title)) return true;
  if (CREDENTIAL_PATTERN.test(fullName)) return true;
  if (DR_PREFIX.test(c.firstname) || DR_PREFIX.test(c.lastname)) return true;
  return false;
}

async function getContacts(): Promise<Contact[]> {
  const client = await getHubspotClient();
  const res = await client.crm.contacts.searchApi.doSearch({
    filterGroups: [],
    properties: ["firstname", "lastname", "email", "phone", "jobtitle", "company"],
    sorts: ["-lastmodifieddate"],
    limit: 200,
    after: "0",
  });

  return (res.results ?? []).map((c) => ({
    id: c.id,
    firstname: c.properties.firstname ?? "",
    lastname: c.properties.lastname ?? "",
    email: c.properties.email ?? "",
    phone: c.properties.phone ?? "",
    jobtitle: c.properties.jobtitle ?? "",
    company: c.properties.company ?? "",
  }));
}

export default async function SurgeonsPage() {
  let contacts: Contact[] = [];
  try {
    contacts = await getContacts();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "";
    if (msg === "Not authenticated" || msg.includes("refresh failed")) redirect("/login");
  }

  const surgeons = contacts.filter(isSurgeon);
  const others = contacts.filter((c) => !isSurgeon(c));

  return (
    <div className="min-h-screen" style={{ background: "#f4f8fb" }}>
      <div style={{ background: "linear-gradient(150deg, #0c2d48 0%, #2e7d32 60%, #388e3c 100%)" }}>
        <div className="max-w-lg mx-auto px-4 py-4">
          <Link
            href="/deals"
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.8)",
              background: "rgba(255,255,255,0.12)", borderRadius: 8,
              padding: "6px 12px", textDecoration: "none", marginBottom: 14,
            }}
          >
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Dashboard
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: "rgba(255,255,255,0.15)", display: "flex",
              alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 800, color: "#fff", letterSpacing: -0.3 }}>Surgeons</h1>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.65)", marginTop: 2 }}>
                {surgeons.length} surgeon{surgeons.length !== 1 ? "s" : ""} · {others.length} other contact{others.length !== 1 ? "s" : ""} hidden
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-4 pb-12">
        <SurgeonsClient surgeons={surgeons} others={others} />
      </div>
    </div>
  );
}
