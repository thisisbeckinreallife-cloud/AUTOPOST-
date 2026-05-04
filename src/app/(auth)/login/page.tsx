import { Suspense } from "react";
import Link from "next/link";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { GoogleButton } from "@/components/auth/GoogleButton";
import { AuthDivider } from "@/components/auth/Divider";
import { isGoogleOAuthConfigured } from "@/lib/auth/google";
import { LoginForm } from "./LoginForm";

/**
 * /login — Fase 2 plan funcional.
 *
 * Server Component: detecta si Google OAuth está configurado en el server
 * y pasa el flag al Client Component (no renderiza el botón si no funciona).
 *
 * Mantiene el contrato del backend:
 *   - POST /api/auth/login con { email, password }
 *   - Cookie iron-session "autopost_admin_session"
 *   - Redirect a `from` (default /dashboard) tras éxito
 *
 * NUEVO en Fase 2:
 *   - UI brand (np-root + Card brand + tipografía 17px)
 *   - Botón "Continuar con Google" (si OAuth configurado)
 *   - Errores via ?error=… (incluye códigos del callback Google)
 *   - Microcopy plano en español
 */
export default function LoginPage() {
  const showGoogle = isGoogleOAuthConfigured();

  return (
    <AuthLayout page="login">
      <h1 className="font-np-sans text-np-h2 font-semibold text-ink-9 mb-2">
        Bienvenido de vuelta
      </h1>
      <p className="text-np-body text-ink-7 mb-8">
        Tu calendario sigue donde lo dejaste.
      </p>

      <Suspense fallback={<div className="h-72" aria-busy="true" />}>
        <LoginForm showGoogle={showGoogle}>
          {showGoogle ? (
            <>
              <div className="flex flex-col gap-2 mb-2">
                <GoogleButton from="/dashboard" />
              </div>
              <AuthDivider label="O con email" />
            </>
          ) : null}
        </LoginForm>
      </Suspense>

      <p className="mt-8 text-center text-np-body text-ink-7">
        ¿No tienes cuenta?{" "}
        <Link
          href="/signup"
          className="text-ink-9 font-medium border-b border-ink-4 hover:text-pri hover:border-pri transition-colors"
        >
          Empieza gratis
        </Link>
      </p>
    </AuthLayout>
  );
}
