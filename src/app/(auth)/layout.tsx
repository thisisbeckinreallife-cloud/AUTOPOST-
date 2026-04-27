export const dynamic = "force-dynamic";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="ap-root min-h-screen"
      style={{ background: "var(--ap-paper)" }}
    >
      {children}
    </div>
  );
}
