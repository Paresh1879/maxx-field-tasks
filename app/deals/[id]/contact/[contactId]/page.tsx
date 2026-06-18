"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";

type Contact = {
  id: string;
  name: string;
  email: string | null;
  title: string | null;
  phone: string | null;
};

export default function ContactDetailPage() {
  const { id: dealId, contactId } = useParams<{ id: string; contactId: string }>();
  const searchParams = useSearchParams();
  const from = searchParams.get("from");
  const backHref = `/deals/${dealId}/new${from ? `?from=${from}` : ""}`;

  const [contact, setContact] = useState<Contact | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(`/api/contacts/${contactId}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setContact)
      .catch(() => setError(true));
  }, [contactId]);

  const hubspotUrl = `https://app.hubspot.com/contacts/${contactId}`;

  return (
    <div className="min-h-screen" style={{ background: "#f4f8fb" }}>
      <div style={{ background: "linear-gradient(150deg, #0c2d48 0%, #1565a0 60%, #2e86c1 100%)" }}>
        <div className="max-w-lg mx-auto px-4 py-4">
          <Link
            href={backHref}
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
            Back to Deal
          </Link>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: "#fff", letterSpacing: -0.3 }}>
            {contact ? contact.name : "Contact"}
          </h1>
          {contact?.title && (
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.65)", marginTop: 4 }}>{contact.title}</p>
          )}
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-5 pb-12">
        {error && (
          <div style={{ padding: "12px 16px", background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 12 }}>
            <p style={{ fontSize: 13, color: "#dc2626" }}>Could not load contact details.</p>
          </div>
        )}

        {!contact && !error && (
          <div style={{ display: "flex", justifyContent: "center", padding: "48px 0" }}>
            <div style={{ width: 20, height: 20, borderRadius: "50%", border: "2.5px solid #d1d5db", borderTopColor: "#1565a0", animation: "spin 0.7s linear infinite" }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {contact && (
          <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #dce4ec", overflow: "hidden" }}>
            <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 14 }}>

              {/* Avatar + name */}
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: "50%", background: "#e8f0f8",
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  <span style={{ fontSize: 18, fontWeight: 700, color: "#1565a0" }}>
                    {contact.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p style={{ fontSize: 16, fontWeight: 700, color: "#0c2d48" }}>{contact.name}</p>
                  {contact.title && <p style={{ fontSize: 13, color: "#64748b" }}>{contact.title}</p>}
                </div>
              </div>

              {(contact.email || contact.phone) && (
                <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: 14, display: "flex", flexDirection: "column", gap: 10 }}>
                  {contact.email && (
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#94a3b8" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <a href={`mailto:${contact.email}`} style={{ fontSize: 14, color: "#1565a0", textDecoration: "none" }}>
                        {contact.email}
                      </a>
                    </div>
                  )}
                  {contact.phone && (
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#94a3b8" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <a href={`tel:${contact.phone}`} style={{ fontSize: 14, color: "#1565a0", textDecoration: "none" }}>
                        {contact.phone}
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>

            <a
              href={hubspotUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                padding: "14px 16px", background: "#f8fafc", borderTop: "1px solid #e2e8f0",
                fontSize: 13, fontWeight: 600, color: "#1565a0", textDecoration: "none",
              }}
            >
              View in HubSpot
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
