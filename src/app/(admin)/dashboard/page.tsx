import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import Link from "next/link";
import { formatDateInTz } from "@/lib/utils";
import { CheckCircle, Clock, AlertCircle, Upload, Plus } from "lucide-react";

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
        <h1 className="text-2xl font-bold text-slate-900">¡Hola! 👋</h1>
        <p className="text-slate-500 mt-1">Aquí tienes un resumen de tus publicaciones</p>
      </div>

      {/* Onboarding steps */}
      {(!hasBusinesses || !hasConnected || !hasContent) && (
        <div className="bg-gradient-to-br from-pink-50 to-purple-50 border border-pink-100 rounded-xl p-6">
          <h2 className="font-semibold text-slate-900 text-lg mb-1">Empecemos 🚀</h2>
          <p className="text-slate-500 text-sm mb-5">Sigue estos pasos para programar tus primeras publicaciones</p>
          <div className="space-y-3">
            <OnboardStep
              n={1} done={hasBusinesses}
              title="Añade tu cuenta de Instagram"
              desc="Registra la cuenta que quieres gestionar"
              href="/businesses/new" cta="Añadir"
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
        </div>
      )}

      {/* Stats */}
      {hasContent && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-blue-500" />
              <span className="text-xs text-slate-500">Próximas</span>
            </div>
            <p className="text-3xl font-bold text-slate-900">{upcomingPosts.length}</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-xs text-slate-500">Publicados hoy</span>
            </div>
            <p className="text-3xl font-bold text-slate-900">{todayPublished}</p>
          </div>
          <div className={`border rounded-xl p-4 ${failedPosts > 0 ? "bg-red-50 border-red-100" : "bg-white border-slate-200"}`}>
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className={`h-4 w-4 ${failedPosts > 0 ? "text-red-500" : "text-slate-300"}`} />
              <span className="text-xs text-slate-500">Con errores</span>
            </div>
            <p className="text-3xl font-bold text-slate-900">{failedPosts}</p>
          </div>
        </div>
      )}

      {/* Upcoming posts */}
      {upcomingPosts.length > 0 && (
        <div>
          <h2 className="text-base font-semibold text-slate-900 mb-3">Próximas publicaciones</h2>
          <div className="space-y-2">
            {upcomingPosts.map((post) => (
              <Link
                key={post.id}
                href={`/businesses/${post.business.slug}/posts/${post.id}`}
                className="flex items-center gap-4 bg-white border border-slate-200 rounded-lg px-4 py-3 hover:border-pink-300 hover:shadow-sm transition-all"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">
                    {post.caption?.slice(0, 80) || "Sin texto"}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">{post.business.name}</p>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-400 shrink-0">
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
        <div className="text-center py-16 bg-white border border-dashed border-slate-200 rounded-xl">
          <Upload className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <h3 className="font-semibold text-slate-700 mb-1">No tienes posts aún</h3>
          <p className="text-slate-400 text-sm mb-4">Empieza subiendo tu contenido del mes</p>
          {businesses[0] && (
            <Link
              href={`/businesses/${businesses[0].slug}/upload`}
              className="inline-flex items-center gap-2 bg-pink-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-pink-600 transition-colors"
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
    <div className={`flex items-center gap-4 bg-white rounded-lg px-4 py-3 border ${done ? "border-green-200" : "border-slate-200"}`}>
      <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${done ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
        {done ? "✓" : n}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${done ? "line-through text-slate-400" : "text-slate-800"}`}>{title}</p>
        <p className="text-xs text-slate-400">{desc}</p>
      </div>
      {!done && !disabled && (
        <Link href={href} className="shrink-0 text-xs bg-pink-500 text-white px-3 py-1.5 rounded-lg font-medium hover:bg-pink-600 transition-colors">
          {cta}
        </Link>
      )}
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    SCHEDULED: { label: "Programado", cls: "bg-blue-100 text-blue-700" },
    READY:     { label: "Listo",      cls: "bg-green-100 text-green-700" },
    VALIDATED: { label: "Revisado",   cls: "bg-slate-100 text-slate-600" },
    PUBLISHED: { label: "Publicado",  cls: "bg-green-100 text-green-700" },
    FAILED:    { label: "Error",      cls: "bg-red-100 text-red-700" },
  };
  const s = map[status] ?? { label: status, cls: "bg-slate-100 text-slate-600" };
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.cls}`}>{s.label}</span>;
}
