export default function DealsListLoading() {
  return (
    <div className="min-h-screen" style={{ background: "#f4f8fb" }}>
      <div style={{ background: "linear-gradient(150deg, #0c2d48 0%, #1565a0 60%, #2e86c1 100%)" }}>
        <div className="max-w-lg mx-auto px-4 pt-4 pb-5">
          <div style={{ height: 28, width: 100, background: "rgba(255,255,255,0.15)", borderRadius: 8, marginBottom: 14 }} />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ height: 28, width: 100, background: "rgba(255,255,255,0.2)", borderRadius: 8 }} />
            <div style={{ height: 28, width: 88, background: "rgba(255,255,255,0.15)", borderRadius: 8 }} />
          </div>
        </div>
      </div>
      <div className="max-w-lg mx-auto px-4 pt-4 pb-12">
        <div style={{ height: 44, background: "#fff", border: "1px solid #dce4ec", borderRadius: 12, marginBottom: 12 }} />
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} style={{ background: "#fff", borderRadius: 14, border: "1px solid #dce4ec", overflow: "hidden" }}>
              <div style={{ padding: "16px" }}>
                <div style={{ height: 16, background: "#eaf2f8", borderRadius: 8, width: "75%", marginBottom: 8, animation: "pulse 1.5s ease infinite" }} />
                <div style={{ height: 12, background: "#eaf2f8", borderRadius: 8, width: "50%", animation: "pulse 1.5s ease infinite" }} />
              </div>
              <div style={{ display: "flex", borderTop: "1px solid #dce4ec" }}>
                <div style={{ flex: 1, height: 46, background: "#f4f8fb", borderRight: "1px solid #dce4ec", animation: "pulse 1.5s ease infinite" }} />
                <div style={{ flex: 1, height: 46, background: "#f4f8fb", animation: "pulse 1.5s ease infinite" }} />
              </div>
            </div>
          ))}
        </div>
      </div>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }`}</style>
    </div>
  );
}
