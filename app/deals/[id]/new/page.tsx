import { redirect } from "next/navigation";
import Link from "next/link";
import { withHubspot } from "@/lib/hubspot";
import TaskDraftForm from "./TaskDraftForm";

async function getDealName(dealId: string): Promise<string> {
  const deal = await withHubspot((client) =>
    client.crm.deals.basicApi.getById(dealId, ["dealname"])
  );
  return deal.properties["dealname"] ?? "this deal";
}

export default async function NewTaskPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let dealName = "this deal";
  try {
    dealName = await getDealName(id);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "";
    if (msg === "Not authenticated" || msg.includes("refresh failed")) {
      redirect("/login");
    }
  }

  return (
    <main className="flex-1 px-4 py-6 max-w-lg mx-auto w-full">
      <Link
        href="/deals"
        className="text-sm text-blue-600 mb-4 inline-block"
      >
        ← Back to deals
      </Link>
      <h1 className="text-xl font-bold mb-1 leading-snug">{dealName}</h1>
      <p className="text-gray-500 text-sm mb-6">
        Describe your visit and Claude will draft the task.
      </p>

      <TaskDraftForm dealId={id} dealName={dealName} />
    </main>
  );
}
