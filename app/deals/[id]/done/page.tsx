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

  const decoded = taskUrl ? (() => { try { return decodeURIComponent(taskUrl); } catch { return null; } })() : null;
  const hubspotLink = decoded?.startsWith("https://app.hubspot.com/") ? decoded : null;

  return (
    <main className="min-h-screen bg-white flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center pb-8">
        <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-6">
          <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="text-[22px] font-semibold text-[#111111] mb-2">Task saved</h1>
        <p className="text-[15px] text-[#666666] max-w-[260px] leading-relaxed">
          Your follow-up is in HubSpot, linked to this deal.
        </p>
        {taskId && (
          <p className="text-[12px] text-[#cccccc] mt-3">#{taskId}</p>
        )}
      </div>

      <div className="px-5 pb-14 flex flex-col gap-2.5">
        {hubspotLink && (
          <a
            href={hubspotLink}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-4 rounded-xl bg-[#F97316] text-white font-semibold text-[15px] text-center active:opacity-80 transition"
          >
            View in HubSpot
          </a>
        )}
        <Link
          href={`/deals/${id}/new`}
          className="w-full py-3.5 rounded-xl border border-[#ebebeb] text-[#111111] font-medium text-[15px] text-center active:bg-[#FAFAF8] transition"
        >
          Log another task
        </Link>
        <Link
          href="/deals"
          className="w-full py-3 text-[#999999] text-[13px] text-center active:text-[#666666] transition"
        >
          Back to My Deals
        </Link>
      </div>
    </main>
  );
}
