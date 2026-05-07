/**
 * /billing/success — landing tras completar el checkout en Stripe.
 *
 * Recibe `session_id` por query string. Es OPCIONAL hacer fetch a Stripe
 * aquí: el webhook ya habrá actualizado AdminUser.plan, así que confiamos
 * en eso. Si quieres mostrar detalles concretos (tier comprado, próximo
 * cobro), puedes hacer un retrieve server-side.
 *
 * Por simplicidad esta versión solo muestra confirmación + CTA al dashboard.
 *
 * Diseño: dark con tokens del sistema (ink-* + accent-*) — congruente con
 * la landing.
 */

import Link from "next/link";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ session_id?: string }>;
}

export default async function BillingSuccessPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const sessionId = params.session_id ?? null;

  return (
    <main className="min-h-screen bg-ink-0 text-ink-9 px-6 py-24 flex items-center justify-center">
      <div className="max-w-[560px] w-full text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent-soft border border-accent/30 mb-6">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className="w-8 h-8 text-accent-strong"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>

        <div className="font-np-mono text-np-caption text-accent uppercase tracking-widest mb-3">
          PAGO CONFIRMADO
        </div>

        <h1 className="font-np-sans text-np-display font-semibold text-ink-9 leading-tight tracking-tight mb-4">
          Tu prueba de 7 días ha empezado.
        </h1>

        <p className="text-np-body-lg text-ink-7 mb-2">
          Te hemos enviado un email con el resumen y los próximos pasos.
        </p>
        <p className="text-np-body text-ink-6 mb-10">
          No te cobraremos nada hasta que termine la prueba.
          Puedes cancelar en cualquier momento desde tu cuenta.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center h-12 px-6 rounded-lg bg-accent text-ink-0 font-medium text-np-body shadow-md hover:bg-accent-hover hover:-translate-y-px transition-all duration-200"
          >
            Ir al dashboard
          </Link>
          <Link
            href="/onboarding/1"
            className="inline-flex items-center justify-center h-12 px-6 rounded-lg bg-transparent text-ink-8 border border-ink-3 font-medium text-np-body hover:border-ink-5 hover:bg-ink-2 transition-all duration-200"
          >
            Empezar el onboarding
          </Link>
        </div>

        {sessionId ? (
          <p className="font-np-mono text-[10px] text-ink-5 mt-12 break-all">
            Ref: {sessionId}
          </p>
        ) : null}
      </div>
    </main>
  );
}

export const metadata = {
  title: "Pago confirmado · AUTOPOST",
  robots: { index: false, follow: false },
};
