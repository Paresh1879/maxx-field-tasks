"use client";

import { useState, useMemo, useCallback } from "react";
import Link from "next/link";

type Deal = {
  id: string;
  properties: {
    dealname?: string;
    dealstage?: string;
    amount?: string;
    closedate?: string;
  };
};

function formatCurrency(amount?: string) {
  if (!amount) return null;
  const n = parseFloat(amount);
  if (isNaN(n)) return null;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

function formatDate(dateStr?: string) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function DealsClient({ deals }: { deals: Deal[] }) {
  const PAGE_SIZE = 20;
  const [search, setSearch] = useState("");
  const [sortAsc, setSortAsc] = useState(true);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const handleSearch = useCallback((v: string) => {
    setSearch(v);
    setVisibleCount(PAGE_SIZE);
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const result = q
      ? deals.filter((d) =>
          (d.properties.dealname ?? "").toLowerCase().includes(q)
        )
      : [...deals];

    result.sort((a, b) => {
      const da = a.properties.closedate
        ? new Date(a.properties.closedate).getTime()
        : 0;
      const db = b.properties.closedate
        ? new Date(b.properties.closedate).getTime()
        : 0;
      return sortAsc ? da - db : db - da;
    });

    return result;
  }, [deals, search, sortAsc]);

  return (
    <>
      {/* Controls */}
      <div className="flex gap-2 mb-5">
        <div className="relative flex-1">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
            />
          </svg>
          <input
            type="text"
            placeholder="Search deals..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
        </div>
        <button
          onClick={() => setSortAsc((v) => !v)}
          className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 bg-white shrink-0 active:bg-gray-50 transition"
        >
          <svg
            className="w-4 h-4 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"
            />
          </svg>
          {sortAsc ? "Date ↑" : "Date ↓"}
        </button>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <p className="text-gray-400 text-center mt-16">No deals found.</p>
      ) : (
        <>
          <ul className="space-y-3">
            {filtered.slice(0, visibleCount).map((deal) => {
              const name = deal.properties.dealname ?? "Unnamed Deal";
              const amount = formatCurrency(deal.properties.amount);
              const closeDate = formatDate(deal.properties.closedate);
              const stage = deal.properties.dealstage;

              return (
                <li key={deal.id}>
                  <Link
                    href={`/deals/${deal.id}/new`}
                    className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white px-4 py-4 shadow-sm active:bg-gray-50 transition"
                  >
                    <div className="shrink-0 w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                      <span className="text-indigo-600 font-bold text-sm">
                        {name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-base leading-snug truncate">
                        {name}
                      </p>
                      <div className="flex flex-wrap gap-2 mt-0.5 text-sm text-gray-400 items-center">
                        {amount && (
                          <span className="font-medium text-emerald-600">{amount}</span>
                        )}
                        {closeDate && <span>Closes {closeDate}</span>}
                        {stage && (
                          <span className="px-1.5 py-0.5 rounded-md bg-gray-100 text-gray-500 text-xs">
                            {stage}
                          </span>
                        )}
                      </div>
                    </div>
                    <svg
                      className="shrink-0 text-gray-300 w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </Link>
                </li>
              );
            })}
          </ul>
          {visibleCount < filtered.length && (
            <button
              onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
              className="w-full mt-4 py-3 rounded-2xl border border-gray-200 text-sm text-gray-500 active:bg-gray-50 transition"
            >
              Load more ({filtered.length - visibleCount} remaining)
            </button>
          )}
        </>
      )}
    </>
  );
}
