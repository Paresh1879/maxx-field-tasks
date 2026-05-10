import Link from "next/link";

export default async function DonePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ taskId?: string; taskUrl?: string }>;
}) {
  const { id } = await params;
  const { taskId, taskUrl } = await searchParams;

  const hubspotLink = taskUrl ? decodeURIComponent(taskUrl) : null;

  return (
    <main className="flex-1 flex flex-col items-center justify-center px-6 py-12 max-w-lg mx-auto w-full text-center">
      <div className="text-5xl mb-4">✓</div>

      <h1 className="text-2xl font-bold mb-2">Task saved!</h1>
      <p className="text-gray-500 text-sm mb-8">
        Your follow-up task has been created in HubSpot and linked to this deal.
      </p>

      {taskId && (
        <p className="text-xs text-gray-400 mb-6">Task ID: {taskId}</p>
      )}

      <div className="flex flex-col gap-3 w-full">
        {hubspotLink && (
          <a
            href={hubspotLink}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full rounded-xl bg-orange-500 py-3 text-white font-semibold text-base text-center active:bg-orange-600 transition-colors"
          >
            View task in HubSpot →
          </a>
        )}

        <Link
          href={`/deals/${id}/new`}
          className="w-full rounded-xl border border-gray-300 py-3 text-gray-700 font-semibold text-base text-center active:bg-gray-50 transition-colors"
        >
          Log another task
        </Link>

        <Link
          href="/deals"
          className="w-full rounded-xl border border-gray-200 py-3 text-gray-500 text-base text-center active:bg-gray-50 transition-colors"
        >
          ← Back to deals
        </Link>
      </div>
    </main>
  );
}
