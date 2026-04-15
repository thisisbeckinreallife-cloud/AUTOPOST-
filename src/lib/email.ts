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
      from: process.env.SMTP_FROM ?? "AutoPost <noreply@autopost.app>",
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
<body style="font-family:system-ui,sans-serif;background:#0D0D14;color:#F1F5F9;max-width:520px;margin:0 auto;padding:24px;">
  <div style="background:#161624;border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:24px;">
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:20px;">
      <span style="font-size:20px;">✅</span>
      <span style="font-weight:700;font-size:16px;">Post publicado en Instagram</span>
    </div>
    <p style="color:#94A3B8;font-size:14px;margin:0 0 8px;">Cuenta</p>
    <p style="font-weight:600;margin:0 0 16px;">${businessName}</p>
    <p style="color:#94A3B8;font-size:14px;margin:0 0 8px;">Caption</p>
    <p style="background:rgba(255,255,255,0.04);border-radius:8px;padding:12px;font-size:13px;color:#CBD5E1;margin:0 0 16px;">${captionExcerpt}</p>
    <p style="color:#64748B;font-size:12px;margin:0 0 16px;">Publicado: ${publishedAt}</p>
    ${permalink ? `<a href="${permalink}" style="display:inline-block;background:#7C3AED;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600;">Ver en Instagram →</a>` : ""}
  </div>
  <p style="color:#3F3F5A;font-size:11px;text-align:center;margin-top:16px;">AutoPost · Gestión de Instagram automatizada</p>
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
<body style="font-family:system-ui,sans-serif;background:#0D0D14;color:#F1F5F9;max-width:520px;margin:0 auto;padding:24px;">
  <div style="background:#161624;border:1px solid rgba(239,68,68,0.15);border-radius:12px;padding:24px;">
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
  <p style="color:#3F3F5A;font-size:11px;text-align:center;margin-top:16px;">AutoPost · Gestión de Instagram automatizada</p>
</body>
</html>`;
}
