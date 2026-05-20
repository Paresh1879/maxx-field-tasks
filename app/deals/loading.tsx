export default function DashboardLoading() {
  return (
    <div style={{ minHeight: "100vh", background: "#f4f8fb" }}>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }`}</style>
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "0 16px" }}>
        <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: 16, marginBottom: 8 }}>
          <div style={{ height: 32, width: 72, background: "#dce4ec", borderRadius: 10, animation: "pulse 1.5s ease infinite" }} />
        </div>
        <div style={{ textAlign: "center", padding: "24px 0 32px" }}>
          <div style={{ width: 64, height: 64, borderRadius: 18, background: "#dce4ec", margin: "0 auto 16px", animation: "pulse 1.5s ease infinite" }} />
          <div style={{ height: 28, width: 200, background: "#dce4ec", borderRadius: 10, margin: "0 auto 12px", animation: "pulse 1.5s ease infinite" }} />
          <div style={{ height: 16, width: 280, background: "#eaf2f8", borderRadius: 8, margin: "0 auto", animation: "pulse 1.5s ease infinite" }} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} style={{ background: "#fff", borderRadius: 16, border: "1px solid #dce4ec", padding: 24, animation: "pulse 1.5s ease infinite", height: 160 }} />
          ))}
        </div>
      </div>
    </div>
  );
}
