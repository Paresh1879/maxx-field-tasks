import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getSession } from "@/lib/session";
import UrgentItems from "./UrgentItems";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session?.accessToken) redirect("/login");

  const TOOLS = [
    {
      href: "/deals/list",
      title: "My Deals",
      description: "View open deals, activity history, and pipeline status",
      color: "#1565a0",
      bg: "linear-gradient(135deg, #e8f0fe 0%, #d0e3fa 100%)",
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="7" width="20" height="14" rx="2" />
          <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
          <line x1="12" y1="12" x2="12" y2="16" />
          <line x1="10" y1="14" x2="14" y2="14" />
        </svg>
      ),
    },
    {
      href: "/deals/all",
      title: "All Deals",
      description: "See every open deal across the team — owners, surgeons, and activity",
      color: "#6a1b9a",
      bg: "linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%)",
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
    },
    {
      href: "/npi-lookup",
      title: "NPI Lookup",
      description: "Search ortho, podiatry & trauma providers by name, NPI, or specialty",
      color: "#1565a0",
      bg: "linear-gradient(135deg, #e8f0fe 0%, #d0e3fa 100%)",
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      ),
    },
    {
      href: "/open-payments",
      title: "Open Payments",
      description: "Ask questions about industry payments to providers — powered by AI",
      color: "#2e7d32",
      bg: "linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)",
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="1" x2="12" y2="23" />
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      ),
    },
    {
      href: "/volume",
      title: "Volume Intelligence",
      description: "Ask questions about surgical case volume — powered by AI",
      color: "#7b1fa2",
      bg: "linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%)",
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
      ),
    },
    {
      href: "/target-lists",
      title: "Target Lists",
      description: "Cross-reference volume and payment data to build targeted surgeon lists",
      color: "#00695c",
      bg: "linear-gradient(135deg, #e0f2f1 0%, #b2dfdb 100%)",
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="12" r="6" />
          <circle cx="12" cy="12" r="2" />
        </svg>
      ),
    },
    {
      href: "/surgeon-profile",
      title: "Surgeon Profile",
      description: "One-page competitive intelligence report with payments, volume, and bio",
      color: "#0d47a1",
      bg: "linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)",
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
      ),
    },
    {
      href: "/networks",
      title: "Networks",
      description: "Discover surgeon affiliations through shared facilities and practice networks",
      color: "#455a64",
      bg: "linear-gradient(135deg, #eceff1 0%, #cfd8dc 100%)",
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="5" r="3" />
          <circle cx="5" cy="19" r="3" />
          <circle cx="19" cy="19" r="3" />
          <line x1="12" y1="8" x2="5" y2="16" />
          <line x1="12" y1="8" x2="19" y2="16" />
          <line x1="5" y1="19" x2="19" y2="19" />
        </svg>
      ),
    },
    {
      href: "/comparison",
      title: "Comparison",
      description: "Compare 2-3 surgeons side by side on volume, payments, and facilities",
      color: "#e65100",
      bg: "linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)",
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="7" height="16" rx="1" />
          <rect x="14" y="4" width="7" height="16" rx="1" />
          <line x1="3" y1="10" x2="10" y2="10" />
          <line x1="14" y1="10" x2="21" y2="10" />
          <line x1="3" y1="15" x2="10" y2="15" />
          <line x1="14" y1="15" x2="21" y2="15" />
        </svg>
      ),
    },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#f4f8fb", fontFamily: "var(--font-outfit), sans-serif" }}>
      <style>{`
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        .dash-card {
          all: unset; box-sizing: border-box; cursor: pointer;
          display: flex; flex-direction: column; align-items: flex-start;
          padding: 24px 20px; background: #fff; border-radius: 16px;
          border: 1px solid #dce4ec; box-shadow: 0 1px 3px rgba(0,0,0,0.04);
          transition: all 0.25s cubic-bezier(0.4,0,0.2,1);
          -webkit-tap-highlight-color: transparent;
          animation: fadeInUp 0.5s ease both; text-decoration: none;
        }
        .dash-card:hover { box-shadow: 0 8px 24px rgba(12,45,72,0.10); transform: translateY(-4px); }
        @media (max-width: 480px) {
          .dash-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 10px !important; }
          .dash-card { padding: 14px 12px !important; border-radius: 12px !important; }
          .dash-icon { width: 40px !important; height: 40px !important; border-radius: 10px !important; margin-bottom: 10px !important; }
          .dash-icon svg { width: 20px !important; height: 20px !important; }
          .dash-title { font-size: 14px !important; margin-bottom: 4px !important; }
          .dash-desc { font-size: 12px !important; }
          .dash-cta { display: none !important; }
        }
      `}</style>

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "0 16px 48px" }}>

        {/* Sign out */}
        <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: 16, position: "relative" }}>
          <form action="/api/auth/logout" method="POST">
            <button type="submit" style={{
              background: "#fff", border: "1px solid #dce4ec", borderRadius: 10,
              color: "#6b7280", padding: "7px 14px", cursor: "pointer",
              fontFamily: "inherit", fontSize: 13, fontWeight: 600,
              display: "flex", alignItems: "center", gap: 6,
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            }}>
              Sign out
            </button>
          </form>
        </div>

        {/* Hero */}
        <div style={{ textAlign: "center", padding: "24px 0 32px", position: "relative" }}>
          <Image
            src="/logo.png"
            alt="Maxx Orthopedics"
            width={160}
            height={80}
            style={{ height: "auto", display: "block", margin: "0 auto 16px" }}
            priority
          />
          <div style={{ fontSize: 15, color: "#6b7280", marginTop: 4, maxWidth: 380, margin: "4px auto 0", lineHeight: 1.5 }}>
            Log tasks, add notes, and manage deals from the field
          </div>
        </div>

        {/* Urgent items — overdue & due this week */}
        <UrgentItems />

        {/* Tool cards */}
        <div className="dash-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, position: "relative" }}>
          {TOOLS.map((tool, idx) => (
            <Link
              key={tool.href + tool.title}
              href={tool.href}
              className="dash-card"
              style={{ animationDelay: `${idx * 0.08}s`, color: "inherit" }}
            >
              <div className="dash-icon" style={{
                width: 52, height: 52, borderRadius: 14,
                background: tool.bg, color: tool.color,
                display: "flex", alignItems: "center", justifyContent: "center",
                marginBottom: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                flexShrink: 0,
              }}>
                {tool.icon}
              </div>
              <div className="dash-title" style={{ fontSize: 16, fontWeight: 700, color: "#0c2d48", marginBottom: 6 }}>
                {tool.title}
              </div>
              <div className="dash-desc" style={{ fontSize: 14, color: "#6b7280", lineHeight: 1.5, flex: 1 }}>
                {tool.description}
              </div>
              <div className="dash-cta" style={{ marginTop: 16, fontSize: 12, fontWeight: 700, color: tool.color, display: "flex", alignItems: "center", gap: 4 }}>
                Get started
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </div>
            </Link>
          ))}
        </div>

        {/* Footer */}
        <footer style={{ marginTop: 48, paddingTop: 20, borderTop: "1px solid #dce4ec", textAlign: "center", position: "relative" }}>
          <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.8 }}>
            <div style={{ fontWeight: 700, color: "#0c2d48", fontSize: 14 }}>Maxx HubApp</div>
            <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>© 2026 Maxx Orthopedics. All rights reserved.</div>
            <div style={{ marginTop: 8 }}>
              <a href="https://maxxortho.com/privacy-policy/" target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: "#1565a0", textDecoration: "none" }}>Privacy Policy</a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
