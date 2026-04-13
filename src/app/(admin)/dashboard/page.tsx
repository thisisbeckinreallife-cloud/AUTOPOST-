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
      {/* Header */}
      <div className="animate-fade-up">
        <h1 className="font-display text-2xl font-bold text-white tracking-tight">
          Inicio
        </h1>
        <p className="text-zinc-500 text-sm mt-1">Resumen de tus publicaciones</p>
      </div>

      {/* Onboarding steps */}
      {(!hasBusinesses || !hasConnected || !hasContent) && (
        <div className="rounded-2xl border border-white/[0.06] bg-surface-card p-6 accent-border animate-fade-up stagger-1">
          <div className="flex items-center gap-3 mb-5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500/15 to-accent-violet/10 border border-brand-500/15">
              <Zap className="h-4 w-4 text-brand-400" />
            </div>
            <div>
              <h2 className="font-display font-bold text-white">Empecemos</h2>
              <p className="text-zinc-500 text-xs mt-0.5">Sigue estos pasos para programar tus primeras publicaciones</p>
            </div>
          </div>
          <div className="space-y-2">
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
              desc="Sube una carpeta o ZIP con tus posts"
              href={businesses[0] ? `/businesses/${businesses[0].slug}/upload` : "/businesses/new"}
              cta="Subir" disabled={!hasConnected}
            />
          </div>

          {/* Progress indicator */}
          <div className="mt-5 pt-4 border-t border-white/[0.04]">
            <div className="flex items-center gap-3">
              <div className="flex-1 h-1.5 bg-zinc-800/60 rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand-500 rounded-full transition-all duration-500"
                  style={{ width: `${((Number(hasBusinesses) + Number(hasConnected) + Number(hasContent)) / 3) * 100}%` }}
                />
              </div>
              <span className="text-xs text-zinc-500 font-medium tabular-nums">
                {Number(hasBusinesses) + Number(hasConnected) + Number(hasContent)}/3
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      {hasContent && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 animate-fade-up stagger-2">
          <StatCard
            icon={<Clock className="h-4 w-4 text-cyan-400" />}
            value={upcomingPosts.length}
            label="Proximas"
            glowColor="cyan"
          />
          <StatCard
            icon={<CheckCircle className="h-4 w-4 text-emerald-400" />}
            value={todayPublished}
            label="Publicados hoy"
            glowColor="emerald"
          />
          <StatCard
            icon={<AlertCircle className="h-4 w-4 text-red-400" />}
            value={failedPosts}
            label="Con errores"
            glowColor={failedPosts > 0 ? "red" : "zinc"}
          />
        </div>
      )}

      {/* Quick action */}
      {hasConnected && businesses[0] && (
        <Link
          href={`/businesses/${businesses[0].slug}/upload`}
          className="group flex items-center gap-4 rounded-xl border border-white/[0.06] bg-surface-card p-5 hover:border-brand-500/25 hover:shadow-glow-sm card-interactive animate-fade-up stagger-3"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500/15 to-accent-violet/10 border border-brand-500/15 group-hover:from-brand-500/25 group-hover:to-accent-violet/15 transition-all">
            <Upload className="h-5 w-5 text-brand-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-white">Subir contenido</p>
            <p className="text-xs text-zinc-500 mt-0.5">Sube un ZIP con tus posts del mes</p>
          </div>
          <ArrowRight className="h-4 w-4 text-zinc-600 group-hover:text-brand-400 group-hover:translate-x-0.5 transition-all" />
        </Link>
      )}

      {/* Upcoming posts */}
      {upcomingPosts.length > 0 && (
        <div className="">
          <div className="flex items-center gap-2 mb-3">
            <CalendarDays className="h-4 w-4 text-zinc-600" />
            <h2 className="text-sm font-semibold text-zinc-300">Proximas publicaciones</h2>
          </div>
          <div className="space-y-1.5">
            {upcomingPosts.map((post, i) => (
              <Link
                key={post.id}
                href={`/businesses/${post.business.slug}/posts/${post.id}`}
                className={`group flex items-center gap-4 rounded-lg border border-white/[0.04] bg-surface-card px-4 py-3 hover:border-white/[0.08] transition-all`}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-zinc-200 truncate group-hover:text-white transition-colors">
                    {post.caption?.slice(0, 80) || "Sin texto"}
                  </p>
                  <p className="text-xs text-zinc-600 mt-0.5">{post.business.name}</p>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-zinc-600 shrink-0">
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
        <div className="text-center py-16 rounded-2xl border border-dashed border-white/[0.06] bg-surface-card/50 animate-fade-up">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-brand-500/12 to-accent-violet/8 border border-brand-500/10 flex items-center justify-center mx-auto mb-4">
            <Upload className="h-7 w-7 text-brand-400" />
          </div>
          <h3 className="font-display text-lg font-bold text-white mb-1.5">Tu calendario esta vacio</h3>
          <p className="text-zinc-500 text-sm mb-6 max-w-xs mx-auto">
            Sube el contenido del mes y AutoPost se encarga de publicar por ti
          </p>
          {businesses[0] && (
            <Link
              href={`/businesses/${businesses[0].slug}/upload`}
              className="inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-400 text-white px-5 py-2.5 rounded-lg text-sm font-semibold shadow-glow-sm hover:shadow-glow transition-all"
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

function StatCard({ icon, value, label, glowColor }: {
  icon: React.ReactNode; value: number; label: string; glowColor: string;
}) {
  const glowMap: Record<string, string> = {
    cyan: "hover:border-cyan-500/20 hover:shadow-[0_0_20px_rgba(34,211,238,0.06)]",
    emerald: "hover:border-emerald-500/20 hover:shadow-[0_0_20px_rgba(52,211,153,0.06)]",
    red: "hover:border-red-500/20 hover:shadow-[0_0_20px_rgba(239,68,68,0.06)]",
    zinc: "hover:border-white/[0.1]",
  };
  return (
    <div className={`rounded-xl border border-white/[0.06] bg-surface-card p-4 transition-all duration-300 ${glowMap[glowColor] ?? ""}`}>
      <div className="flex items-center gap-2.5 mb-2">
        {icon}
        <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-3xl font-display font-bold text-white tabular-nums">{value}</p>
    </div>
  );
}

function OnboardStep({ n, done, title, desc, href, cta, disabled }: {
  n: number; done: boolean; title: string; desc: string; href: string; cta: string; disabled?: boolean;
}) {
  return (
    <div className={`flex items-center gap-4 rounded-lg px-4 py-3.5 border transition-all ${
      done
        ? "border-green-500/15 bg-green-500/[0.04]"
        : "border-white/[0.04] bg-white/[0.01] hover:bg-white/[0.02]"
    }`}>
      <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${
        done ? "bg-green-500/15 text-green-400" : "bg-zinc-800 text-zinc-500"
      }`}>
        {done ? <CheckCircle className="h-3.5 w-3.5" /> : n}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${done ? "line-through text-zinc-600" : "text-zinc-200"}`}>{title}</p>
        <p className="text-xs text-zinc-600 mt-0.5">{desc}</p>
      </div>
      {!done && !disabled && (
        <Link href={href} className="shrink-0 text-xs bg-brand-500 hover:bg-brand-400 text-white px-3.5 py-2 rounded-lg font-semibold transition-all">
          {cta}
        </Link>
      )}
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    SCHEDULED: { label: "Programado", cls: "bg-blue-500/10 text-blue-400 border-blue-500/15" },
    READY:     { label: "Listo",      cls: "bg-green-500/10 text-green-400 border-green-500/15" },
    VALIDATED: { label: "Revisado",   cls: "bg-zinc-500/10 text-zinc-400 border-zinc-500/15" },
    PUBLISHED: { label: "Publicado",  cls: "bg-green-500/10 text-green-400 border-green-500/15" },
    FAILED:    { label: "Error",      cls: "bg-red-500/10 text-red-400 border-red-500/15" },
  };
  const s = map[status] ?? { label: status, cls: "bg-zinc-500/10 text-zinc-400 border-zinc-500/15" };
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${s.cls}`}>{s.label}</span>;
}
