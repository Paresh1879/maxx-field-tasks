"use client";

import { useState } from "react";
import Image from "next/image";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);

  return (
    <main className="min-h-screen bg-white flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-8 pb-8">
        <Image
          src="/logo.png"
          alt="Maxx Orthopedics"
          width={160}
          height={80}
          style={{ height: "auto" }}
          priority
          className="mb-12"
        />
        <p className="text-[#666666] text-base mb-8 text-center">
          Sign in to log tasks and notes from the field.
        </p>
        <a
          href="/api/auth/login"
          onClick={() => setLoading(true)}
          className={`inline-flex items-center justify-center gap-2 bg-[#F97316] text-white font-semibold text-[16px] px-8 py-4 rounded-2xl transition-opacity ${loading ? "opacity-60 pointer-events-none" : ""}`}
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
