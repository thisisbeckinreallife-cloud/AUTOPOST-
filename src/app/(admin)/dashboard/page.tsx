import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import Link from "next/link";
import { formatDateInTz } from "@/lib/utils";
import {
  CheckCircle,
  Clock,
  AlertCircle,
  Upload,
  Plus,
  ArrowRight,
  Zap,
} from "lucide-react";
import { Card } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  await requireSession();

  const businesses = await db.business.findMany({
    include: { metaConnection: true },
    orderBy: { createdAt: "desc" },
  });

  const now = new Date();
  const upcomingPosts = await db.postDraft.findMany({
    where: {
      publishAt: { gte: now },
      status: { in: ["SCHEDULED", "READY", "VALIDATED"] },
    },
    include: { business: true },
    orderBy: { publishAt: "asc" },
    take: 10,
  });

  const todayPublished = await db.postDraft.count({
    where: {
      status: "PUBLISHED",
      publishAt: { gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()) },
    },
  });

  const failedPosts = await db.postDraft.count({ where: { status: "FAILED" } });

  const hasBusinesses = businesses.length > 0;
  const hasConnected = businesses.some((b) => b.metaConnection?.status === "ACTIVE");
  const hasContent = upcomingPosts.length > 0;

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Hola!</h1>
        <p className="text-slate-500 mt-1">Aqui tienes un resumen de tus publicaciones</p>
      </div>

      {/* Onboarding steps */}
      {(!hasBusinesses || !hasConnected || !hasContent) && (
        <Card className="p-6 bg-gradient-to-br from-brand-500/5 to-surface-card border-brand-500/10">
          <h2 className="font-semibold text-slate-100 text-lg mb-1">Empecemos</h2>
          <p className="text-slate-500 text-sm mb-5">Sigue estos pasos para programar tus primeras publicaciones</p>
          <div className="space-y-3">
            <OnboardStep
              n={1} done={hasBusinesses}
              title="Anade tu cuenta de Instagram"
              desc="Registra la cuenta que quieres gestionar"
              href="/businesses/new" cta="Anadir"
            />
            <OnboardStep
              n={2} done={hasConnected}
              title="Conecta tu Instagram"
              desc="Autoriza a AutoPost para publicar en tu nombre"
              href={businesses[0] ? `/businesses/${businesses[0].slug}/connect` : "/businesses/new"}
              cta="Conectar" disabled={!hasBusinesses}
            />
            <OnboardStep
              n={3} done={hasContent}
              title="Sube el contenido del mes"
              desc="Sube una carpeta ZIP con tus posts y fechas"
              href={businesses[0] ? `/businesses/${businesses[0].slug}/upload` : "/businesses/new"}
              cta="Subir" disabled={!hasConnected}
            />
          </div>
        </Card>
      )}

      {/* Stats */}
      {hasContent && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10">
                <Clock className="h-3.5 w-3.5 text-blue-400" />
              </div>
              <span className="text-xs text-slate-500">Proximas</span>
            </div>
            <p className="text-3xl font-bold text-slate-100">{upcomingPosts.length}</p>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-green-500/10">
                <CheckCircle className="h-3.5 w-3.5 text-green-400" />
              </div>
              <span className="text-xs text-slate-500">Publicados hoy</span>
            </div>
            <p className="text-3xl font-bold text-slate-100">{todayPublished}</p>
          </Card>
          <Card className={`p-4 ${failedPosts > 0 ? "border-red-500/20" : ""}`}>
            <div className="flex items-center gap-2 mb-2">
              <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${failedPosts > 0 ? "bg-red-500/10" : "bg-slate-500/10"}`}>
                <AlertCircle className={`h-3.5 w-3.5 ${failedPosts > 0 ? "text-red-400" : "text-slate-500"}`} />
              </div>
              <span className="text-xs text-slate-500">Con errores</span>
            </div>
            <p className="text-3xl font-bold text-slate-100">{failedPosts}</p>
          </Card>
        </div>
      )}

      {/* Quick action */}
      {hasConnected && businesses[0] && (
        <Link
          href={`/businesses/${businesses[0].slug}/upload`}
          className="group flex items-center gap-4 rounded-xl border border-brand-500/20 bg-gradient-to-r from-brand-500/5 to-transparent p-5 hover:border-brand-500/40 hover:shadow-glow transition-all duration-200"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/10 group-hover:bg-brand-500/20 transition-colors">
            <Zap className="h-5 w-5 text-brand-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-slate-100">Subir contenido</p>
            <p className="text-xs text-slate-500">Sube un ZIP con tus posts del mes</p>
          </div>
          <ArrowRight className="h-4 w-4 text-slate-600 group-hover:text-brand-400 group-hover:translate-x-0.5 transition-all" />
        </Link>
      )}

      {/* Upcoming posts */}
      {upcomingPosts.length > 0 && (
        <div>
          <h2 className="text-base font-semibold text-slate-200 mb-3">Proximas publicaciones</h2>
          <div className="space-y-2">
            {upcomingPosts.map((post) => (
              <Link
                key={post.id}
                href={`/businesses/${post.business.slug}/posts/${post.id}`}
                className="flex items-center gap-4 rounded-lg border border-slate-800 bg-surface-card px-4 py-3 hover:border-slate-700 hover:bg-surface-hover transition-all duration-150"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-200 truncate">
                    {post.caption?.slice(0, 80) || "Sin texto"}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">{post.business.name}</p>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-500 shrink-0">
                  <Clock className="h-3 w-3" />
                  {formatDateInTz(post.publishAt, post.business.timezone ?? "UTC")}
                </div>
                <StatusPill status={post.status} />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {hasConnected && !hasContent && (
        <div className="text-center py-20 rounded-2xl border border-dashed border-slate-800 bg-surface-card/50 animate-fade-in">
          <div className="w-16 h-16 rounded-full bg-brand-500/10 flex items-center justify-center mx-auto mb-4">
            <Upload className="h-8 w-8 text-brand-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-200 mb-1">Tu calendario esta vacio</h3>
          <p className="text-slate-500 text-sm mb-6 max-w-xs mx-auto">Sube el contenido del mes y AutoPost se encarga de publicar por ti</p>
          {businesses[0] && (
            <Link
              href={`/businesses/${businesses[0].slug}/upload`}
              className="inline-flex items-center gap-2 bg-brand-500 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-brand-400 hover:shadow-glow transition-all"
            >
              <Plus className="h-4 w-4" />
              Subir contenido
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

function OnboardStep({ n, done, title, desc, href, cta, disabled }: {
  n: number; done: boolean; title: string; desc: string; href: string; cta: string; disabled?: boolean;
}) {
  return (
    <div className={`flex items-center gap-4 rounded-lg px-4 py-3 border transition-colors ${done ? "border-green-500/20 bg-green-500/5" : "border-slate-800 bg-surface-primary"}`}>
      <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${done ? "bg-green-500/20 text-green-400" : "bg-slate-800 text-slate-400"}`}>
        {done ? <CheckCircle className="h-4 w-4" /> : n}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${done ? "line-through text-slate-500" : "text-slate-200"}`}>{title}</p>
        <p className="text-xs text-slate-500">{desc}</p>
      </div>
      {!done && !disabled && (
        <Link href={href} className="shrink-0 text-xs bg-brand-500 text-white px-3 py-1.5 rounded-lg font-medium hover:bg-brand-400 transition-colors">
          {cta}
        </Link>
      )}
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    SCHEDULED: { label: "Programado", cls: "bg-blue-500/20 text-blue-400" },
    READY:     { label: "Listo",      cls: "bg-green-500/20 text-green-400" },
    VALIDATED: { label: "Revisado",   cls: "bg-slate-500/20 text-slate-400" },
    PUBLISHED: { label: "Publicado",  cls: "bg-green-500/20 text-green-400" },
    FAILED:    { label: "Error",      cls: "bg-red-500/20 text-red-400" },
  };
  const s = map[status] ?? { label: status, cls: "bg-slate-500/20 text-slate-400" };
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.cls}`}>{s.label}</span>;
}
