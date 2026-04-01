import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Building2, CheckCircle, Clock, XCircle, FileUp } from "lucide-react";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  await requireSession();

  const [businesses, totalPosts, scheduledPosts, failedPosts, recentLogs] =
    await Promise.all([
      db.business.count({ where: { isActive: true } }),
      db.postDraft.count(),
      db.postDraft.count({ where: { status: "SCHEDULED" } }),
      db.postDraft.count({ where: { status: "FAILED" } }),
      db.auditLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
          business: { select: { name: true, slug: true } },
        },
      }),
    ]);

  const publishedPosts = await db.postDraft.count({
    where: { status: "PUBLISHED" },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 mt-1">Overview of your Instagram scheduling system</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Active Businesses"
          value={businesses}
          icon={<Building2 className="h-5 w-5 text-brand-500" />}
          href="/businesses"
        />
        <StatCard
          label="Published Posts"
          value={publishedPosts}
          icon={<CheckCircle className="h-5 w-5 text-green-500" />}
        />
        <StatCard
          label="Scheduled"
          value={scheduledPosts}
          icon={<Clock className="h-5 w-5 text-blue-500" />}
        />
        <StatCard
          label="Failed Posts"
          value={failedPosts}
          icon={<XCircle className="h-5 w-5 text-red-500" />}
        />
      </div>

      {/* Recent activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {recentLogs.length === 0 ? (
            <p className="text-slate-400 text-sm">No activity yet.</p>
          ) : (
            <div className="space-y-3">
              {recentLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start justify-between py-2 border-b border-slate-100 last:border-0"
                >
                  <div>
                    <span className="font-mono text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                      {log.action}
                    </span>
                    {log.business && (
                      <Link
                        href={`/businesses/${log.business.slug}`}
                        className="ml-2 text-sm text-brand-600 hover:underline"
                      >
                        {log.business.name}
                      </Link>
                    )}
                    {log.entityId && (
                      <span className="ml-2 text-xs text-slate-400">
                        {log.entityType} {log.entityId.slice(0, 8)}...
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-slate-400 whitespace-nowrap ml-4">
                    {formatDate(log.createdAt)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  href,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  href?: string;
}) {
  const content = (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500">{label}</p>
            <p className="text-3xl font-bold text-slate-900 mt-1">{value}</p>
          </div>
          {icon}
        </div>
      </CardContent>
    </Card>
  );

  if (href) return <Link href={href}>{content}</Link>;
  return content;
}
