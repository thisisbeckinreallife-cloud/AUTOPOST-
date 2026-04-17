import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import Link from "next/link";
import { formatDateInTz } from "@/lib/utils";
import { Upload, ArrowRight, Clock, AlertCircle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await requireSession();

  const businesses = await db.business.findMany({
    include: { metaConnection: true },
    orderBy: { createdAt: "desc" },
  });

  const now = new Date();
  const weekAhead = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const upcomingPosts = await db.postDraft.findMany({
    where: {
      publishAt: { gte: now },
      status: { in: ["SCHEDULED", "READY", "VALIDATED"] },
    },
    include: { business: true },
    orderBy: { publishAt: "asc" },
    take: 3,
  });

  const scheduledThisWeek = await db.postDraft.count({
    where: {
      publishAt: { gte: now, lte: weekAhead },
      status: { in: ["SCHEDULED", "READY", "VALIDATED"] },
    },
  });

  const failedPosts = await db.postDraft.count({ where: { status: "FAILED" } });
  const hasBusinesses = businesses.length > 0;
  const hasConnected = businesses.some((b) => b.metaConnection?.status === "ACTIVE");
  const primaryBiz = businesses.find((b) => b.metaConnection?.status === "ACTIVE") ?? businesses[0];
  const uploadHref = primaryBiz
    ? `/businesses/${primaryBiz.slug}/upload`
    : "/businesses/new";

  const firstName = session.email?.split("@")[0] ?? "";

  return (
    <div className="max-w-3xl space-y-10">
      {/* ── 1 · Stat hero ───────────────────────────────────── */}
      <div>
        <p className="text-sm" style={{ color: "#86868B" }}>
          Hola{firstName ? `, ${firstName}` : ""} 👋
        </p>
        <h1
          className="mt-2 font-bold tracking-tight"
          style={{
            color: "#1D1D1F",
            fontFamily: "Satoshi, Inter, system-ui, sans-serif",
            fontSize: "clamp(2.5rem, 5vw, 3.75rem)",
            letterSpacing: "-0.035em",
            lineHeight: 1.02,
          }}
        >
          <span className="tabular-nums">{scheduledThisWeek}</span>{" "}
          <span style={{ color: "#86868B" }}>
            {scheduledThisWeek === 1 ? "post programado" : "posts programados"}
          </span>
          <br />
          <span style={{ color: "#86868B", fontWeight: 500 }}>esta semana.</span>
        </h1>
        {failedPosts > 0 && (
          <Link
            href={primaryBiz ? `/businesses/${primaryBiz.slug}/posts?status=FAILED` : "#"}
            className="mt-4 inline-flex items-center gap-2 text-xs font-semibold"
            style={{ color: "#DC2626" }}
          >
            <AlertCircle className="h-3.5 w-3.5" />
            {failedPosts} {failedPosts === 1 ? "post con error" : "posts con error"} — revisar
          </Link>
        )}
      </div>

      {/* ── 2 · Acción principal única ─────────────────────── */}
      <Link
        href={uploadHref}
        className="group block rounded-2xl p-6 transition-all hover:scale-[1.01] active:scale-[0.99]"
        style={{
          background: "#1D1D1F",
          border: "1px solid rgba(168,218,220,0.20)",
          color: "#F5F5F7",
          boxShadow:
            "0 24px 48px -16px rgba(29,29,31,0.35), 0 0 0 1px rgba(168,218,220,0.10), inset 0 1px 0 rgba(255,255,255,0.04)",
        }}
      >
        <div className="flex items-center gap-5">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-xl shrink-0"
            style={{
              background: "rgba(168,218,220,0.14)",
              border: "1px solid rgba(168,218,220,0.28)",
            }}
          >
            <Upload className="h-5 w-5" style={{ color: "#A8DADC" }} />
          </div>
          <div className="flex-1 min-w-0">
            <p
              className="text-lg font-semibold"
              style={{
                letterSpacing: "-0.015em",
                fontFamily: "Satoshi, Inter, system-ui, sans-serif",
              }}
            >
              {hasBusinesses && hasConnected
                ? "Subir nueva carpeta"
                : !hasBusinesses
                ? "Añade tu primera cuenta"
                : "Conecta Instagram para empezar"}
            </p>
            <p className="text-sm mt-0.5" style={{ color: "rgba(245,245,247,0.60)" }}>
              {hasBusinesses && hasConnected
                ? "ZIP o carpeta · detectamos carruseles · programamos 30 días"
                : !hasBusinesses
                ? "Dinos qué cuenta vas a automatizar"
                : "Autorización oficial de Meta en 30 segundos"}
            </p>
          </div>
          <ArrowRight
            className="h-5 w-5 shrink-0 transition-transform group-hover:translate-x-1"
            style={{ color: "#A8DADC" }}
          />
        </div>
      </Link>

      {/* ── 3 · Próximos 3 posts ───────────────────────────── */}
      {upcomingPosts.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2
              className="text-xs font-bold uppercase tracking-widest"
              style={{ color: "#86868B" }}
            >
              Próximos
            </h2>
            {primaryBiz && (
              <Link
                href={`/businesses/${primaryBiz.slug}/posts`}
                className="text-xs font-semibold transition-colors hover:underline"
                style={{ color: "#7DBCBE" }}
              >
                Ver todos →
              </Link>
            )}
          </div>
          <div className="space-y-2">
            {upcomingPosts.map((post) => (
              <Link
                key={post.id}
                href={`/businesses/${post.business.slug}/posts/${post.id}`}
                className="group flex items-center gap-4 rounded-xl px-4 py-3.5 transition-all hover:scale-[1.005]"
                style={{
                  background: "#FFFFFF",
                  border: "1px solid rgba(29,29,31,0.06)",
                  boxShadow: "0 2px 6px -2px rgba(29,29,31,0.04)",
                }}
              >
                <div
                  className="flex h-2 w-2 rounded-full shrink-0"
                  style={{
                    background: "#A8DADC",
                    boxShadow: "0 0 6px rgba(168,218,220,0.60)",
                  }}
                />
                <div className="flex-1 min-w-0">
                  <p
                    className="text-sm truncate"
                    style={{ color: "#1D1D1F", fontWeight: 500 }}
                  >
                    {post.caption?.slice(0, 80) || "Sin texto"}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "#86868B" }}>
                    {post.business.name}
                  </p>
                </div>
                <div
                  className="flex items-center gap-1.5 text-xs shrink-0 tabular-nums"
                  style={{ color: "#48484A" }}
                >
                  <Clock className="h-3 w-3" />
                  {formatDateInTz(post.publishAt, post.business.timezone ?? "UTC")}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Empty state — solo si hay connection pero sin contenido */}
      {hasConnected && upcomingPosts.length === 0 && (
        <div
          className="rounded-2xl p-8 text-center"
          style={{
            background: "rgba(168,218,220,0.06)",
            border: "1px dashed rgba(168,218,220,0.30)",
          }}
        >
          <p
            className="text-sm font-semibold"
            style={{ color: "#1D1D1F" }}
          >
            Todo listo. Solo falta contenido.
          </p>
          <p className="text-xs mt-1" style={{ color: "#48484A" }}>
            Suelta una carpeta y programamos 30 días en 2 minutos.
          </p>
        </div>
      )}
    </div>
  );
}
