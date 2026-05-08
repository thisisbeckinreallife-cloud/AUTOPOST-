/**
 * /billing/cancel — landing tras cancelar el checkout en Stripe.
 *
 * Sin estado destructivo: el user simplemente abandonó el flow. Mostramos
 * un mensaje de "no pasa nada" y links de vuelta a pricing/landing.
 */

import Link from "next/link";

export const dynamic = "force-static";

export default function BillingCancelPage() {
  return (
    <main className="min-h-screen bg-ink-0 text-ink-9 px-6 py-24 flex items-center justify-center">
      <div className="max-w-[560px] w-full text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-ink-2 border border-ink-3 mb-6">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className="w-7 h-7 text-ink-7"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </div>

        <div className="font-np-mono text-np-caption text-ink-6 uppercase tracking-widest mb-3">
          PAGO CANCELADO
        </div>

        <h1 className="font-np-sans text-np-display font-semibold text-ink-9 leading-tight tracking-tight mb-4">
          No has activado nada.
        </h1>

        <p className="text-np-body-lg text-ink-7 mb-10">
          No te hemos cobrado y no hay suscripción creada.
          Puedes volver cuando quieras — la prueba seguirá siendo de 7 días sin tarjeta.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/#pricing"
            className="inline-flex items-center justify-center h-12 px-6 rounded-lg bg-accent text-ink-0 font-medium text-np-body shadow-md hover:bg-accent-hover hover:-translate-y-px transition-all duration-200"
          >
            Volver a precios
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center h-12 px-6 rounded-lg bg-transparent text-ink-8 border border-ink-3 font-medium text-np-body hover:border-ink-5 hover:bg-ink-2 transition-all duration-200"
          >
            Ir al inicio
          </Link>
        </div>
      </div>
    </main>
  );
}

export const metadata = {
  title: "Pago cancelado · AUTOPOST",
  robots: { index: false, follow: false },
};
