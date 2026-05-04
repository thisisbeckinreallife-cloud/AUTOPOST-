import { Suspense } from "react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { ResetForm } from "./ResetForm";

/**
 * /reset-password?token=… — Fase 2 plan funcional.
 *
 * Backend: POST /api/auth/reset-password { token, password, passwordConfirm }
 * Token plain en URL → backend hash sha256 + compare → set new password +
 * limpia resetToken.
 *
 * UI brand: card con dos campos password (con confirm), validación cliente
 * mínimo 8 chars, success state claro con CTA "Ir a iniciar sesión".
 */
export default function ResetPasswordPage() {
  return (
    <AuthLayout page="reset" backHref="/login" backLabel="← Volver al login">
      <h1 className="font-np-sans text-np-h2 font-semibold text-ink-9 mb-2">
        Crea una contraseña nueva
      </h1>
      <p className="text-np-body text-ink-7 mb-8">
        Mínimo 8 caracteres. Te recomendamos algo fácil de recordar para ti pero
        que no sea evidente.
      </p>

      <Suspense fallback={<div className="h-72" aria-busy="true" />}>
        <ResetForm />
      </Suspense>
    </AuthLayout>
  );
}
