import Link from "next/link";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { GoogleButton } from "@/components/auth/GoogleButton";
import { AuthDivider } from "@/components/auth/Divider";
import { isGoogleOAuthConfigured } from "@/lib/auth/google";
import { SignupForm } from "./SignupForm";

/**
 * /signup — Fase 2 plan funcional.
 *
 * Server Component: detecta si Google OAuth está configurado y pasa el flag.
 *
 * Mantiene contrato del backend:
 *   - POST /api/auth/signup con { email, password, passwordConfirm }
 *   - Crea sesión iron-session inmediatamente (no requiere email verification)
 *   - Redirect a /dashboard tras éxito
 *
 * NUEVO Fase 2:
 *   - UI brand
 *   - Botón Google OAuth
 *   - Acceptance terms checkbox
 *   - Microcopy en español plano
 *   - Validación cliente más amable (errores debajo del input)
 */
export default function SignupPage() {
  const showGoogle = isGoogleOAuthConfigured();

  return (
    <AuthLayout page="signup">
      <h1 className="font-np-sans text-np-h2 font-semibold text-ink-9 mb-2">
        Crea tu cuenta
      </h1>
      <p className="text-np-body text-ink-7 mb-8">
        Empieza a publicar en menos de 10 minutos.
      </p>

      {showGoogle ? (
        <>
          <GoogleButton from="/dashboard" />
          <AuthDivider label="O con email" />
        </>
      ) : null}

      <SignupForm />

      <p className="mt-8 text-center text-np-body text-ink-7">
        ¿Ya tienes cuenta?{" "}
        <Link
          href="/login"
          className="text-ink-9 font-medium border-b border-ink-4 hover:text-pri hover:border-pri transition-colors"
        >
          Entra aquí
        </Link>
      </p>
    </AuthLayout>
  );
}
