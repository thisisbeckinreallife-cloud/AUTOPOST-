import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createHash, randomUUID } from "crypto";
import { db } from "@/lib/db";
import { sendEmail, resetPasswordEmailHtml } from "@/lib/email";

const schema = z.object({
  email: z.string().email(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Email no valido" },
        { status: 400 }
      );
    }

    const { email } = parsed.data;

    // Always return OK to prevent email enumeration
    const user = await db.adminUser.findUnique({ where: { email } });

    if (user) {
      const plainToken = randomUUID();
      const hashedToken = createHash("sha256")
        .update(plainToken)
        .digest("hex");

      await db.adminUser.update({
        where: { id: user.id },
        data: {
          resetToken: hashedToken,
          resetTokenExp: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
        },
      });

      const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
      const resetUrl = `${baseUrl}/reset-password?token=${plainToken}`;

      sendEmail(
        email,
        "Recupera tu contrasena — AutoPost",
        resetPasswordEmailHtml({ resetUrl })
      ).catch(() => {});
    }

    // Always same response regardless of whether user exists
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[Auth] Forgot password error:", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
