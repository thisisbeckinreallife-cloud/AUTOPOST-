import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSession, hashPassword } from "@/lib/auth";
import { sendEmail, welcomeEmailHtml } from "@/lib/email";

const signupSchema = z
  .object({
    email: z.string().email("Email no valido"),
    password: z.string().min(8, "Minimo 8 caracteres"),
    passwordConfirm: z.string(),
  })
  .refine((d) => d.password === d.passwordConfirm, {
    message: "Las contrasenas no coinciden",
    path: ["passwordConfirm"],
  });

// Simple in-memory rate limit: 5 signups per IP per hour
const ipAttempts = new Map<string, number[]>();
const RATE_LIMIT = 5;
const RATE_WINDOW = 60 * 60 * 1000; // 1 hour

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const attempts = (ipAttempts.get(ip) ?? []).filter(
    (t) => now - t < RATE_WINDOW
  );
  ipAttempts.set(ip, attempts);
  return attempts.length >= RATE_LIMIT;
}

function recordAttempt(ip: string) {
  const attempts = ipAttempts.get(ip) ?? [];
  attempts.push(Date.now());
  ipAttempts.set(ip, attempts);
}

export async function POST(request: NextRequest) {
  try {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      "unknown";

    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: "Demasiados intentos. Intenta de nuevo mas tarde." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const parsed = signupSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos no validos", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;

    // Check if email exists — generic error to prevent enumeration
    const existing = await db.adminUser.findUnique({ where: { email } });
    if (existing) {
      // Deliberate delay to match timing of successful signup
      await new Promise((r) => setTimeout(r, 300));
      return NextResponse.json(
        { error: "No se pudo crear la cuenta. Verifica los datos e intenta de nuevo." },
        { status: 400 }
      );
    }

    recordAttempt(ip);

    const passwordHash = await hashPassword(password);
    const user = await db.adminUser.create({
      data: { email, passwordHash, emailVerified: false },
    });

    // Create session immediately
    const session = await getSession();
    session.adminUserId = user.id;
    session.email = user.email;
    session.isLoggedIn = true;
    await session.save();

    // Send welcome email (non-blocking)
    sendEmail(email, "Bienvenido a AutoPost", welcomeEmailHtml({ email })).catch(
      () => {}
    );

    return NextResponse.json({ ok: true, email: user.email });
  } catch (err) {
    console.error("[Auth] Signup error:", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
