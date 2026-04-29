import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { MagazineSection } from "@/components/editorial/MagazineSection";
import { Icon, Logo } from "@/components/editorial/atoms";
import { RichText } from "@/components/editorial/RichText";
import {
  comparisons,
  competitorSlugs,
  type Competitor,
} from "./data";

export async function generateStaticParams() {
  return competitorSlugs.map((competidor) => ({ competidor }));
}

export async function generateMetadata({
  params,
}: {
  params: { competidor: string };
}): Promise<Metadata> {
  const slug = params.competidor.toLowerCase() as Competitor;
  const data = comparisons[slug];
  if (!data) return { title: "Comparativa no encontrada" };

  const title = `AutoPost vs ${data.name} — La carpeta es el calendario`;
  const description = `${data.hookSub} Tabla completa de funcionalidades, precios y diferencias clave para agencias y creadores hispanohablantes.`;

  return {
    title,
    description,
    alternates: {
      canonical: `/comparar/${slug}`,
    },
    openGraph: {
      title,
      description,
      type: "article",
      url: `/comparar/${slug}`,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default function CompararPage({
  params,
}: {
  params: { competidor: string };
}) {
  const slug = params.competidor.toLowerCase() as Competitor;
  const data = comparisons[slug];
  if (!data) notFound();

  return (
    <div
      className="ap-root min-h-screen"
      style={{ background: "var(--ap-paper)", color: "var(--ap-ink)" }}
    >
      {/* Skip link */}
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2"
        style={{ background: "var(--ap-ink)", color: "var(--ap-paper)" }}
      >
        Saltar al contenido
      </a>

      {/* Mini-nav editorial */}
      <header
        style={{
          padding: "20px clamp(20px, 5vw, 56px)",
          borderBottom: "1px solid var(--ap-line)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Link href="/" aria-label="Volver al inicio">
          <Logo size={18} />
        </Link>
        <Link
          href="/signup"
          className="ap-btn ap-btn--stamp"
          style={{ padding: "9px 16px", fontSize: 13 }}
        >
          Probar gratis
        </Link>
      </header>

      <main id="contenido">
        {/* Hero comparativa */}
        <MagazineSection
          index="vs"
          kicker={`COMPARATIVA · ${data.name.toUpperCase()}`}
          title={
            <>
              AutoPost vs <i>{data.name}</i>.
            </>
          }
          lede={data.hookSub}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 0,
              borderTop: "1px solid var(--ap-rule)",
              borderBottom: "1px solid var(--ap-rule)",
            }}
            className="cmp-overview"
          >
            <div
              style={{
                padding: "clamp(24px, 3vw, 36px)",
                borderRight: "1px solid var(--ap-line)",
                background: "rgba(229,75,38,0.04)",
              }}
            >
              <p
                className="ap-mono"
                style={{
                  fontSize: 11,
                  color: "var(--ap-stamp)",
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  margin: "0 0 14px",
                  fontWeight: 600,
                }}
              >
                AutoPost
              </p>
              <h2
                className="ap-display"
                style={{
                  fontStyle: "italic",
                  fontSize: 26,
                  letterSpacing: "-0.01em",
                  color: "var(--ap-ink)",
                  margin: "0 0 12px",
                  lineHeight: 1.1,
                }}
              >
                La carpeta es el calendario.
              </h2>
              <p
                style={{
                  fontSize: 14,
                  color: "var(--ap-ink-3)",
                  lineHeight: 1.55,
                  margin: 0,
                }}
              >
                Sueltas la carpeta. Detectamos carruseles, asociamos copy y programamos 30 días en un par de minutos. Hecho para agencias y creadores hispanohablantes con voz propia.
              </p>
              <p
                className="ap-mono"
                style={{
                  marginTop: 18,
                  fontSize: 11,
                  color: "var(--ap-ink-3)",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                }}
              >
                Desde $15/mes · 14 días sin tarjeta
              </p>
            </div>
            <div
              style={{
                padding: "clamp(24px, 3vw, 36px)",
                background: "var(--ap-paper-2)",
              }}
            >
              <p
                className="ap-mono"
                style={{
                  fontSize: 11,
                  color: "var(--ap-ink-4)",
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  margin: "0 0 14px",
                }}
              >
                {data.name}
              </p>
              <h2
                className="ap-display"
                style={{
                  fontStyle: "italic",
                  fontSize: 26,
                  letterSpacing: "-0.01em",
                  color: "var(--ap-ink-3)",
                  margin: "0 0 12px",
                  lineHeight: 1.1,
                }}
              >
                {data.tagline}.
              </h2>
              <p
                style={{
                  fontSize: 14,
                  color: "var(--ap-ink-3)",
                  lineHeight: 1.55,
                  margin: 0,
                }}
              >
                {data.intro}
              </p>
              <p
                className="ap-mono"
                style={{
                  marginTop: 18,
                  fontSize: 11,
                  color: "var(--ap-ink-4)",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                }}
              >
                {data.pricing}
              </p>
            </div>
          </div>

          {/* Mobile fallback */}
          <style>{`@media (max-width: 768px) { .cmp-overview { grid-template-columns: 1fr !important; } .cmp-overview > div:first-child { border-right: none !important; border-bottom: 1px solid var(--ap-line); } }`}</style>
        </MagazineSection>

        {/* Tabla comparativa */}
        <MagazineSection
          index="01"
          kicker="FUNCIONALIDADES"
          title={
            <>
              Lo que tiene cada uno, <i>una a una</i>.
            </>
          }
          rule={false}
        >
          <div className="overflow-x-auto">
            <table
              style={{
                width: "100%",
                fontSize: 14,
                borderCollapse: "collapse",
                borderTop: "1.5px solid var(--ap-ink)",
                borderBottom: "1.5px solid var(--ap-ink)",
              }}
            >
              <thead>
                <tr style={{ borderBottom: "1px solid var(--ap-line-2)" }}>
                  <th
                    style={{
                      textAlign: "left",
                      padding: "16px",
                      minWidth: 240,
                      fontFamily: "var(--ap-font-mono)",
                      fontSize: 11,
                      letterSpacing: "0.14em",
                      textTransform: "uppercase",
                      fontWeight: 500,
                      color: "var(--ap-ink-4)",
                    }}
                  >
                    Funcionalidad
                  </th>
                  <th
                    style={{
                      padding: "16px",
                      textAlign: "center",
                      minWidth: 140,
                      background: "rgba(229,75,38,0.04)",
                      borderTop: "2px solid var(--ap-stamp)",
                    }}
                  >
                    <span
                      className="ap-display"
                      style={{
                        fontStyle: "italic",
                        fontSize: 18,
                        color: "var(--ap-ink)",
                      }}
                    >
                      AutoPost
                    </span>
                  </th>
                  <th
                    style={{
                      padding: "16px",
                      textAlign: "center",
                      minWidth: 140,
                      fontFamily: "var(--ap-font-mono)",
                      fontSize: 11,
                      letterSpacing: "0.14em",
                      textTransform: "uppercase",
                      fontWeight: 500,
                      color: "var(--ap-ink-4)",
                    }}
                  >
                    {data.name}
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.rows.map((row, i) => (
                  <tr
                    key={i}
                    style={{
                      borderBottom: "1px solid var(--ap-line)",
                      background: row.highlight
                        ? "rgba(229,75,38,0.02)"
                        : "transparent",
                    }}
                  >
                    <td
                      style={{
                        padding: "14px 16px",
                        color: "var(--ap-ink-2)",
                        fontWeight: row.highlight ? 600 : 400,
                      }}
                    >
                      {row.feature}
                      {row.highlight && (
                        <span
                          className="ap-mono"
                          style={{
                            marginLeft: 8,
                            fontSize: 9,
                            color: "var(--ap-stamp)",
                            letterSpacing: "0.14em",
                            textTransform: "uppercase",
                          }}
                        >
                          ✦ único
                        </span>
                      )}
                    </td>
                    <Cell value={row.autopost} stamp />
                    <Cell value={row.competitor} />
                  </tr>
                ))}
                <tr>
                  <td colSpan={3} style={{ padding: 0, border: "none" }}>
                    <div
                      style={{
                        height: 0,
                        borderBottom: "2px solid var(--ap-stamp)",
                        width: "calc((100% - 240px) / 2)",
                        marginLeft: 240,
                      }}
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </MagazineSection>

        {/* Diferencias clave */}
        <MagazineSection
          index="02"
          kicker="DIFERENCIAS CLAVE"
          title={
            <>
              Tres cosas que <i>solo AutoPost</i> hace.
            </>
          }
        >
          <div
            className="cmp-killer"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 0,
              borderTop: "1px solid var(--ap-rule)",
              borderBottom: "1px solid var(--ap-rule)",
            }}
          >
            {data.killerFeatures.map((kf, i) => (
              <div
                key={kf.title}
                style={{
                  padding: "clamp(24px, 3vw, 36px)",
                  borderRight:
                    i < data.killerFeatures.length - 1
                      ? "1px solid var(--ap-line)"
                      : "none",
                  background: i === 1 ? "var(--ap-paper-2)" : "var(--ap-paper)",
                }}
              >
                <span
                  className="ap-display"
                  style={{
                    fontSize: 36,
                    fontStyle: "italic",
                    color: "var(--ap-stamp)",
                    letterSpacing: "-0.02em",
                    lineHeight: 0.85,
                    display: "block",
                    marginBottom: 14,
                  }}
                >
                  0{i + 1}
                </span>
                <h3
                  className="ap-display"
                  style={{
                    fontSize: 20,
                    fontStyle: "italic",
                    color: "var(--ap-ink)",
                    letterSpacing: "-0.01em",
                    margin: "0 0 10px",
                    lineHeight: 1.15,
                  }}
                >
                  {kf.title}
                </h3>
                <p
                  style={{
                    fontSize: 14,
                    color: "var(--ap-ink-3)",
                    lineHeight: 1.6,
                    margin: 0,
                  }}
                >
                  {kf.desc}
                </p>
              </div>
            ))}
          </div>
          <style>{`@media (max-width: 768px) { .cmp-killer { grid-template-columns: 1fr !important; } .cmp-killer > div { border-right: none !important; border-bottom: 1px solid var(--ap-line); } }`}</style>
        </MagazineSection>

        {/* Pros / cons del competidor */}
        <MagazineSection
          index="03"
          kicker={`HONESTIDAD · ${data.name.toUpperCase()}`}
          title={
            <>
              Lo que <i>{data.name}</i> hace bien y mal.
            </>
          }
          lede="Aquí no vamos a fingir que la competencia no tiene fortalezas. Si lo único que necesitas es lo que ya hace, la honestidad nuestra es decírtelo."
        >
          <div
            className="cmp-pros-cons"
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 0,
              borderTop: "1px solid var(--ap-rule)",
              borderBottom: "1px solid var(--ap-rule)",
            }}
          >
            <div
              style={{
                padding: "clamp(24px, 3vw, 36px)",
                borderRight: "1px solid var(--ap-line)",
              }}
            >
              <p
                className="ap-mono"
                style={{
                  fontSize: 11,
                  color: "var(--ap-olive)",
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  margin: "0 0 14px",
                  fontWeight: 600,
                }}
              >
                Pros
              </p>
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {data.pros.map((p, i) => (
                  <li
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "baseline",
                      gap: 12,
                      padding: "10px 0",
                      borderBottom:
                        i < data.pros.length - 1
                          ? "1px solid var(--ap-line)"
                          : "none",
                      fontSize: 14,
                      color: "var(--ap-ink-2)",
                    }}
                  >
                    <Icon name="check" size={14} c="var(--ap-olive)" sw={1.8} />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div
              style={{
                padding: "clamp(24px, 3vw, 36px)",
                background: "var(--ap-paper-2)",
              }}
            >
              <p
                className="ap-mono"
                style={{
                  fontSize: 11,
                  color: "var(--ap-stamp)",
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  margin: "0 0 14px",
                  fontWeight: 600,
                }}
              >
                Contras
              </p>
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {data.cons.map((c, i) => (
                  <li
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "baseline",
                      gap: 12,
                      padding: "10px 0",
                      borderBottom:
                        i < data.cons.length - 1
                          ? "1px solid var(--ap-line)"
                          : "none",
                      fontSize: 14,
                      color: "var(--ap-ink-2)",
                    }}
                  >
                    <Icon name="x" size={14} c="var(--ap-stamp)" sw={1.8} />
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <style>{`@media (max-width: 768px) { .cmp-pros-cons { grid-template-columns: 1fr !important; } .cmp-pros-cons > div:first-child { border-right: none !important; border-bottom: 1px solid var(--ap-line); } }`}</style>
        </MagazineSection>

        {/* Cierre + CTA */}
        <MagazineSection
          index="04"
          kicker="VEREDICTO"
          title={
            <>
              ¿Cuándo elegir <i>uno u otro</i>?
            </>
          }
          align="center"
        >
          <p
            style={{
              maxWidth: 720,
              margin: "0 auto 36px",
              fontSize: 16,
              lineHeight: 1.6,
              color: "var(--ap-ink-2)",
              textAlign: "center",
              fontStyle: "italic",
              fontFamily: "var(--ap-font-display)",
            }}
          >
            <RichText text={data.closingPitch} />
          </p>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 14,
              justifyContent: "center",
              marginTop: 32,
            }}
          >
            <Link
              href="/signup"
              className="ap-btn ap-btn--stamp"
              style={{
                padding: "14px 22px",
                fontSize: 14,
                display: "inline-flex",
              }}
            >
              Probar AutoPost gratis
              <ArrowRight strokeWidth={1.5} className="h-4 w-4" />
            </Link>
            <Link
              href="/#precios"
              className="ap-btn ap-btn--ghost"
              style={{
                padding: "14px 22px",
                fontSize: 14,
                display: "inline-flex",
              }}
            >
              Ver precios
            </Link>
          </div>

          <p
            className="ap-mono"
            style={{
              textAlign: "center",
              marginTop: 24,
              fontSize: 11,
              color: "var(--ap-ink-4)",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
            }}
          >
            14 días sin tarjeta · Cancela en un click
          </p>
        </MagazineSection>

        {/* Cross-link otras comparativas */}
        <section
          style={{
            background: "var(--ap-ink)",
            color: "var(--ap-paper)",
            padding: "clamp(48px, 8vw, 96px) clamp(20px, 5vw, 56px)",
          }}
        >
          <div style={{ maxWidth: 1180, margin: "0 auto" }}>
            <p
              className="ap-mono"
              style={{
                fontSize: 11,
                color: "var(--ap-stamp)",
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                margin: "0 0 24px",
                fontWeight: 600,
              }}
            >
              Otras comparativas
            </p>
            <div
              className="cmp-cross"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, 1fr)",
                gap: 0,
                borderTop: "1px solid rgba(241,236,226,0.20)",
                borderBottom: "1px solid rgba(241,236,226,0.20)",
              }}
            >
              {competitorSlugs
                .filter((s) => s !== slug)
                .map((s, i, arr) => {
                  const c = comparisons[s];
                  return (
                    <Link
                      key={s}
                      href={`/comparar/${s}`}
                      className="group"
                      style={{
                        padding: "clamp(20px, 2.5vw, 32px)",
                        borderRight:
                          i < arr.length - 1
                            ? "1px solid rgba(241,236,226,0.20)"
                            : "none",
                        textDecoration: "none",
                        color: "var(--ap-paper)",
                        transition: "background 0.2s",
                      }}
                    >
                      <span
                        className="ap-display"
                        style={{
                          fontSize: 22,
                          fontStyle: "italic",
                          letterSpacing: "-0.01em",
                          display: "block",
                        }}
                      >
                        AutoPost vs <span style={{ color: "var(--ap-stamp)" }}>{c.name}</span> →
                      </span>
                      <span
                        className="ap-mono"
                        style={{
                          marginTop: 8,
                          fontSize: 11,
                          color: "rgba(241,236,226,0.55)",
                          letterSpacing: "0.1em",
                          textTransform: "uppercase",
                          display: "block",
                        }}
                      >
                        {c.tagline}
                      </span>
                    </Link>
                  );
                })}
            </div>
            <style>{`@media (max-width: 640px) { .cmp-cross { grid-template-columns: 1fr !important; } .cmp-cross > a { border-right: none !important; border-bottom: 1px solid rgba(241,236,226,0.20); } .cmp-cross > a:last-child { border-bottom: none; } }`}</style>
          </div>
        </section>
      </main>

      {/* Footer mínimo */}
      <footer
        style={{
          padding: "32px clamp(20px, 5vw, 56px)",
          borderTop: "1px solid var(--ap-line)",
          textAlign: "center",
        }}
      >
        <Logo size={14} />
        <p
          className="ap-mono"
          style={{
            marginTop: 18,
            fontSize: 10,
            color: "var(--ap-ink-4)",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
          }}
        >
          ✦ AUTOPOST · MMXXVI
        </p>
      </footer>
    </div>
  );
}

