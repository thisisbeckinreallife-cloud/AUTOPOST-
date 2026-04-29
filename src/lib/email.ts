/**
 * Email notification utility.
 * Configured via environment variables:
 *   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM, NOTIFY_EMAIL
 *
 * If SMTP_HOST is not set, emails are silently skipped (non-critical).
 */
import nodemailer from "nodemailer";

function createTransport() {
  const host = process.env.SMTP_HOST;
  if (!host) return null;

  return nodemailer.createTransport({
    host,
    port: parseInt(process.env.SMTP_PORT ?? "587", 10),
    secure: process.env.SMTP_PORT === "465",
    auth: {
      user: process.env.SMTP_USER ?? "",
      pass: process.env.SMTP_PASS ?? "",
    },
  });
}

export async function sendEmail(
  to: string,
  subject: string,
  html: string
): Promise<void> {
  const transport = createTransport();
  if (!transport) {
    console.log(`[email] SMTP not configured, skipping: ${subject}`);
    return;
  }

  try {
    await transport.sendMail({
      from: process.env.SMTP_FROM ?? "Aluminum Studio <noreply@autopost.app>",
      to,
      subject,
      html,
    });
    console.log(`[email] Sent "${subject}" → ${to}`);
  } catch (err) {
    // Email is non-critical — log but never throw
    console.error("[email] Failed to send:", err);
  }
}

// ─── Templates ────────────────────────────────────────────────────────────────
//
// Todas las plantillas usan el lenguaje editorial print-zine de AutoPost:
// papel #F1ECE2, tinta #14110D, sello tomate #E54B26, oliva #6B7A2E.
// Tipografías: Georgia/'Times New Roman' como fallback de Instrument Serif
// (los clientes de email no cargan webfonts), Courier New como fallback de
// JetBrains Mono. Layout sólo con `<table>` + inline styles para máxima
// compatibilidad (Outlook, Gmail, Apple Mail, Yahoo).

const EDITORIAL_COLORS = {
  paper: "#F1ECE2",
  paperWarm: "#FFFFFF",
  ink: "#14110D",
  ink2: "#3D3528",
  ink3: "#6F6452",
  ink4: "#9C8E76",
  line: "#DCD3BF",
  stamp: "#E54B26",
  olive: "#6B7A2E",
} as const;

interface EditorialEmailOpts {
  kicker: string;
  title: string;          // admite <i>...</i>
  lede?: string;
  bodyHtml: string;       // markup interno de la pieza
  cta?: { label: string; href: string };
  footerNote?: string;
}

