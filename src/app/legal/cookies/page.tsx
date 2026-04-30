import type { Metadata } from "next";
import Link from "next/link";
import { LegalTitle, Section, Para, List, Item, Strong } from "../_components";

export const metadata: Metadata = {
  title: "Política de Cookies — AutoPost",
  description:
    "Las cookies que usamos, para qué sirven y cómo gestionarlas. Sin trackers de terceros.",
  robots: { index: true, follow: true },
};

export default function CookiesPage() {
  return (
    <article>
      <LegalTitle
        index="03"
        kicker="POLÍTICA DE COOKIES"
        title="Solo lo imprescindible."
        lede="No usamos cookies de tracking de terceros. No vendemos tus datos. Aquí va el desglose exacto de las que sí usamos."
        updated="30 de abril de 2026"
      />

      <Section number="1" title="Qué es una cookie">
        <Para>
          Una cookie es un archivo pequeño que un sitio web guarda en tu
          dispositivo para recordarte entre visitas. Algunas son
          imprescindibles para que el sitio funcione (por ejemplo,
          mantenerte logueado), otras son funcionales o de marketing.
        </Para>
        <Para>
          AutoPost solo usa cookies <Strong>estrictamente necesarias</Strong>
          {" "}y <Strong>funcionales</Strong>. Ninguna se comparte con
          anunciantes ni redes de tracking.
        </Para>
      </Section>

      <Section number="2" title="Cookies que usamos">
        <Para>Aquí va la lista completa:</Para>

        <div
          style={{
            margin: "16px 0 24px",
            border: "1px solid var(--ap-line-2)",
            background: "var(--ap-paper-2)",
          }}
        >
          <CookieRow
            name="ap_session"
            type="Estrictamente necesaria"
            purpose="Sesión cifrada (iron-session) que te mantiene logueado tras login. Sin esta cookie, tendrías que reintroducir email + contraseña en cada navegación."
            duration="7 días o hasta cerrar sesión"
            firstParty
          />
          <CookieRow
            name="oauth_state_{platform}"
            type="Estrictamente necesaria"
            purpose="Token CSRF temporal usado durante el flujo OAuth para conectar tus redes sociales (TikTok, LinkedIn, YouTube, Pinterest). Se elimina automáticamente tras completar el flujo."
            duration="10 minutos"
            firstParty
          />
        </div>

        <Para>
          Adicionalmente, AutoPost usa <Strong>localStorage</Strong> (no es
          cookie técnicamente) para recordar:
        </Para>
        <List>
          <Item>
            <Strong>autopost-tour-v1</Strong> — si ya viste el tour de
            bienvenida, para no mostrártelo cada vez. Tú puedes borrarlo
            desde DevTools si quieres ver el tour de nuevo.
          </Item>
        </List>
      </Section>

      <Section number="3" title="Cookies de terceros">
        <Para>
          <Strong>No usamos cookies de terceros</Strong> (Google Analytics,
          Facebook Pixel, hotjar, etc.) en la aplicación.
        </Para>
        <Para>
          Cuando completas un pago, eres redirigido a Stripe Checkout.
          Stripe, como procesador de pagos, puede establecer sus propias
          cookies en su dominio (no en el nuestro) para prevenir fraude y
          ofrecer su servicio. Más detalle en la{" "}
          <a
            href="https://stripe.com/cookies-policy/legal"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "var(--ap-stamp)", textDecoration: "underline" }}
          >
            política de cookies de Stripe
          </a>
          .
        </Para>
      </Section>

      <Section number="4" title="Cómo gestionarlas">
        <Para>
          Como solo usamos cookies estrictamente necesarias y funcionales,
          no mostramos un banner de consentimiento (no es obligatorio
          según la directiva ePrivacy para este tipo de cookies).
        </Para>
        <Para>
          Aún así, puedes:
        </Para>
        <List>
          <Item>
            <Strong>Bloquearlas desde tu navegador</Strong> en
            Configuración → Privacidad → Cookies. Si bloqueas las
            estrictamente necesarias, no podrás iniciar sesión ni conectar
            redes sociales.
          </Item>
          <Item>
            <Strong>Borrarlas en cualquier momento</Strong> desde la misma
            sección del navegador.
          </Item>
          <Item>
            <Strong>Cerrar sesión manualmente</Strong> desde el panel de
            Configuración para eliminar tu cookie de sesión.
          </Item>
        </List>
      </Section>

      <Section number="5" title="Cambios en esta política">
        <Para>
          Si en el futuro añadimos algún tipo de cookie adicional (por
          ejemplo analítica anónima), te avisaremos en la web y
          actualizaremos esta página. Cualquier cookie no esencial irá
          siempre con consentimiento expreso por tu parte.
        </Para>
      </Section>

      <Section number="6" title="Más información">
        <Para>
          Para más detalle sobre el tratamiento de tus datos personales,
          consulta nuestra{" "}
          <Link
            href="/legal/privacy"
            style={{ color: "var(--ap-stamp)", textDecoration: "underline" }}
          >
            Política de Privacidad
          </Link>
          {" "}o escríbenos a <Strong>privacy@autopost.app</Strong>.
        </Para>
      </Section>
    </article>
  );
}

function CookieRow({
  name,
  type,
  purpose,
  duration,
  firstParty,
}: {
  name: string;
  type: string;
  purpose: string;
  duration: string;
  firstParty?: boolean;
}) {
  return (
    <div
      style={{
        padding: "16px 18px",
        borderBottom: "1px solid var(--ap-line-2)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          gap: 12,
          flexWrap: "wrap",
          marginBottom: 8,
        }}
      >
        <code
          className="ap-mono"
          style={{
            fontSize: 13,
            color: "var(--ap-ink)",
            fontWeight: 600,
            letterSpacing: "0.04em",
          }}
        >
          {name}
        </code>
        <span
          className="ap-mono"
          style={{
            fontSize: 9,
            color: "var(--ap-ink-4)",
            letterSpacing: "0.16em",
            textTransform: "uppercase",
          }}
        >
          {firstParty ? "Propia · " : ""}
          {type}
        </span>
      </div>
      <p style={{ margin: "0 0 6px", fontSize: 14, color: "var(--ap-ink-2)", lineHeight: 1.55 }}>
        {purpose}
      </p>
      <p
        className="ap-mono"
        style={{
          margin: 0,
          fontSize: 10,
          color: "var(--ap-ink-4)",
          letterSpacing: "0.12em",
          textTransform: "uppercase",
        }}
      >
        Duración · {duration}
      </p>
    </div>
  );
}
