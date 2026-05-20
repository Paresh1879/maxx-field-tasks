"use client";

import { useState } from "react";
import Image from "next/image";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);

  return (
    <main className="min-h-screen flex flex-col" style={{ background: "#f4f8fb" }}>
      {/* Gradient top band */}
      <div style={{ background: "linear-gradient(150deg, #0c2d48 0%, #1565a0 60%, #2e86c1 100%)", padding: "48px 24px 72px" }} />

      {/* Card */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", padding: "0 24px 48px", marginTop: -48 }}>
        <div style={{
          background: "#fff", borderRadius: 20, border: "1px solid #dce4ec",
          boxShadow: "0 4px 24px rgba(12,45,72,0.08)",
          padding: "36px 32px", width: "100%", maxWidth: 400, textAlign: "center",
        }}>
          <Image
            src="/logo.png"
            alt="Maxx Orthopedics"
            width={160}
            height={80}
            style={{ height: "auto", display: "block", margin: "0 auto 24px" }}
            priority
          />
          <p style={{ color: "#6b7280", fontSize: 15, marginBottom: 28, lineHeight: 1.5 }}>
            Sign in to log tasks and notes from the field.
          </p>
          <a
            href="/api/auth/login"
            onClick={() => setLoading(true)}
            style={{
              display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
              background: loading ? "#5dade2" : "#1565a0",
              color: "#fff", fontWeight: 700, fontSize: 15,
              padding: "14px 32px", borderRadius: 12, textDecoration: "none",
              transition: "all 0.15s", pointerEvents: loading ? "none" : "auto",
              width: "100%",
            }}
          >
            {loading ? (
              <>
                <span style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "#fff", display: "inline-block", animation: "spin 0.7s linear infinite" }} />
                Connecting…
              </>
            ) : (
              "Connect HubSpot"
            )}
          </a>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </main>
  );
}
