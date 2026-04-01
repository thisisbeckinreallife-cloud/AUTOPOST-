export default function Custom404() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "sans-serif" }}>
      <div style={{ textAlign: "center" }}>
        <h1 style={{ fontSize: "4rem", color: "#cbd5e1", margin: 0 }}>404</h1>
        <p style={{ color: "#64748b" }}>Page not found</p>
        <a href="/dashboard" style={{ color: "#ec4899", fontSize: "0.875rem" }}>Go to Dashboard</a>
      </div>
    </div>
  );
}
