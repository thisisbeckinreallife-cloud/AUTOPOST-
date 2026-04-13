import { Sidebar } from "@/components/admin/sidebar";

export const dynamic = "force-dynamic";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-surface-primary relative">
      {/* Subtle background atmosphere */}
      <div className="fixed inset-0 bg-gradient-mesh pointer-events-none opacity-50" />
      <Sidebar />
      <main className="md:ml-64 p-5 md:p-8 pt-16 md:pt-8 min-h-screen relative">
        <div className="max-w-4xl mx-auto animate-fade-in">{children}</div>
      </main>
    </div>
  );
}
