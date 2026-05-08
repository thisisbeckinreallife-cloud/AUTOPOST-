/**
 * /api/account/password
 *
 * POST → cambia la contraseña del usuario logueado. Requiere conocer la
 *        contraseña actual (mitiga session hijack).
 */
import { NextResponse } from "next/server";
import { z } from "zod";
import { compare } from "bcryptjs";
import { db } from "@/lib/db";
import { requireSession, hashPassword } from "@/lib/auth";

export const runtime = "nodejs";

const Schema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(200),
});

export async function POST(req: Request) {
  try {
    const session = await requireSession();
    const body = await req.json().catch(() => ({}));
    const parsed = Schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    }

    const user = await db.adminUser.findUnique({
      where: { id: session.adminUserId },
      select: { id: true, passwordHash: true, provider: true },
    });
    if (!user) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

    if (!user.passwordHash) {
      return NextResponse.json(
        { error: "Esta cuenta usa Google. Crea una contraseña primero desde 'Olvidé contraseña'." },
        { status: 400 },
      );
    }

    const valid = await compare(parsed.data.currentPassword, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "La contraseña actual no es correcta." }, { status: 400 });
    }

    const newHash = await hashPassword(parsed.data.newPassword);
    await db.adminUser.update({
      where: { id: user.id },
      data: { passwordHash: newHash },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    console.error("[/api/account/password]", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
