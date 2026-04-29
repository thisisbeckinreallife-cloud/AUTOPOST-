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

export function welcomeEmailHtml({ email }: { email: string }) {
  return `
<!DOCTYPE html>
<html>
<body style="font-family:system-ui,sans-serif;background:#0B1120;color:#F1F5F9;max-width:520px;margin:0 auto;padding:24px;">
  <div style="background:#162032;border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:24px;">
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:20px;">
      <span style="font-size:20px;">⚡</span>
      <span style="font-weight:700;font-size:16px;">Bienvenido a Aluminum Studio</span>
    </div>
    <p style="color:#94A3B8;font-size:14px;margin:0 0 16px;">Tu cuenta ha sido creada con el email:</p>
    <p style="font-weight:600;margin:0 0 16px;">${email}</p>
    <p style="color:#94A3B8;font-size:14px;margin:0 0 20px;">Ya puedes conectar tu cuenta de Instagram y programar tu primer mes de contenido en 2 minutos.</p>
    <a href="${process.env.NEXT_PUBLIC_APP_URL ?? "https://autopost.app"}/dashboard" style="display:inline-block;background:#F59E0B;color:#0B1120;padding:10px 20px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:700;">Ir al dashboard →</a>
  </div>
  <p style="color:#334155;font-size:11px;text-align:center;margin-top:16px;">Aluminum Studio · Despliegue masivo de Instagram</p>
</body>
</html>`;
}

export function resetPasswordEmailHtml({ resetUrl }: { resetUrl: string }) {
  return `
<!DOCTYPE html>
<html>
<body style="font-family:system-ui,sans-serif;background:#0B1120;color:#F1F5F9;max-width:520px;margin:0 auto;padding:24px;">
  <div style="background:#162032;border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:24px;">
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:20px;">
      <span style="font-size:20px;">🔐</span>
      <span style="font-weight:700;font-size:16px;">Recuperar contrasena</span>
    </div>
    <p style="color:#94A3B8;font-size:14px;margin:0 0 16px;">Has solicitado restablecer tu contrasena. Haz clic en el boton para crear una nueva:</p>
    <a href="${resetUrl}" style="display:inline-block;background:#F59E0B;color:#0B1120;padding:10px 20px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:700;margin-bottom:16px;">Restablecer contrasena →</a>
    <p style="color:#64748B;font-size:12px;margin:16px 0 0;">Este enlace expira en 1 hora. Si no solicitaste este cambio, ignora este email.</p>
  </div>
  <p style="color:#334155;font-size:11px;text-align:center;margin-top:16px;">Aluminum Studio · Despliegue masivo de Instagram</p>
</body>
</html>`;
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
  return `
<!DOCTYPE html>
<html>
<body style="font-family:system-ui,sans-serif;background:#0B1120;color:#F1F5F9;max-width:520px;margin:0 auto;padding:24px;">
  <div style="background:#162032;border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:24px;">
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:20px;">
      <span style="font-size:20px;">✅</span>
      <span style="font-weight:700;font-size:16px;">Post publicado en Instagram</span>
    </div>
    <p style="color:#94A3B8;font-size:14px;margin:0 0 8px;">Cuenta</p>
    <p style="font-weight:600;margin:0 0 16px;">${businessName}</p>
    <p style="color:#94A3B8;font-size:14px;margin:0 0 8px;">Caption</p>
    <p style="background:rgba(255,255,255,0.04);border-radius:8px;padding:12px;font-size:13px;color:#CBD5E1;margin:0 0 16px;">${captionExcerpt}</p>
    <p style="color:#64748B;font-size:12px;margin:0 0 16px;">Publicado: ${publishedAt}</p>
    ${permalink ? `<a href="${permalink}" style="display:inline-block;background:#F59E0B;color:#0B1120;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600;">Ver en Instagram →</a>` : ""}
  </div>
  <p style="color:#334155;font-size:11px;text-align:center;margin-top:16px;">Aluminum Studio · Gestión de Instagram automatizada</p>
</body>
</html>`;
}

