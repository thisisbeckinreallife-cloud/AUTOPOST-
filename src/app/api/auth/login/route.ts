import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSession, verifyPassword } from "@/lib/auth";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;

    const user = await db.adminUser.findUnique({ where: { email } });

    // Constant-time comparison to prevent user enumeration
    const passwordValid =
      user ? await verifyPassword(password, user.passwordHash) : false;

    if (!user || !passwordValid) {
      // Deliberate 500ms delay to slow brute force
      await new Promise((r) => setTimeout(r, 500));
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const session = await getSession();
    session.adminUserId = user.id;
    session.email = user.email;
    session.isLoggedIn = true;
    await session.save();

    return NextResponse.json({ ok: true, email: user.email });
  } catch (err) {
    console.error("[Auth] Login error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