function editorialEmailWrap(opts: EditorialEmailOpts): string {
  const { kicker, title, lede, bodyHtml, cta, footerNote } = opts;
  const c = EDITORIAL_COLORS;
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${kicker} · AutoPost</title>
</head>
<body style="margin:0;padding:0;background:${c.paper};font-family:Georgia,'Times New Roman',serif;color:${c.ink};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${c.paper};padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:${c.paperWarm};border:1px solid ${c.line};">
          <tr>
            <td style="padding:32px 36px 8px;">
              <p style="margin:0;font-family:'Courier New',monospace;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:${c.stamp};">
                ✦ ${kicker}
              </p>
              <h1 style="margin:10px 0 ${lede ? "8px" : "16px"};font-family:Georgia,serif;font-size:30px;font-style:italic;line-height:1.05;color:${c.ink};">
                ${title}
              </h1>
              ${lede ? `<p style="margin:8px 0 0;font-size:13px;color:${c.ink3};font-style:italic;">${lede}</p>` : ""}
            </td>
          </tr>
          <tr>
            <td style="padding:0 36px;">
              <hr style="border:none;border-top:1px solid ${c.line};margin:18px 0;">
            </td>
          </tr>
          <tr>
            <td style="padding:0 36px 8px;">
              ${bodyHtml}
            </td>
          </tr>
          ${
            cta
              ? `<tr>
            <td align="center" style="padding:24px 36px 8px;">
              <a href="${cta.href}" style="display:inline-block;background:${c.stamp};color:${c.paper};text-decoration:none;font-family:'Courier New',monospace;font-size:13px;letter-spacing:0.16em;text-transform:uppercase;padding:14px 28px;border:1.5px solid ${c.ink};">
                ${cta.label}
              </a>
            </td>
          </tr>`
              : ""
          }
          <tr>
            <td style="padding:24px 36px 32px;">
              <hr style="border:none;border-top:1px solid ${c.line};margin:0 0 14px;">
              <p style="margin:0;font-family:'Courier New',monospace;font-size:10px;letter-spacing:0.12em;text-transform:uppercase;color:${c.ink4};">
                ${footerNote ?? "AutoPost · Edición editorial"}
              </p>
            </td>
          </tr>
        </table>
        <p style="margin:14px 0 0;font-family:'Courier New',monospace;font-size:9px;letter-spacing:0.18em;text-transform:uppercase;color:${c.ink4};">
          ✦ AutoPost · La carpeta es el calendario
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function welcomeEmailHtml({ email }: { email: string }) {
  const c = EDITORIAL_COLORS;
  const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://autopost.app"}/dashboard`;
  return editorialEmailWrap({
    kicker: "Bienvenida · Edición 01",
    title: `Tu primera edición<br><i>empieza aquí</i>.`,
    lede: `Hola, ${escapeHtml(email)}.`,
    bodyHtml: `
      <p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:${c.ink2};">
        Conecta tu cuenta de Instagram, suelta tu carpeta del mes, y publicarás
        treinta posts en dos minutos. Sin numerar fotos. Sin pegar capciones.
      </p>
      <p style="margin:0;font-size:13px;color:${c.ink3};font-style:italic;">
        La carpeta es el calendario.
      </p>`,
    cta: { label: "Ir al dashboard →", href: dashboardUrl },
  });
}

export function resetPasswordEmailHtml({ resetUrl }: { resetUrl: string }) {
  const c = EDITORIAL_COLORS;
  return editorialEmailWrap({
    kicker: "Edición · Llave",
    title: `Una llave nueva<br><i>para tu redacción</i>.`,
    lede: "Has pedido restablecer tu contraseña.",
    bodyHtml: `
      <p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:${c.ink2};">
        Pulsa el botón para crear una contraseña nueva. Si no fuiste tú quien
        lo pidió, ignora este email — el enlace caduca en 1 hora.
      </p>`,
    cta: { label: "Restablecer contraseña →", href: resetUrl },
    footerNote: "Enlace de un solo uso · expira en 1 hora",
  });
}

export function publishedEmailHtml({
  businessName,
  captionExcerpt,
  permalink,
  publishedAt,
}: {
  businessName: string;
  captionExcerpt: string;
  permalink?: string;
  publishedAt: string;
}) {
  const c = EDITORIAL_COLORS;
  const safeCap = escapeHtml(captionExcerpt);
  return editorialEmailWrap({
    kicker: `${escapeHtml(businessName)} · Publicado`,
    title: `La edición<br><i>ha salido a calle</i>.`,
    lede: `Publicado el ${escapeHtml(publishedAt)}.`,
    bodyHtml: `
      <p style="margin:0 0 8px;font-family:'Courier New',monospace;font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:${c.ink4};">
        Caption
      </p>
      <div style="background:${c.paper};border-left:2px solid ${c.olive};padding:14px 16px;font-size:14px;line-height:1.55;color:${c.ink2};font-style:italic;white-space:pre-wrap;">${safeCap}</div>`,
    cta: permalink ? { label: "Ver en Instagram →", href: permalink } : undefined,
  });
}

/**
 * Email editorial para solicitar aprobación de un post a un cliente.
 * Reutiliza el wrapper editorial.
 */
export function approvalRequestEmailHtml({
  businessName,
  approvalUrl,
  postType,
  scheduledFor,
  expiresInHours,
  captionExcerpt,
  mediaCount,
}: {
  businessName: string;
  approvalUrl: string;
  postType: string;
  scheduledFor: string;
  expiresInHours: number;
  captionExcerpt: string;
  mediaCount: number;
}) {
  const c = EDITORIAL_COLORS;
  const safeCaption = escapeHtml(captionExcerpt);
  const typeLabel =
    postType === "CAROUSEL"
      ? `Carrusel · ${mediaCount} piezas`
      : postType === "REEL"
        ? "Reel"
        : "Post sencillo";

  return editorialEmailWrap({
    kicker: `${escapeHtml(businessName)} · Aprobación`,
    title: `Tu siguiente edición<br><i>espera tu firma</i>.`,
    lede: typeLabel,
    bodyHtml: `
      <p style="margin:0 0 6px;font-family:'Courier New',monospace;font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:${c.ink3};">
        Programado para
      </p>
      <p style="margin:0 0 16px;font-size:15px;color:${c.ink};">
        ${escapeHtml(scheduledFor)}
      </p>
      <p style="margin:0 0 6px;font-family:'Courier New',monospace;font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:${c.ink3};">
        Caption
      </p>
      <div style="background:${c.paper};border-left:2px solid ${c.stamp};padding:14px 16px;font-size:14px;line-height:1.55;color:${c.ink2};font-style:italic;white-space:pre-wrap;">${safeCaption}</div>`,
    cta: { label: "Revisar y aprobar →", href: approvalUrl },
    footerNote: `Enlace de un solo uso · expira en ${expiresInHours} h · sin login`,
  });
}

export function failedEmailHtml({
  businessName,
  captionExcerpt,
  errorMessage,
  scheduledFor,
}: {
  businessName: string;
  captionExcerpt: string;
  errorMessage: string;
  scheduledFor: string;
}) {
  const c = EDITORIAL_COLORS;
  const safeCap = escapeHtml(captionExcerpt);
  const safeErr = escapeHtml(errorMessage);
  return editorialEmailWrap({
    kicker: `${escapeHtml(businessName)} · Errata`,
    title: `Una edición<br><i>se quedó en imprenta</i>.`,
    lede: `Programada para ${escapeHtml(scheduledFor)}.`,
    bodyHtml: `
      <p style="margin:0 0 8px;font-family:'Courier New',monospace;font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:${c.ink4};">
        Caption
      </p>
      <div style="background:${c.paper};border-left:2px solid ${c.line};padding:12px 14px;font-size:14px;line-height:1.55;color:${c.ink2};font-style:italic;white-space:pre-wrap;margin:0 0 16px;">${safeCap}</div>

      <p style="margin:0 0 8px;font-family:'Courier New',monospace;font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:${c.stamp};">
        Errata
      </p>
      <div style="background:${c.paper};border-left:2px solid ${c.stamp};padding:12px 14px;font-size:13px;line-height:1.55;color:${c.ink2};white-space:pre-wrap;font-family:'Courier New',monospace;">${safeErr}</div>`,
    footerNote: "Reintenta desde el detalle del post",
  });
}
