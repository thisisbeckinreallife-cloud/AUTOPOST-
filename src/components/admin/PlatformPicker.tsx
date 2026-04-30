"use client";

/**
 * PlatformPicker — selector multi-plataforma para un PostDraft.
 *
 * Estados por plataforma:
 *   - selected: ✓ stamp filled
 *   - available (no selected): ☐ outline
 *   - not connected: dashed con tooltip "conecta primero en Configuración"
 *   - in beta (productionMode=false): label "beta · sólo testers"
 *
 * Auto-save al toggle: PATCH /api/posts/{id} con targetPlatforms + publishToMeta.
 *
 * El componente solo se muestra si el post está en estado editable
 * (DRAFT/VALIDATED/READY) — para SCHEDULED+ se muestra read-only.
 */
import { useState } from "react";
import { Instagram, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import type { SocialPlatform } from "@prisma/client";

interface PlatformConnectionInfo {
  platform: SocialPlatform;
  displayName: string;
  icon: string;
  available: boolean; // env vars configuradas
  productionMode: boolean; // review aprobado
  connection: {
    username: string | null;
    displayName: string | null;
    status: string;
  } | null;
}

interface Props {
  postId: string;
  editable: boolean;
  initialTargetPlatforms: SocialPlatform[];
  initialPublishToMeta: boolean;
  metaConnected: boolean;
  metaUsername: string | null;
  socialConnections: PlatformConnectionInfo[];
}

export function PlatformPicker({
  postId,
  editable,
  initialTargetPlatforms,
  initialPublishToMeta,
  metaConnected,
  metaUsername,
  socialConnections,
}: Props) {
  const { toast } = useToast();
  const [targetPlatforms, setTargetPlatforms] = useState<SocialPlatform[]>(
    initialTargetPlatforms,
  );
  const [publishToMeta, setPublishToMeta] = useState(initialPublishToMeta);
  const [saving, setSaving] = useState<string | null>(null);

  async function persistTargetPlatforms(next: SocialPlatform[]) {
    setSaving("targetPlatforms");
    try {
      const res = await fetch(`/api/posts/${postId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetPlatforms: next }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast(data.error ?? "No se pudo guardar", "error");
        // Rollback UI
        setTargetPlatforms(initialTargetPlatforms);
        return;
      }
      toast("Plataformas actualizadas", "success");
    } catch {
      toast("Error de red", "error");
      setTargetPlatforms(initialTargetPlatforms);
    } finally {
      setSaving(null);
    }
  }

  async function persistPublishToMeta(value: boolean) {
    setSaving("publishToMeta");
    try {
      const res = await fetch(`/api/posts/${postId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publishToMeta: value }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast(data.error ?? "No se pudo guardar", "error");
        setPublishToMeta(initialPublishToMeta);
        return;
      }
      toast("Meta toggle actualizado", "success");
    } catch {
      toast("Error de red", "error");
      setPublishToMeta(initialPublishToMeta);
    } finally {
      setSaving(null);
    }
  }

  function togglePlatform(platform: SocialPlatform) {
    if (!editable) return;
    const next = targetPlatforms.includes(platform)
      ? targetPlatforms.filter((p) => p !== platform)
      : [...targetPlatforms, platform];
    setTargetPlatforms(next);
    persistTargetPlatforms(next);
  }

  function toggleMeta() {
    if (!editable) return;
    const next = !publishToMeta;
    setPublishToMeta(next);
    persistPublishToMeta(next);
  }

  return (
    <div
      style={{
        background: "var(--ap-paper-2)",
        border: "1px solid var(--ap-line-2)",
        padding: 18,
      }}
    >
      <p
        className="ap-mono"
        style={{
          fontSize: 10,
          color: "var(--ap-ink-4)",
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          margin: "0 0 14px",
        }}
      >
        ✦ Plataformas destino {!editable && "· read-only"}
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {/* Meta legacy (Instagram + Facebook) */}
        <PlatformRow
          icon={<Instagram strokeWidth={1.5} className="h-4 w-4" />}
          label="Instagram + Facebook"
          subtitle={
            metaConnected
              ? `@${metaUsername ?? "conectado"}`
              : "Sin conexión Meta"
          }
          available={metaConnected}
          checked={publishToMeta && metaConnected}
          editable={editable && metaConnected}
          saving={saving === "publishToMeta"}
          onToggle={toggleMeta}
        />

        {/* Plataformas no-Meta */}
        {socialConnections.map((p) => {
          const connected = p.connection?.status === "ACTIVE";
          const available = connected && p.available;
          const inBeta = available && !p.productionMode;
          const checked = targetPlatforms.includes(p.platform);

          return (
            <PlatformRow
              key={p.platform}
              icon={
                <span
                  style={{
                    width: 16,
                    height: 16,
                    fontSize: 14,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {p.icon}
                </span>
              }
              label={p.displayName}
              subtitle={
                connected
                  ? `${p.connection?.displayName ?? p.connection?.username ?? "conectado"}${inBeta ? " · beta" : ""}`
                  : !p.available
                    ? "No disponible"
                    : "No conectado · ve a Configuración"
              }
              available={available}
              checked={checked}
              editable={editable && available}
              saving={saving === "targetPlatforms"}
              onToggle={() => togglePlatform(p.platform)}
            />
          );
        })}
      </div>

      <p
        style={{
          marginTop: 14,
          fontSize: 11,
          color: "var(--ap-ink-3)",
          fontStyle: "italic",
          lineHeight: 1.4,
        }}
      >
        El post se publica simultáneamente en cada plataforma marcada cuando
        llegue su hora programada. Si una plataforma falla, las demás siguen.
      </p>
    </div>
  );
}

function PlatformRow({
  icon,
  label,
  subtitle,
  available,
  checked,
  editable,
  saving,
  onToggle,
}: {
  icon: React.ReactNode;
  label: string;
  subtitle: string;
  available: boolean;
  checked: boolean;
  editable: boolean;
  saving: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={!editable || saving}
      style={{
        all: "unset",
        cursor: editable && !saving ? "pointer" : "default",
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 12px",
        background: "var(--ap-paper)",
        border: checked
          ? "1px solid var(--ap-stamp)"
          : available
            ? "1px solid var(--ap-line-2)"
            : "1px dashed var(--ap-line-2)",
        opacity: available ? 1 : 0.55,
      }}
      aria-pressed={checked}
    >
      <span
        style={{
          width: 18,
          height: 18,
          flexShrink: 0,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          background: checked ? "var(--ap-stamp)" : "transparent",
          border: checked
            ? "1px solid var(--ap-stamp)"
            : "1px solid var(--ap-line-2)",
          color: checked ? "var(--ap-paper)" : "transparent",
          fontFamily: "var(--ap-font-mono)",
          fontSize: 11,
          fontWeight: 700,
        }}
        aria-hidden="true"
      >
        {checked ? "✓" : ""}
      </span>
      <span
        style={{
          width: 22,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--ap-ink-2)",
        }}
      >
        {icon}
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span
          style={{
            display: "block",
            fontSize: 13,
            color: "var(--ap-ink)",
            fontWeight: 600,
          }}
        >
          {label}
        </span>
        <span
          className="ap-mono"
          style={{
            display: "block",
            fontSize: 10,
            color: "var(--ap-ink-3)",
            letterSpacing: "0.08em",
            marginTop: 2,
          }}
        >
          {subtitle}
        </span>
      </span>
      {saving && (
        <Loader2 className="h-3.5 w-3.5 animate-spin" style={{ color: "var(--ap-ink-4)" }} />
      )}
    </button>
  );
}
