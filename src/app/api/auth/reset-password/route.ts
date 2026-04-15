import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createHash } from "crypto";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth";

const schema = z
  .object({
    token: z.string().min(1),
    password: z.string().min(8, "Minimo 8 caracteres"),
    passwordConfirm: z.string(),
  })
  .refine((d) => d.password === d.passwordConfirm, {
    message: "Las contrasenas no coinciden",
    path: ["passwordConfirm"],
  });

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos no validos", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { token, password } = parsed.data;

    const hashedToken = createHash("sha256").update(token).digest("hex");

    const user = await db.adminUser.findFirst({
      where: {
        resetToken: hashedToken,
        resetTokenExp: { gt: new Date() },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Enlace invalido o expirado. Solicita uno nuevo." },
        { status: 400 }
      );
    }

    const newHash = await hashPassword(password);

    await db.adminUser.update({
      where: { id: user.id },
      data: {
        passwordHash: newHash,
        resetToken: null,
        resetTokenExp: null,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[Auth] Reset password error:", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
