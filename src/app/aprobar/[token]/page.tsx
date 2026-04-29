/**
 * /aprobar/[token]
 *
 * Página pública de aprobación. El cliente abre este enlace desde el email
 * y revisa el post propuesto: media + caption + datos de programación. Sin
 * necesidad de login. La decisión se envía a /api/approval/[token]/respond.
 *
 * Server component — fetch directo a Prisma. Renderiza estados:
 *   - loading (vía suspense): no usado (es server component síncrono)
 *   - not-found: token inválido o no encontrado
 *   - expired: ApprovalRequest.expiresAt < now
 *   - already-responded: respondedAt != null
 *   - ok: muestra preview + cliente component con form
 */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { ApprovalDecisionForm } from "./decision-form";
import { Logo } from "@/components/editorial/atoms";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Aprobación · AutoPost",
  robots: { index: false, follow: false },
};

interface PageProps {
  params: { token: string };
}

export default async function ApprovalPage({ params }: PageProps) {
  if (!/^[A-Za-z0-9_-]{20,80}$/.test(params.token)) {
    notFound();
  }

  const approval = await db.approvalRequest.findUnique({
    where: { token: params.token },
    include: {
      postDraft: {
        include: {
          business: { select: { name: true, timezone: true } },
          mediaAssets: {
            orderBy: { sortOrder: "asc" },
            select: {
              id: true,
              originalFilename: true,
              mimeType: true,
              storageUrl: true,
              sortOrder: true,
            },
          },
        },
      },
    },
  });

  if (!approval) notFound();

  const expired = approval.expiresAt < new Date();
  const responded = approval.respondedAt !== null;

  const post = approval.postDraft;
  const scheduledFor = post.publishAt.toLocaleString("es-ES", {
    timeZone: post.business.timezone,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div
      className="ap-root"
      style={{
        minHeight: "100vh",
        background: "var(--ap-paper)",
        color: "var(--ap-ink)",
        padding: "clamp(20px, 5vw, 64px) clamp(16px, 4vw, 56px)",
      }}
    >
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        {/* Header magazine */}
        <header
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 32,
            paddingBottom: 20,
            borderBottom: "1px solid var(--ap-line)",
          }}
        >
          <Logo size={20} />
          <span
            className="ap-mono"
            style={{
              fontSize: 10,
              color: "var(--ap-ink-4)",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
            }}
          >
            ✦ Edición · Aprobación
          </span>
        </header>

        {/* Title */}
        <p
          className="ap-mono"
          style={{
            fontSize: 11,
            color: "var(--ap-stamp)",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            margin: "0 0 12px",
          }}
        >
          {post.business.name}
        </p>
        <h1
          className="ap-display"
          style={{
            fontSize: "clamp(40px, 6vw, 64px)",
            fontStyle: "italic",
            lineHeight: 1.0,
            letterSpacing: "-0.02em",
            margin: "0 0 12px",
            color: "var(--ap-ink)",
          }}
        >
          Tu siguiente edición<br />
          <i>espera tu firma</i>.
        </h1>
        <p
          style={{
            fontSize: 16,
            color: "var(--ap-ink-3)",
            fontStyle: "italic",
            margin: "0 0 32px",
          }}
        >
          Programado para {scheduledFor} ({post.business.timezone}).
        </p>

        {/* Estado expirado */}
        {expired && !responded && (
          <StateCard
            tone="warn"
            title="Este enlace ha expirado"
            body={`Pídele a tu agencia un nuevo enlace de aprobación. El último expiró el ${approval.expiresAt.toLocaleDateString("es-ES")}.`}
          />
        )}

        {/* Estado ya respondido */}
        {responded && (
          <StateCard
            tone={approval.decision === "APPROVED" ? "ok" : "ko"}
            title={
              approval.decision === "APPROVED"
                ? "Edición aprobada"
                : "Edición rechazada"
            }
            body={
              approval.decision === "APPROVED"
                ? "Gracias. La edición se publicará a su hora prevista."
                : `Has rechazado esta edición.${approval.feedback ? ` Tu nota: «${approval.feedback}»` : ""}`
            }
          />
        )}

        {/* Preview + form */}
        {!expired && !responded && (
          <>
            <PostPreview post={post} />

            <hr
              className="ap-rule"
              style={{ margin: "40px 0", opacity: 0.55 }}
            />

            <ApprovalDecisionForm token={params.token} />
          </>
        )}

        {/* Footer */}
        <footer
          style={{
            marginTop: 64,
            paddingTop: 24,
            borderTop: "1px solid var(--ap-line)",
            textAlign: "center",
          }}
        >
          <p
            className="ap-mono"
            style={{
              fontSize: 10,
              color: "var(--ap-ink-4)",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              margin: 0,
            }}
          >
            ✦ AutoPost · Edición editorial
          </p>
          <p
            style={{
              fontSize: 11,
              color: "var(--ap-ink-4)",
              fontStyle: "italic",
              margin: "8px 0 0",
            }}
          >
            Enlace de un solo uso · expira el{" "}
            {approval.expiresAt.toLocaleDateString("es-ES", {
              day: "numeric",
              month: "long",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </footer>
      </div>
    </div>
  );
}

interface PostForPreview {
  postType: string;
  caption: string;
  firstComment: string | null;
  collaborators: unknown;
  mediaAssets: {
    id: string;
    originalFilename: string;
    mimeType: string;
    storageUrl: string;
    sortOrder: number;
  }[];
}

function PostPreview({ post }: { post: PostForPreview }) {
  const collabs = Array.isArray(post.collaborators)
    ? (post.collaborators as string[])
    : [];
  const typeLabel =
    post.postType === "CAROUSEL"
      ? `Carrusel · ${post.mediaAssets.length} piezas`
      : post.postType === "REEL"
        ? "Reel"
        : "Post sencillo";

  return (
    <article
      style={{
        background: "var(--ap-paper-2)",
        border: "1px solid var(--ap-line-2)",
        padding: "clamp(20px, 4vw, 36px)",
      }}
    >
      <p
        className="ap-mono"
        style={{
          fontSize: 10,
          color: "var(--ap-ink-4)",
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          margin: "0 0 16px",
        }}
      >
        {typeLabel}
      </p>

      {/* Media grid */}
      {post.mediaAssets.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              post.mediaAssets.length === 1
                ? "1fr"
                : "repeat(auto-fill, minmax(180px, 1fr))",
            gap: 8,
            marginBottom: 24,
          }}
        >
          {post.mediaAssets.map((asset) => (
            <MediaTile key={asset.id} asset={asset} />
          ))}
        </div>
      )}

      {/* Caption */}
      <p
        className="ap-mono"
        style={{
          fontSize: 10,
          color: "var(--ap-ink-4)",
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          margin: "0 0 8px",
        }}
      >
        Caption
      </p>
      <pre
        style={{
          margin: 0,
          padding: 0,
          fontFamily: "inherit",
          fontSize: 15,
          lineHeight: 1.6,
          color: "var(--ap-ink-2)",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
        }}
      >
        {post.caption}
      </pre>

      {post.firstComment && (
        <>
          <hr
            className="ap-rule"
            style={{ margin: "20px 0 12px", opacity: 0.45 }}
          />
          <p
            className="ap-mono"
            style={{
              fontSize: 10,
              color: "var(--ap-ink-4)",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              margin: "0 0 6px",
            }}
          >
            Primer comentario
          </p>
          <p
            style={{
              margin: 0,
              fontSize: 14,
              color: "var(--ap-ink-3)",
              fontStyle: "italic",
            }}
          >
            {post.firstComment}
          </p>
        </>
      )}

      {collabs.length > 0 && (
        <>
          <hr
            className="ap-rule"
            style={{ margin: "20px 0 12px", opacity: 0.45 }}
          />
          <p
            className="ap-mono"
            style={{
              fontSize: 10,
              color: "var(--ap-ink-4)",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              margin: "0 0 6px",
            }}
          >
            Colaboradores
          </p>
          <p style={{ margin: 0, fontSize: 14, color: "var(--ap-ink-3)" }}>
            {collabs.map((c) => `@${c}`).join(" · ")}
          </p>
        </>
      )}
    </article>
  );
}

