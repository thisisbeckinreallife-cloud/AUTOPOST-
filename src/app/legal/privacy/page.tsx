import type { Metadata } from "next";
import Link from "next/link";
import { LegalTitle, Section, Para, List, Item, Strong } from "../_components";

export const metadata: Metadata = {
  title: "Política de Privacidad — AutoPost",
  description:
    "Cómo AutoPost trata tus datos personales, los tokens OAuth de tus redes sociales y el contenido que subes.",
  robots: { index: true, follow: true },
};

export default function PrivacyPage() {
  return (
    <article>
      <LegalTitle
        index="01"
        kicker="POLÍTICA DE PRIVACIDAD"
        title={
          // eslint-disable-next-line react/no-unescaped-entities
          "Tus datos, en claro."
        }
        lede="Esto es lo que recogemos, por qué lo recogemos, con quién lo compartimos y qué puedes hacer al respecto. Sin letra pequeña."
        updated="30 de abril de 2026"
      />

      <Section number="1" title="Quién es el responsable">
        <Para>
          AutoPost es operado por <Strong>Eric Munteanu</Strong> (en adelante,
          "AutoPost", "nosotros"), con domicilio en España. Para cualquier
          consulta sobre privacidad, escríbenos a{" "}
          <Strong>privacy@autopost.app</Strong>.
        </Para>
      </Section>

      <Section number="2" title="Qué datos recogemos">
        <Para>
          Recogemos únicamente lo necesario para que el servicio funcione:
        </Para>
        <List>
          <Item>
            <Strong>Datos de cuenta:</Strong> email y hash de contraseña (nunca
            la contraseña en claro). Generado al hacer signup.
          </Item>
          <Item>
            <Strong>Datos de tu negocio:</Strong> nombre, slug, zona horaria,
            descripción y, opcionalmente, perfil de marca (nicho, tono,
            audiencia objetivo) que tú introduces voluntariamente.
          </Item>
          <Item>
            <Strong>Tokens OAuth de redes sociales:</Strong> cuando conectas
            Instagram, Facebook, TikTok, LinkedIn, YouTube o Pinterest,
            guardamos los access/refresh tokens emitidos por cada plataforma.
            <Strong> Están cifrados en reposo con AES-256-GCM</Strong> y solo se
            descifran en el momento de hacer una llamada autorizada al
            proveedor.
          </Item>
          <Item>
            <Strong>Contenido que subes:</Strong> imágenes, videos, captions y
            metadatos (`meta.json`) de tus posts. Se almacenan en
            Cloudflare R2 con acceso restringido por URL firmada o público
            según configuración del bucket.
          </Item>
          <Item>
            <Strong>Audit logs:</Strong> registros de acciones (login, conexión
            social, post publicado, error) con fecha, IP, ID de admin user y
            metadata del evento. Necesarios para depuración y seguridad.
          </Item>
          <Item>
            <Strong>Conversaciones con la IA editorial:</Strong> los mensajes
            que envías al chat de AutoPost se persisten para que puedas
            retomar la conversación y para auditar el comportamiento del
            modelo.
          </Item>
          <Item>
            <Strong>Datos de pago:</Strong> si te suscribes a un plan,
            procesamos los pagos vía Stripe. Nosotros guardamos únicamente el
            ID de cliente y el ID de suscripción de Stripe — los datos de
            tarjeta nunca tocan nuestros servidores.
          </Item>
        </List>
      </Section>

      <Section number="3" title="Para qué los usamos">
        <List>
          <Item>
            Operar el servicio: programar tus posts, publicarlos en las
            plataformas que conectes y mostrarte el resultado.
          </Item>
          <Item>
            Enriquecer el chat IA con tu perfil de marca para que las
            sugerencias suenen a ti.
          </Item>
          <Item>
            Enviarte notificaciones transaccionales (post publicado, fallo,
            magic-link de aprobación). Nunca te enviaremos newsletters sin tu
            consentimiento explícito.
          </Item>
          <Item>Cumplir con obligaciones legales y fiscales.</Item>
          <Item>
            Detectar abuso, fraude y comportamiento anómalo para proteger la
            integridad del servicio.
          </Item>
        </List>
      </Section>

      <Section number="4" title="Base legal">
        <Para>
          Tratamos tus datos bajo las siguientes bases del{" "}
          <Strong>RGPD (Reglamento UE 2016/679)</Strong>:
        </Para>
        <List>
          <Item>
            <Strong>Ejecución de contrato:</Strong> para prestarte el servicio
            que has contratado.
          </Item>
          <Item>
            <Strong>Consentimiento:</Strong> para procesar tus tokens OAuth
            (lo das al pulsar "Conectar" en cada red social) y para
            cualquier uso accesorio.
          </Item>
          <Item>
            <Strong>Interés legítimo:</Strong> para los audit logs y la
            seguridad del servicio.
          </Item>
          <Item>
            <Strong>Obligación legal:</Strong> para conservar facturación y
            registros fiscales.
          </Item>
        </List>
      </Section>

      <Section number="5" title="Con quién los compartimos">
        <Para>
          Tu contenido es tuyo. No vendemos datos a terceros. Compartimos lo
          mínimo imprescindible con los siguientes encargados de tratamiento:
        </Para>
        <List>
          <Item>
            <Strong>Cloudflare R2</Strong> (almacenamiento de medios y
            metadatos).
          </Item>
          <Item>
            <Strong>Railway</Strong> (hosting de la aplicación y la base de
            datos PostgreSQL).
          </Item>
          <Item>
            <Strong>Together.AI</Strong> y <Strong>Anthropic</Strong>{" "}
            (proveedores de modelos de IA — los mensajes y metadatos de tu
            chat se envían para generar respuestas; no entrenan modelos con
            ellos).
          </Item>
          <Item>
            <Strong>Meta (Instagram, Facebook), TikTok, LinkedIn, Google
            (YouTube), Pinterest:</Strong>{" "}
            cuando publicas, enviamos el media + caption a la API oficial del
            proveedor que tú elijas.
          </Item>
          <Item>
            <Strong>Stripe</Strong> (procesador de pagos, cuando aplique).
          </Item>
          <Item>
            <Strong>Proveedor de email transaccional</Strong> (cuando esté
            configurado, para enviarte avisos de publicación o fallo).
          </Item>
        </List>
        <Para>
          Todos los encargados están sujetos a contratos DPA y, cuando
          procesan datos fuera del EEE, usan cláusulas tipo de la Comisión
          Europea como garantía adecuada.
        </Para>
      </Section>

      <Section number="6" title="Cuánto tiempo los guardamos">
        <List>
          <Item>
            <Strong>Datos de cuenta:</Strong> mientras tengas la cuenta activa
            + 30 días tras la baja para confirmar la eliminación.
          </Item>
          <Item>
            <Strong>Tokens OAuth:</Strong> hasta que desconectes la red social
            o caduque el token. Tras desconexión, se eliminan de forma
            inmediata.
          </Item>
          <Item>
            <Strong>Contenido (medios y captions):</Strong> mientras dure tu
            cuenta. Puedes solicitar borrado total en cualquier momento.
          </Item>
          <Item>
            <Strong>Audit logs:</Strong> 12 meses, después se anonimizan.
          </Item>
          <Item>
            <Strong>Datos fiscales:</Strong> 4 años (obligación legal).
          </Item>
        </List>
      </Section>

      <Section number="7" title="Tus derechos">
        <Para>
          Tienes derecho a <Strong>acceder</Strong>, <Strong>rectificar</Strong>,{" "}
          <Strong>suprimir</Strong>, <Strong>portar</Strong>, <Strong>oponerte</Strong>{" "}
          al tratamiento y <Strong>limitar</Strong> el uso de tus datos.
          Para ejercer cualquiera de estos derechos, escribe a{" "}
          <Strong>privacy@autopost.app</Strong> — responderemos en menos de
          30 días.
        </Para>
        <Para>
          Si crees que estamos tratando tus datos de forma indebida, puedes
          presentar una reclamación ante la{" "}
          <a
            href="https://www.aepd.es"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "var(--ap-stamp)", textDecoration: "underline" }}
          >
            Agencia Española de Protección de Datos
          </a>
          .
        </Para>
      </Section>

      <Section number="8" title="Seguridad">
        <List>
          <Item>Cifrado AES-256-GCM para tokens OAuth en reposo.</Item>
          <Item>TLS 1.3 obligatorio en tránsito.</Item>
          <Item>
            Hashes Argon2id para contraseñas (nunca guardamos la contraseña
            en claro).
          </Item>
          <Item>
            Acceso a la base de datos restringido a la red privada de
            Railway.
          </Item>
          <Item>
            Audit logs de todas las acciones administrativas.
          </Item>
        </List>
        <Para>
          Si detectas una vulnerabilidad, escríbenos a{" "}
          <Strong>security@autopost.app</Strong>.
        </Para>
      </Section>

      <Section number="9" title="Cookies">
        <Para>
          Usamos únicamente cookies estrictamente necesarias (sesión cifrada
          iron-session) y funcionales (recordar el tour de bienvenida en
          localStorage). No usamos cookies de tracking de terceros. Más
          detalle en nuestra{" "}
          <Link
            href="/legal/cookies"
            style={{ color: "var(--ap-stamp)", textDecoration: "underline" }}
          >
            política de cookies
          </Link>
          .
        </Para>
      </Section>

      <Section number="10" title="Cambios en esta política">
        <Para>
          Si actualizamos esta política te avisaremos por email al menos{" "}
          <Strong>14 días antes</Strong> de que el cambio entre en vigor. La
          fecha de "última actualización" en la cabecera siempre refleja la
          versión vigente.
        </Para>
      </Section>

      <Section number="11" title="Contacto">
        <Para>
          Para cualquier duda sobre esta política o el tratamiento de tus
          datos:{" "}
          <Strong>privacy@autopost.app</Strong>.
        </Para>
      </Section>
    </article>
  );
}