/**
 * Email editorial para solicitar aprobación de un post a un cliente.
 * Estética print-zine: papel #F1ECE2, tinta #14110D, sello tomate #E54B26.
 * Se renderiza en modo seguro para clientes de email — solo inline styles,
 * sin web fonts (los clientes de email saltan a system-serif sin Instrument
 * Serif, asumimos esa pérdida).
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
  const safeCaption = captionExcerpt.replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const typeLabel =
    postType === "CAROUSEL"
      ? `Carrusel · ${mediaCount} piezas`
      : postType === "REEL"
        ? "Reel"
        : "Post sencillo";
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Solicitud de aprobación · ${businessName}</title>
</head>
<body style="margin:0;padding:0;background:#F1ECE2;font-family:Georgia,'Times New Roman',serif;color:#14110D;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F1ECE2;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#FFFFFF;border:1px solid #DCD3BF;">
          <tr>
            <td style="padding:32px 36px 8px;">
              <p style="margin:0;font-family:'Courier New',monospace;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#E54B26;">
                ✦ Edición · Aprobación
              </p>
              <h1 style="margin:10px 0 6px;font-family:Georgia,serif;font-size:32px;font-style:italic;line-height:1.05;color:#14110D;">
                Tu siguiente edición<br>
                <span style="font-style:italic;">espera tu firma</span>.
              </h1>
              <p style="margin:8px 0 0;font-size:13px;color:#6F6452;font-style:italic;">
                ${businessName} · ${typeLabel}
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 36px;">
              <hr style="border:none;border-top:1px solid #DCD3BF;margin:18px 0;">
            </td>
          </tr>
          <tr>
            <td style="padding:0 36px 8px;">
              <p style="margin:0 0 6px;font-family:'Courier New',monospace;font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:#6F6452;">
                Programado para
              </p>
              <p style="margin:0 0 16px;font-size:15px;color:#14110D;">
                ${scheduledFor}
              </p>
              <p style="margin:0 0 6px;font-family:'Courier New',monospace;font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:#6F6452;">
                Caption
              </p>
              <div style="background:#F1ECE2;border-left:2px solid #E54B26;padding:14px 16px;font-size:14px;line-height:1.55;color:#3D3528;font-style:italic;white-space:pre-wrap;">${safeCaption}</div>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:24px 36px 8px;">
              <a href="${approvalUrl}" style="display:inline-block;background:#E54B26;color:#F1ECE2;text-decoration:none;font-family:'Courier New',monospace;font-size:13px;letter-spacing:0.16em;text-transform:uppercase;padding:14px 28px;border:1.5px solid #14110D;">
                Revisar y aprobar →
              </a>
              <p style="margin:14px 0 0;font-size:12px;color:#6F6452;font-style:italic;">
                Sin necesidad de iniciar sesión.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 36px 32px;">
              <hr style="border:none;border-top:1px solid #DCD3BF;margin:0 0 14px;">
              <p style="margin:0;font-family:'Courier New',monospace;font-size:10px;letter-spacing:0.12em;text-transform:uppercase;color:#9C8E76;">
                Este enlace expira en ${expiresInHours} h · uso único
              </p>
            </td>
          </tr>
        </table>
        <p style="margin:14px 0 0;font-family:'Courier New',monospace;font-size:9px;letter-spacing:0.18em;text-transform:uppercase;color:#9C8E76;">
          ✦ AutoPost · Edición editorial
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
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
  return `
<!DOCTYPE html>
<html>
<body style="font-family:system-ui,sans-serif;background:#0B1120;color:#F1F5F9;max-width:520px;margin:0 auto;padding:24px;">
  <div style="background:#162032;border:1px solid rgba(239,68,68,0.15);border-radius:12px;padding:24px;">
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:20px;">
      <span style="font-size:20px;">❌</span>
      <span style="font-weight:700;font-size:16px;">Fallo al publicar un post</span>
    </div>
    <p style="color:#94A3B8;font-size:14px;margin:0 0 8px;">Cuenta</p>
    <p style="font-weight:600;margin:0 0 16px;">${businessName}</p>
    <p style="color:#94A3B8;font-size:14px;margin:0 0 8px;">Caption</p>
    <p style="background:rgba(255,255,255,0.04);border-radius:8px;padding:12px;font-size:13px;color:#CBD5E1;margin:0 0 16px;">${captionExcerpt}</p>
    <p style="color:#94A3B8;font-size:14px;margin:0 0 8px;">Error</p>
    <p style="background:rgba(239,68,68,0.08);border-radius:8px;padding:12px;font-size:13px;color:#FCA5A5;margin:0 0 16px;">${errorMessage}</p>
    <p style="color:#64748B;font-size:12px;">Programado para: ${scheduledFor}</p>
  </div>
  <p style="color:#334155;font-size:11px;text-align:center;margin-top:16px;">Aluminum Studio · Gestión de Instagram automatizada</p>
</body>
</html>`;
}
