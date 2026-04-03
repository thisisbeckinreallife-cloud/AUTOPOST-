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
  TrendingUp,
  Sparkles,
  CalendarDays,
} from "lucide-react";

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
      {/* Hero header with gradient */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-600/20 via-brand-500/10 to-transparent border border-brand-500/10 p-8 animate-card-appear">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-radial from-brand-500/10 to-transparent rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-radial from-blue-500/5 to-transparent rounded-full translate-y-1/2 -translate-x-1/4" />
        <div className="relative">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/20 animate-spin-in">
              <Sparkles className="h-5 w-5 text-brand-400" />
            </div>
            <h1 className="text-3xl font-bold text-gradient-shimmer">Hola!</h1>
          </div>
          <p className="text-slate-400 text-sm ml-[52px]">Aqui tienes un resumen de tus publicaciones</p>
        </div>
      </div>

      {/* Onboarding steps */}
      {(!hasBusinesses || !hasConnected || !hasContent) && (
        <div className="rounded-2xl border border-brand-500/15 bg-gradient-to-br from-brand-500/5 via-surface-card to-surface-card p-6 animate-card-appear delay-1 glow-border">
          <div className="flex items-center gap-3 mb-5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500/15">
              <TrendingUp className="h-4.5 w-4.5 text-brand-400" />
            </div>
            <div>
              <h2 className="font-bold text-slate-100 text-lg">Empecemos</h2>
              <p className="text-slate-500 text-xs">Sigue estos pasos para programar tus primeras publicaciones</p>
            </div>
          </div>
          <div className="space-y-3">
            <OnboardStep
              n={1} done={hasBusinesses} delay={0}
              title="Anade tu cuenta de Instagram"
              desc="Registra la cuenta que quieres gestionar"
              href="/businesses/new" cta="Anadir"
            />
            <OnboardStep
              n={2} done={hasConnected} delay={1}
              title="Conecta tu Instagram"
              desc="Autoriza a AutoPost para publicar en tu nombre"
              href={businesses[0] ? `/businesses/${businesses[0].slug}/connect` : "/businesses/new"}
              cta="Conectar" disabled={!hasBusinesses}
            />
            <OnboardStep
              n={3} done={hasContent} delay={2}
              title="Sube el contenido del mes"
              desc="Sube una carpeta ZIP con tus posts y fechas"
              href={businesses[0] ? `/businesses/${businesses[0].slug}/upload` : "/businesses/new"}
              cta="Subir" disabled={!hasConnected}
            />
          </div>
        </div>
      )}

      {/* Animated Stats */}
      {hasContent && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            icon={<Clock className="h-5 w-5 text-blue-400" />}
            value={upcomingPosts.length}
            label="Proximas"
            color="blue"
            delay={0}
          />
          <StatCard
            icon={<CheckCircle className="h-5 w-5 text-green-400" />}
            value={todayPublished}
            label="Publicados hoy"
            color="green"
            delay={1}
          />
          <StatCard
            icon={<AlertCircle className="h-5 w-5 text-red-400" />}
            value={failedPosts}
            label="Con errores"
            color={failedPosts > 0 ? "red" : "slate"}
            delay={2}
          />
        </div>
      )}

      {/* Quick action — animated CTA */}
      {hasConnected && businesses[0] && (
        <Link
          href={`/businesses/${businesses[0].slug}/upload`}
          className="group relative flex items-center gap-4 rounded-2xl border border-brand-500/20 bg-gradient-to-r from-brand-500/8 via-brand-500/5 to-transparent p-6 hover:border-brand-500/40 hover:shadow-glow-lg transition-all duration-300 animate-card-appear delay-3 overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-brand-500/0 via-brand-500/5 to-brand-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-brand-500/15 group-hover:bg-brand-500/25 transition-all duration-300 group-hover:scale-110 animate-glow-ping">
            <Zap className="h-6 w-6 text-brand-400" />
          </div>
          <div className="relative flex-1">
            <p className="text-base font-bold text-slate-100 group-hover:text-white transition-colors">Subir contenido</p>
            <p className="text-xs text-slate-500 mt-0.5">Sube un ZIP con tus posts del mes</p>
          </div>
          <ArrowRight className="relative h-5 w-5 text-slate-600 group-hover:text-brand-400 group-hover:translate-x-1 transition-all duration-300" />
        </Link>
      )}

      {/* Upcoming posts */}
      {upcomingPosts.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <CalendarDays className="h-4 w-4 text-brand-400" />
            <h2 className="text-base font-bold text-slate-200">Proximas publicaciones</h2>
          </div>
          <div className="space-y-2">
            {upcomingPosts.map((post, i) => (
              <Link
                key={post.id}
                href={`/businesses/${post.business.slug}/posts/${post.id}`}
                className={`group flex items-center gap-4 rounded-xl border border-slate-800 bg-surface-card px-5 py-3.5 card-hover animate-stagger-in delay-${Math.min(i, 8)}`}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-200 truncate group-hover:text-white transition-colors">
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
        <div className="relative text-center py-20 rounded-2xl border border-dashed border-slate-700 bg-surface-card/50 animate-card-appear overflow-hidden bg-dots">
          <div className="absolute inset-0 bg-gradient-to-t from-surface-primary/80 to-transparent pointer-events-none" />
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center mx-auto mb-5 animate-float">
              <Upload className="h-10 w-10 text-brand-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-100 mb-2">Tu calendario esta vacio</h3>
            <p className="text-slate-500 text-sm mb-6 max-w-xs mx-auto">Sube el contenido del mes y AutoPost se encarga de publicar por ti</p>
            {businesses[0] && (
              <Link
                href={`/businesses/${businesses[0].slug}/upload`}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-brand-500 to-brand-600 text-white px-6 py-3 rounded-xl text-sm font-bold hover:shadow-glow-lg hover:scale-105 transition-all duration-300"
              >
                <Plus className="h-4 w-4" />
                Subir contenido
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, value, label, color, delay }: {
  icon: React.ReactNode; value: number; label: string; color: string; delay: number;
}) {
  const bgMap: Record<string, string> = {
    blue: "from-blue-500/10 to-blue-500/5 border-blue-500/15 hover:border-blue-500/30",
    green: "from-green-500/10 to-green-500/5 border-green-500/15 hover:border-green-500/30",
    red: "from-red-500/10 to-red-500/5 border-red-500/15 hover:border-red-500/30",
    slate: "from-slate-500/10 to-slate-500/5 border-slate-500/15 hover:border-slate-500/30",
  };
  return (
    <div className={`relative rounded-2xl border bg-gradient-to-br ${bgMap[color]} p-5 card-hover animate-card-appear delay-${delay} overflow-hidden`}>
      <div className={`absolute -top-4 -right-4 w-24 h-24 rounded-full bg-${color === "slate" ? "slate" : color}-500/5 blur-xl`} />
      <div className="relative">
        <div className="flex items-center gap-3 mb-3">
          <div className="animate-spin-in">{icon}</div>
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">{label}</span>
        </div>
        <p className="text-4xl font-black text-slate-100 stat-number">{value}</p>
      </div>
    </div>
  );
}

function OnboardStep({ n, done, title, desc, href, cta, disabled, delay }: {
  n: number; done: boolean; title: string; desc: string; href: string; cta: string; disabled?: boolean; delay: number;
}) {
  return (
    <div className={`flex items-center gap-4 rounded-xl px-5 py-4 border transition-all duration-300 animate-stagger-in delay-${delay} ${
      done
        ? "border-green-500/20 bg-green-500/5"
        : "border-slate-800 bg-surface-primary hover:border-slate-700 hover:bg-surface-hover"
    }`}>
      <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all ${
        done ? "bg-green-500/20 text-green-400 scale-100" : "bg-slate-800 text-slate-400"
      }`}>
        {done ? <CheckCircle className="h-4 w-4" /> : n}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold ${done ? "line-through text-slate-500" : "text-slate-200"}`}>{title}</p>
        <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
      </div>
      {!done && !disabled && (
        <Link href={href} className="shrink-0 text-xs bg-gradient-to-r from-brand-500 to-brand-600 text-white px-4 py-2 rounded-lg font-bold hover:shadow-glow hover:scale-105 transition-all duration-200">
          {cta}
        </Link>
      )}
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    SCHEDULED: { label: "Programado", cls: "bg-blue-500/20 text-blue-400 border-blue-500/20" },
    READY:     { label: "Listo",      cls: "bg-green-500/20 text-green-400 border-green-500/20" },
    VALIDATED: { label: "Revisado",   cls: "bg-slate-500/20 text-slate-400 border-slate-500/20" },
    PUBLISHED: { label: "Publicado",  cls: "bg-green-500/20 text-green-400 border-green-500/20" },
    FAILED:    { label: "Error",      cls: "bg-red-500/20 text-red-400 border-red-500/20" },
  };
  const s = map[status] ?? { label: status, cls: "bg-slate-500/20 text-slate-400 border-slate-500/20" };
  return <span className={`text-xs px-2.5 py-1 rounded-full font-bold border ${s.cls}`}>{s.label}</span>;
}
