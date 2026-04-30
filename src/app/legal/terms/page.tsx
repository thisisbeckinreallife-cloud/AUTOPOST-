import type { Metadata } from "next";
import Link from "next/link";
import { LegalTitle, Section, Para, List, Item, Strong } from "../_components";

export const metadata: Metadata = {
  title: "Términos de Servicio — AutoPost",
  description:
    "Las reglas del juego entre AutoPost y tú. Sin abogados de Hollywood, sin sorpresas.",
  robots: { index: true, follow: true },
};

export default function TermsPage() {
  return (
    <article>
      <LegalTitle
        index="02"
        kicker="TÉRMINOS DE SERVICIO"
        title="Las reglas del juego."
        lede="Lee esto antes de pulsar 'Crear cuenta'. Es corto, está en castellano de verdad y no tiene cláusulas escondidas."
        updated="30 de abril de 2026"
      />

      <Section number="1" title="Quiénes somos">
        <Para>
          AutoPost es un servicio operado por <Strong>Eric Munteanu</Strong>{" "}
          ("AutoPost", "nosotros") con domicilio en España. Estos términos
          regulan el uso de la aplicación accesible en{" "}
          <Strong>autopost.app</Strong> y dominios relacionados.
        </Para>
      </Section>

      <Section number="2" title="Aceptación">
        <Para>
          Al crear una cuenta, conectar una red social o subir contenido,
          aceptas estos términos. Si no estás de acuerdo con alguno, no uses
          el servicio.
        </Para>
      </Section>

      <Section number="3" title="Quién puede usar AutoPost">
        <List>
          <Item>
            Debes tener <Strong>16 años o más</Strong> y capacidad legal para
            contratar.
          </Item>
          <Item>
            Si usas AutoPost en nombre de una empresa, agencia o cliente,
            confirmas tener autoridad para hacerlo en su nombre.
          </Item>
          <Item>
            Una persona/empresa = una cuenta. No puedes crear varias cuentas
            para evadir límites.
          </Item>
        </List>
      </Section>

      <Section number="4" title="Qué hace AutoPost">
        <Para>
          AutoPost te permite subir carpetas de contenido (imágenes, videos
          y captions), programar su publicación y publicarlos
          automáticamente en las redes sociales que conectes mediante OAuth
          oficial: Instagram, Facebook, TikTok, LinkedIn, YouTube y
          Pinterest. Adicionalmente ofrece un asistente conversacional con
          IA editorial para sugerir captions, hashtags y calendarios.
        </Para>
      </Section>

      <Section number="5" title="Tu contenido">
        <List>
          <Item>
            <Strong>Es tuyo.</Strong> Conservas todos los derechos sobre
            las imágenes, videos, captions y datos que subas.
          </Item>
          <Item>
            <Strong>Nos das una licencia limitada</Strong> para almacenarlo,
            procesarlo y enviarlo a las redes sociales que tú elijas, solo
            con la finalidad de prestarte el servicio.
          </Item>
          <Item>
            Eres responsable de tener los derechos de todo lo que subas
            (imágenes, música, marcas, citas, fotos de personas con su
            consentimiento, etc.). Si terceros nos reclaman por contenido
            tuyo, te haces cargo.
          </Item>
          <Item>
            Eres responsable del cumplimiento de las normas de cada
            plataforma destino (community guidelines de Instagram, TikTok,
            etc.). Si una plataforma elimina tu post o te suspende la
            cuenta, no es responsabilidad nuestra.
          </Item>
        </List>
      </Section>

      <Section number="6" title="Uso aceptable">
        <Para>No puedes usar AutoPost para:</Para>
        <List>
          <Item>
            Publicar contenido ilegal, difamatorio, de odio, sexualmente
            explícito sin marcar, o que infrinja derechos de terceros.
          </Item>
          <Item>
            Spam, automatización abusiva, impersonation o manipulación de
            métricas.
          </Item>
          <Item>
            Hacer ingeniería inversa, scrapear o intentar saltarte los
            límites técnicos del servicio.
          </Item>
          <Item>
            Revender o redistribuir el servicio sin acuerdo previo por
            escrito.
          </Item>
        </List>
        <Para>
          Si detectamos un uso indebido, podemos suspender o cancelar tu
          cuenta sin reembolso.
        </Para>
      </Section>

      <Section number="7" title="Planes y facturación">
        <List>
          <Item>
            AutoPost cobra por <Strong>suscripción semanal</Strong> a través
            de Stripe. El precio del plan se muestra antes de confirmar la
            compra y la moneda es <Strong>EUR (€)</Strong>.
          </Item>
          <Item>
            <Strong>Solo</Strong> (€5/sem) — 1 cuenta de cada plataforma.
          </Item>
          <Item>
            <Strong>Pro</Strong> (€7/sem) — hasta 2 cuentas de cada
            plataforma.
          </Item>
          <Item>
            <Strong>Agency</Strong> (€10/sem) — hasta 5 cuentas de cada
            plataforma.
          </Item>
          <Item>
            La suscripción se renueva automáticamente cada semana hasta que
            la canceles. Puedes cancelar desde tu panel de configuración en
            cualquier momento — no aplicamos penalizaciones por baja.
          </Item>
          <Item>
            Si cancelas a mitad de un período, conservas el acceso hasta el
            final del período pagado. <Strong>No hacemos reembolsos
            parciales</Strong>, salvo obligación legal.
          </Item>
          <Item>
            Si subimos precios, te avisamos por email con al menos{" "}
            <Strong>14 días</Strong> de antelación. Podrás cancelar antes de
            que el cambio entre en vigor.
          </Item>
        </List>
      </Section>

      <Section number="8" title="Cancelación y baja">
        <Para>
          Puedes cancelar tu cuenta en cualquier momento desde el panel de
          configuración. Al cancelar:
        </Para>
        <List>
          <Item>
            Tus posts programados se mantienen hasta el fin del período
            pagado.
          </Item>
          <Item>
            Tus tokens OAuth se eliminan inmediatamente.
          </Item>
          <Item>
            Tu contenido (medios + captions) se elimina 30 días después de
            la baja, salvo que solicites un export antes.
          </Item>
        </List>
      </Section>

      <Section number="9" title="Cuentas inactivas">
        <Para>
          Si una cuenta lleva más de <Strong>180 días</Strong> sin actividad
          y sin suscripción activa, podemos eliminarla previo aviso por
          email con 14 días de antelación.
        </Para>
      </Section>

      <Section number="10" title="Disponibilidad y SLA">
        <Para>
          Hacemos lo razonable para mantener AutoPost disponible 24/7, pero
          no garantizamos un uptime específico. Las APIs de redes sociales
          (Meta, TikTok, YouTube, etc.) son terceros sobre los que no
          tenemos control — si una de ellas cambia su API, falla o
          suspende a tu cuenta, no es responsabilidad nuestra.
        </Para>
      </Section>

      <Section number="11" title="Limitación de responsabilidad">
        <Para>
          En la máxima medida permitida por la ley, AutoPost no será
          responsable de:
        </Para>
        <List>
          <Item>
            Pérdidas de ingresos, beneficios, oportunidades comerciales o
            datos derivadas del uso del servicio.
          </Item>
          <Item>
            Sanciones de plataformas terceras (Instagram, TikTok, etc.)
            sobre tu cuenta.
          </Item>
          <Item>
            Errores en el contenido generado por la IA (sugerencias de
            captions, calendarios, hashtags) — siempre revisa antes de
            publicar.
          </Item>
        </List>
        <Para>
          Nuestra responsabilidad agregada en cualquier caso queda limitada
          al importe que hayas pagado en los 3 meses anteriores al evento
          que motive la reclamación.
        </Para>
      </Section>

      <Section number="12" title="Cambios en el servicio o estos términos">
        <Para>
          Podemos modificar funcionalidades del servicio o estos términos.
          Si los cambios son significativos te avisaremos por email con al
          menos <Strong>14 días</Strong> de antelación. Si no estás de
          acuerdo, puedes cancelar tu cuenta antes de que entren en vigor.
        </Para>
      </Section>

      <Section number="13" title="Ley aplicable y jurisdicción">
        <Para>
          Estos términos se rigen por la <Strong>ley española</Strong>.
          Para cualquier disputa que no se resuelva amistosamente, las
          partes se someten a los <Strong>juzgados de la ciudad de
          domicilio del consumidor</Strong> en caso de relación con
          consumidor, o de Madrid en relaciones B2B.
        </Para>
      </Section>

      <Section number="14" title="Contacto">
        <Para>
          Para preguntas sobre estos términos:{" "}
          <Strong>legal@autopost.app</Strong>.
        </Para>
        <Para>
          Para política de privacidad y datos personales, consulta nuestra{" "}
          <Link
            href="/legal/privacy"
            style={{ color: "var(--ap-stamp)", textDecoration: "underline" }}
          >
            Política de Privacidad
          </Link>
          .
        </Para>
      </Section>
    </article>
  );
}
