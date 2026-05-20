import { redirect } from "next/navigation";
import { getHubspotClient } from "@/lib/hubspot";
import type { Contact } from "../SurgeonsClient";
import SurgeonProfileClient from "./SurgeonProfileClient";

async function getContact(id: string): Promise<Contact> {
  const client = await getHubspotClient();
  const c = await client.crm.contacts.basicApi.getById(id, [
    "firstname", "lastname", "email", "phone", "jobtitle", "company",
  ]);
  return {
    id: c.id,
    firstname: c.properties.firstname ?? "",
    lastname: c.properties.lastname ?? "",
    email: c.properties.email ?? "",
    phone: c.properties.phone ?? "",
    jobtitle: c.properties.jobtitle ?? "",
    company: c.properties.company ?? "",
  };
}

export default async function SurgeonProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let contact: Contact = { id, firstname: "", lastname: "", email: "", phone: "", jobtitle: "", company: "" };

  try {
    contact = await getContact(id);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "";
    if (msg === "Not authenticated" || msg.includes("refresh failed")) redirect("/login");
  }

  return (
    <div className="min-h-screen" style={{ background: "#f4f8fb" }}>
      <SurgeonProfileClient contact={contact} />
    </div>
  );
}
