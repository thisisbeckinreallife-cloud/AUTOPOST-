/**
 * /credits — panel de créditos del usuario.
 * Muestra:
 *   - Balance actual (mensual + addon + total)
 *   - Plan tier + alotamiento + reset
 *   - Packs add-on disponibles para comprar (placeholder hasta Stripe)
 *   - Historial: últimas 50 generaciones IA + últimas compras
 */
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { getBalance } from "@/lib/ai/credits";
import { PLAN_CONFIGS, ADDON_PACKS, CREDIT_COST } from "@/lib/ai/plan-config";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { BuyPackButton } from "./buy-pack-button";

export const dynamic = "force-dynamic";

export default async function CreditsPage() {
  const session = await requireSession();

  const [balance, user, generations, purchases] = await Promise.all([
    getBalance(session.adminUserId),
    db.adminUser.findUnique({
      where: { id: session.adminUserId },
      select: { plan: true, planExpiresAt: true, email: true },
    }),
    db.aiGeneration.findMany({
      where: { adminUserId: session.adminUserId },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        type: true,
        creditsCost: true,
        source: true,
        provider: true,
        model: true,
        refunded: true,
        createdAt: true,
      },
    }),
    db.creditPurchase.findMany({
      where: { adminUserId: session.adminUserId },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        pack: true,
        credits: true,
        amountUsd: true,
        status: true,
        createdAt: true,
        paidAt: true,
      },
    }),
  ]);

  if (!user) return <div>Usuario no encontrado.</div>;
  const planConfig = PLAN_CONFIGS[user.plan];
  const allotment = planConfig.monthlyCredits;
  const usedThisMonth = Math.max(0, allotment - balance.monthly);
  const usedPct = allotment > 0 ? Math.min(100, (usedThisMonth / allotment) * 100) : 0;

  return (
    <div
      className="ap-root"
      style={{
        background: "var(--ap-paper)",
        color: "var(--ap-ink)",
        padding: "clamp(20px, 4vw, 40px)",
        minHeight: "100vh",
      }}
    >
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <Breadcrumb
          items={[
            { label: "Inicio", href: "/dashboard" },
            { label: "Créditos IA" },
          ]}
        />

        {/* Hero */}
        <header
          style={{
            display: "grid",
            gridTemplateColumns: "1fr",
            gap: 28,
            paddingBottom: 28,
            borderBottom: "1px solid var(--ap-line)",
            marginBottom: 36,
          }}
        >
          <div>
            <p
              className="ap-mono"
              style={{
                fontSize: 11,
                color: "var(--ap-stamp)",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                margin: 0,
              }}
            >
              ✦ {planConfig.displayName}
            </p>
            <h1
              className="ap-display"
              style={{
                fontSize: "clamp(40px, 6vw, 72px)",
                fontStyle: "italic",
                lineHeight: 1,
                letterSpacing: "-0.025em",
                margin: "12px 0",
                color: "var(--ap-ink)",
              }}
            >
              {balance.total} <i>créditos</i>
            </h1>
            <p
              style={{
                fontSize: 15,
                color: "var(--ap-ink-3)",
                fontStyle: "italic",
                margin: 0,
              }}
            >
              {balance.monthly} del plan mensual · {balance.addon} extra
              {balance.resetAt && (
                <>
                  {" · "}
                  reset el{" "}
                  {new Date(balance.resetAt).toLocaleDateString("es-ES", {
                    day: "numeric",
                    month: "long",
                  })}
                </>
              )}
            </p>
          </div>

          {/* Progress bar mensual */}
          {allotment > 0 && (
            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 6,
                  fontSize: 11,
                  color: "var(--ap-ink-4)",
                  fontFamily: "var(--ap-font-mono)",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                }}
              >
                <span>Uso del mes</span>
                <span>
                  {usedThisMonth} / {allotment}
                </span>
              </div>
              <div
                style={{
                  height: 6,
                  background: "var(--ap-line)",
                  position: "relative",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    height: 6,
                    width: `${usedPct}%`,
                    background: "var(--ap-stamp)",
                  }}
                />
              </div>
            </div>
          )}
        </header>

        {/* Add-on packs */}
        <section style={{ marginBottom: 48 }}>
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
            01 · Packs add-on
          </p>
          <h2
            className="ap-display"
            style={{
              fontSize: "clamp(28px, 4vw, 40px)",
              fontStyle: "italic",
              lineHeight: 1,
              margin: "10px 0 14px",
              color: "var(--ap-ink)",
            }}
          >
            Compra <i>créditos extra</i>
          </h2>
          <p
            style={{
              fontSize: 14,
              color: "var(--ap-ink-3)",
              margin: "0 0 24px",
              maxWidth: 620,
            }}
          >
            Los créditos del plan caducan al ciclo. Los packs add-on{" "}
            <strong>NO caducan</strong> — los gastas cuando quieras.
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 14,
            }}
          >
            {ADDON_PACKS.map((pack) => (
              <div
                key={pack.key}
                style={{
                  background: "var(--ap-paper-2)",
                  border: "1px solid var(--ap-line-2)",
                  padding: 20,
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                <p
                  className="ap-mono"
                  style={{
                    fontSize: 10,
                    color: "var(--ap-stamp)",
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    margin: 0,
                  }}
                >
                  {pack.displayName}
                </p>
                <p
                  className="ap-display"
                  style={{
                    fontSize: 36,
                    fontStyle: "italic",
                    margin: "4px 0",
                    lineHeight: 1,
                    color: "var(--ap-ink)",
                  }}
                >
                  ${pack.priceUsd}
                </p>
                <p
                  className="ap-mono"
                  style={{
                    fontSize: 11,
                    color: "var(--ap-ink-3)",
                    letterSpacing: "0.1em",
                    margin: 0,
                  }}
                >
                  {pack.credits} créditos
                  {pack.bonusReels && ` + ${pack.bonusReels} reels`}
                </p>
                <p
                  style={{
                    fontSize: 12,
                    color: "var(--ap-ink-3)",
                    fontStyle: "italic",
                    margin: "4px 0 12px",
                    flex: 1,
                  }}
                >
                  {pack.description}
                </p>
                <BuyPackButton packKey={pack.key} />
              </div>
            ))}
          </div>
        </section>

        {/* Equivalencias */}
        <section style={{ marginBottom: 48 }}>
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
            02 · Cuánto cuesta cada acción
          </p>
          <h2
            className="ap-display"
            style={{
              fontSize: "clamp(28px, 4vw, 40px)",
              fontStyle: "italic",
              lineHeight: 1,
              margin: "10px 0 24px",
              color: "var(--ap-ink)",
            }}
          >
            Equivalencias
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: 0,
              border: "1px solid var(--ap-line-2)",
            }}
          >
            {[
              { label: "Caption con voz", action: "caption" as const },
              { label: "Pack hashtags", action: "hashtags" as const },
              { label: "Imagen schnell", action: "image_schnell" as const },
              { label: "Imagen FLUX dev", action: "image_dev" as const },
              { label: "Imagen FLUX pro", action: "image_pro" as const },
              { label: "Quick Reel 5s", action: "quick_reel" as const },
              { label: "Pro Reel 5s", action: "pro_reel" as const },
              { label: "Cinematic Reel 5s", action: "cinematic_reel" as const },
              { label: "Chat IA — post simple", action: "chat_post" as const },
              { label: "Chat IA — reel completo", action: "chat_reel" as const },
              { label: "ZIP organize 30 posts", action: "organize_zip" as const },
              { label: "Remix carrusel (5 imgs)", action: "remix_carousel" as const },
            ].map(({ label, action }) => (
              <div
                key={action}
                style={{
                  padding: "14px 16px",
                  borderRight: "1px solid var(--ap-line-2)",
                  borderBottom: "1px solid var(--ap-line-2)",
                }}
              >
                <p
                  className="ap-mono"
                  style={{
                    fontSize: 9,
                    color: "var(--ap-ink-4)",
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    margin: "0 0 6px",
                  }}
                >
                  {label}
                </p>
                <p
                  className="ap-display"
                  style={{
                    fontSize: 24,
                    fontStyle: "italic",
                    margin: 0,
                    lineHeight: 1,
                    color: "var(--ap-ink)",
                  }}
                >
                  {CREDIT_COST[action]} <span style={{ fontSize: 11, color: "var(--ap-ink-4)", fontStyle: "normal", fontFamily: "var(--ap-font-mono)" }}>cred</span>
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Historial */}
        <section>
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
            03 · Historial
          </p>
          <h2
            className="ap-display"
            style={{
              fontSize: "clamp(28px, 4vw, 40px)",
              fontStyle: "italic",
              lineHeight: 1,
              margin: "10px 0 24px",
              color: "var(--ap-ink)",
            }}
          >
            Últimas <i>50 acciones</i>
          </h2>

          {generations.length === 0 && purchases.length === 0 ? (
            <p style={{ color: "var(--ap-ink-3)", fontStyle: "italic" }}>
              Aún no has consumido créditos. Genera tu primer caption desde el detalle de un post.
            </p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {[
                ...purchases.map((p) => ({
                  kind: "purchase" as const,
                  date: p.createdAt,
                  data: p,
                })),
                ...generations.map((g) => ({
                  kind: "generation" as const,
                  date: g.createdAt,
                  data: g,
                })),
              ]
                .sort((a, b) => b.date.getTime() - a.date.getTime())
                .slice(0, 50)
                .map((entry) => (
                  <li
                    key={`${entry.kind}-${entry.data.id}`}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "12px 0",
                      borderBottom: "1px solid var(--ap-line)",
                      gap: 16,
                      fontSize: 13,
                    }}
                  >
                    {entry.kind === "purchase" ? (
                      <>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ margin: 0, color: "var(--ap-ink-2)" }}>
                            <strong>Compra:</strong>{" "}
                            {ADDON_PACKS.find((p) => p.key === entry.data.pack)?.displayName ?? entry.data.pack}
                          </p>
                          <p
                            className="ap-mono"
                            style={{
                              fontSize: 10,
                              color: "var(--ap-ink-4)",
                              margin: "2px 0 0",
                              letterSpacing: "0.1em",
                            }}
                          >
                            {entry.date.toLocaleString("es-ES", {
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                            {" · "}
                            estado: {entry.data.status}
                          </p>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <p
                            className="ap-mono"
                            style={{
                              margin: 0,
                              color: "var(--ap-stamp)",
                              fontSize: 13,
                              letterSpacing: "0.1em",
                            }}
                          >
                            +{entry.data.credits} cred
                          </p>
                          <p
                            style={{
                              fontSize: 11,
                              color: "var(--ap-ink-4)",
                              margin: "2px 0 0",
                            }}
                          >
                            ${entry.data.amountUsd}
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p
                            style={{
                              margin: 0,
                              color: entry.data.refunded
                                ? "var(--ap-ink-4)"
                                : "var(--ap-ink-2)",
                              textDecoration: entry.data.refunded ? "line-through" : "none",
                            }}
                          >
                            {entry.data.type.replace(/_/g, " ")}
                            {entry.data.refunded && " (reembolsado)"}
                          </p>
                          <p
                            className="ap-mono"
                            style={{
                              fontSize: 10,
                              color: "var(--ap-ink-4)",
                              margin: "2px 0 0",
                              letterSpacing: "0.1em",
                            }}
                          >
                            {entry.date.toLocaleString("es-ES", {
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                            {entry.data.model && ` · ${entry.data.model}`}
                            {" · "}
                            {entry.data.source}
                          </p>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <p
                            className="ap-mono"
                            style={{
                              margin: 0,
                              color: entry.data.refunded
                                ? "var(--ap-ink-4)"
                                : "var(--ap-ink-2)",
                              fontSize: 13,
                              letterSpacing: "0.1em",
                            }}
                          >
                            {entry.data.refunded ? "+" : "−"}
                            {entry.data.creditsCost} cred
                          </p>
                        </div>
                      </>
                    )}
                  </li>
                ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
