/**
 * GET  /api/settings/meta  → returns which keys are configured (no values)
 * POST /api/settings/meta  → save Meta App credentials
 * DELETE /api/settings/meta → remove DB-stored credentials (revert to env)
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { getConfigStatus, setConfig, deleteConfig } from "@/lib/config";

const saveSchema = z.object({
  META_APP_ID: z.string().min(1),
  META_APP_SECRET: z.string().optional(), // Optional: empty = keep existing
  META_REDIRECT_URI: z.string().url(),
});

export async function GET() {
  try {
    await requireSession();
    const status = await getConfigStatus();
    return NextResponse.json({ data: status });
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession();
    const body = await request.json();
    const parsed = saveSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Save credentials (secret is encrypted automatically; skip if empty = keep existing)
    const saves = [
      setConfig("META_APP_ID", parsed.data.META_APP_ID, "Meta App ID"),
      setConfig("META_REDIRECT_URI", parsed.data.META_REDIRECT_URI, "OAuth redirect URI"),
    ];
    if (parsed.data.META_APP_SECRET) {
      saves.push(setConfig("META_APP_SECRET", parsed.data.META_APP_SECRET, "Meta App Secret (encrypted)"));
    }
    await Promise.all(saves);

    // Audit log
    const { db } = await import("@/lib/db");
    await db.auditLog.create({
      data: {
        adminUserId: session.adminUserId,
        action: "META_APP_CONFIG_UPDATED",
        detail: {
          appId: parsed.data.META_APP_ID,
          redirectUri: parsed.data.META_REDIRECT_URI,
          // Never log the secret
        },
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const session = await requireSession();

    await Promise.all([
      deleteConfig("META_APP_ID"),
      deleteConfig("META_APP_SECRET"),
      deleteConfig("META_REDIRECT_URI"),
    ]);

    const { db } = await import("@/lib/db");
    await db.auditLog.create({
      data: {
        adminUserId: session.adminUserId,
        action: "META_APP_CONFIG_REMOVED",
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