function MediaTile({
  asset,
}: {
  asset: { mimeType: string; storageUrl: string; originalFilename: string };
}) {
  const isImage = asset.mimeType.startsWith("image/");
  const isVideo = asset.mimeType.startsWith("video/");
  return (
    <div
      style={{
        position: "relative",
        aspectRatio: "1 / 1",
        background: "var(--ap-paper)",
        border: "1px solid var(--ap-line)",
        overflow: "hidden",
      }}
    >
      {isImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={asset.storageUrl}
          alt={asset.originalFilename}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
      ) : isVideo ? (
        <video
          src={asset.storageUrl}
          muted
          playsInline
          preload="metadata"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
      ) : (
        <span
          className="ap-mono"
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 10,
            color: "var(--ap-ink-4)",
            letterSpacing: "0.14em",
          }}
        >
          {asset.originalFilename}
        </span>
      )}
    </div>
  );
}

function StateCard({
  tone,
  title,
  body,
}: {
  tone: "ok" | "ko" | "warn";
  title: string;
  body: string;
}) {
  const accent =
    tone === "ok"
      ? "var(--ap-olive, #6B7A2E)"
      : tone === "ko"
        ? "var(--ap-stamp)"
        : "var(--ap-mustard, #D4A627)";
  return (
    <div
      style={{
        padding: "clamp(20px, 4vw, 32px)",
        background: "var(--ap-paper-2)",
        borderLeft: `3px solid ${accent}`,
      }}
    >
      <h2
        className="ap-display"
        style={{
          fontSize: 28,
          fontStyle: "italic",
          margin: "0 0 8px",
          color: "var(--ap-ink)",
        }}
      >
        {title}
      </h2>
      <p
        style={{
          margin: 0,
          fontSize: 15,
          color: "var(--ap-ink-3)",
          lineHeight: 1.55,
        }}
      >
        {body}
      </p>
    </div>
  );
}
