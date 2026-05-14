"use client";

import { useState } from "react";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-6">
      <div className="w-full max-w-sm text-center space-y-6">
        <h1 className="text-2xl font-semibold text-gray-900">Maxx Field Tasks</h1>
        <p className="text-gray-500 text-sm">
          Turn field meeting notes into HubSpot tasks.
        </p>
        <a
          href="/api/auth/login"
          onClick={() => setLoading(true)}
          className={`flex items-center justify-center gap-2 w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-3 px-6 rounded-xl transition-colors ${loading ? "pointer-events-none opacity-70" : ""}`}
        >
          {loading ? (
            <>
              <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
              Connecting…
            </>
          ) : (
            "Connect HubSpot"
          )}
        </a>
      </div>
    </main>
  );
}
