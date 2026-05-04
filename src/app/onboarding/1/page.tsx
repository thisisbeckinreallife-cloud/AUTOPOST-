"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { StepShell } from "@/components/onboarding/StepShell";
import { Button } from "@/components/brand/Button";
import { Input } from "@/components/brand/Input";
import { AuthError } from "@/components/auth/AuthError";

const SECTORS = [
  "Comercio local / tienda",
  "Restaurante / bar / cafetería",
  "Servicios profesionales",
  "Salud / belleza",
  "Educación / formación",
  "Marca personal / creator",
  "Ecommerce",
  "Inmobiliaria",
  "Agencia / freelance",
  "Otro",
];

export default function OnboardingStep1() {
  const router = useRouter();
  const [name, setName] = React.useState("");
  const [businessName, setBusinessName] = React.useState("");
  const [businessType, setBusinessType] = React.useState("");
  const [errors, setErrors] = React.useState<{ name?: string; businessName?: string; businessType?: string }>({});
  const [serverError, setServerError] = React.useState<string | undefined>();
  const [loading, setLoading] = React.useState(false);

  function skip() {
    if (confirm("¿Saltar la guía? Te perderás los pasos para publicar tu primer post en menos de 10 minutos.")) {
      void fetch("/api/onboarding/complete", { method: "POST" }).then(() => router.push("/dashboard"));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const newErrors: typeof errors = {};
    if (name && name.trim().length < 2) newErrors.name = "Demasiado corto. Pon tu nombre completo.";
    if (businessName.trim().length < 2) newErrors.businessName = "Pon el nombre de tu negocio o marca.";
    if (!businessType) newErrors.businessType = "Elige tu sector.";
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setLoading(true);
    setServerError(undefined);
    try {
      const res = await fetch("/api/onboarding/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() || undefined, businessName: businessName.trim(), businessType }),
      });
      if (!res.ok) {
        setServerError("No pudimos guardar tus datos. Inténtalo en un momento.");
        setLoading(false);
        return;
      }
      router.push("/onboarding/2");
    } catch {
      setServerError("Sin conexión. Revisa internet y vuelve a probar.");
      setLoading(false);
    }
  }

  return (
    <StepShell
      step={1}
      title="Cuéntanos de ti"
      sub="Esto nos ayuda a personalizar tu panel y los textos que la IA escribirá."
      onSkip={skip}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        {serverError ? <AuthError message={serverError} /> : null}

        <Input
          label="Tu nombre (opcional)"
          id="ob-name"
          autoComplete="name"
          autoFocus
          placeholder="María García"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={errors.name}
          hint="Lo usamos para saludarte: 'Hola María.'"
        />

        <Input
          label="Nombre del negocio o marca"
          id="ob-business"
          placeholder="Mi tienda · Cofreshop · Treintayocho..."
          value={businessName}
          onChange={(e) => setBusinessName(e.target.value)}
          error={errors.businessName}
          required
        />

        <div className="flex flex-col gap-2">
          <label htmlFor="ob-sector" className="text-np-caption font-medium text-ink-7 uppercase tracking-wider">
            Sector
          </label>
          <select
            id="ob-sector"
            value={businessType}
            onChange={(e) => setBusinessType(e.target.value)}
            className="w-full h-12 rounded-lg bg-ink-0 border border-ink-3 text-np-body text-ink-9 px-4 hover:border-ink-4 focus:border-pri focus:outline-none focus:shadow-[0_0_0_3px_rgba(79,124,255,0.15)] transition-all appearance-none"
            style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12' fill='none'%3E%3Cpath d='M3 4.5L6 7.5L9 4.5' stroke='%23A8A8BD' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 14px center" }}
          >
            <option value="" disabled>Elige uno</option>
            {SECTORS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          {errors.businessType ? (
            <span className="text-np-caption text-[color:var(--np-error)] font-np-mono" role="alert">
              {errors.businessType}
            </span>
          ) : null}
        </div>

        <Button type="submit" variant="primary" size="lg" loading={loading} fullWidth className="mt-2">
          Continuar
          <span aria-hidden="true">→</span>
        </Button>
      </form>
    </StepShell>
  );
}
