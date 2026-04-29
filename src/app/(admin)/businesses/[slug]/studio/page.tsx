/**
 * Tab "Estudio IA" — todo lo de entrenamiento + reports.
 * Centraliza: Brand DNA questionnaire, voice training, generations gallery,
 * informes editoriales.
 */
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { notFound } from "next/navigation";
import { BrandProfileQuestionnaire } from "@/components/admin/BrandProfileQuestionnaire";
import { ReportsPanel } from "@/components/admin/ReportsPanel";

export const dynamic = "force-dynamic";

export default async function StudioPage({
  params,
}: {
  params: { slug: string };
}) {
  await requireAuth();

  const business = await db.business.findUnique({
    where: { slug: params.slug },
    select: { id: true, name: true },
  });
  if (!business) notFound();

  return (
    <div style={{ display: "grid", gap: 32, maxWidth: 900 }}>
      <div>
        <p
          className="ap-mono"
          style={{
            fontSize: 11,
            color: "var(--ap-ink-4)",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            margin: 0,
          }}
        >
          ✦ Estudio IA
        </p>
        <h2
          className="ap-display"
          style={{
            fontSize: "clamp(28px, 4vw, 40px)",
            fontStyle: "italic",
            lineHeight: 1,
            margin: "10px 0 8px",
            color: "var(--ap-ink)",
          }}
        >
          Entrena la <i>IA en tu marca</i>
        </h2>
        <p
          style={{
            fontSize: 14,
            color: "var(--ap-ink-3)",
            margin: 0,
            maxWidth: 640,
          }}
        >
          Aquí configuras cómo aprende la IA. Cuanto más completes, mejor escribe en
          tu voz y mejor diseña tus imágenes. Niveles L1 → L5.
        </p>
      </div>

      {/* Brand DNA Questionnaire */}
      <BrandProfileQuestionnaire businessSlug={params.slug} />

      {/* Informes editoriales */}
      <div>
        <p
          className="ap-mono"
          style={{
            fontSize: 11,
            color: "var(--ap-ink-4)",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            margin: 0,
          }}
        >
          ✦ Informes
        </p>
        <h3
          className="ap-display"
          style={{
            fontSize: "clamp(22px, 3vw, 28px)",
            fontStyle: "italic",
            lineHeight: 1,
            margin: "8px 0 14px",
            color: "var(--ap-ink)",
          }}
        >
          Informes editoriales para clientes
        </h3>
        <ReportsPanel
          businessSlug={params.slug}
          appUrl={process.env.NEXT_PUBLIC_APP_URL ?? "https://autopost.app"}
        />
      </div>
    </div>
  );
}
