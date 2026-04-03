import { Sidebar } from "@/components/admin/sidebar";

export const dynamic = "force-dynamic";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-surface-primary bg-dots">
      <Sidebar />
      <main className="md:ml-64 p-6 md:p-10 pt-16 md:pt-10 min-h-screen">
        <div className="max-w-5xl mx-auto animate-fade-in">{children}</div>
      </main>
    </div>
  );
}