function Cell({ value, stamp }: { value: boolean | string; stamp?: boolean }) {
  if (value === true) {
    return (
      <td
        style={{
          padding: "14px 16px",
          textAlign: "center",
          background: stamp ? "rgba(229,75,38,0.04)" : "transparent",
        }}
      >
        <span style={{ display: "inline-flex", alignItems: "center" }}>
          <Icon
            name="check"
            size={16}
            c={stamp ? "var(--ap-stamp)" : "var(--ap-olive)"}
            sw={1.8}
          />
        </span>
      </td>
    );
  }
  if (value === false) {
    return (
      <td
        style={{
          padding: "14px 16px",
          textAlign: "center",
          background: stamp ? "rgba(229,75,38,0.04)" : "transparent",
        }}
      >
        <span style={{ display: "inline-flex", alignItems: "center" }}>
          <Icon name="x" size={16} c="var(--ap-ink-4)" sw={1.5} />
        </span>
      </td>
    );
  }
  // string value (e.g. "Próximo", "Roadmap Q3", "$15/mes")
  return (
    <td
      style={{
        padding: "14px 16px",
        textAlign: "center",
        background: stamp ? "rgba(229,75,38,0.04)" : "transparent",
      }}
    >
      <span
        className="ap-mono"
        style={{
          fontSize: 11,
          color: stamp ? "var(--ap-stamp)" : "var(--ap-ink-3)",
          letterSpacing: "0.06em",
          fontStyle: "normal",
          fontWeight: stamp ? 600 : 400,
        }}
      >
        {value}
      </span>
    </td>
  );
}
