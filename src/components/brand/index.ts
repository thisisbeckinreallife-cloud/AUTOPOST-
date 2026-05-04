/**
 * /src/components/brand/ — Rebrand v1 UI primitives (Fase 1).
 *
 * Coexisten con /src/components/ui/ (editorial print-zine) hasta migrar
 * cada página al nuevo sistema. Las páginas nuevas (login redesign,
 * onboarding, dashboard simplificado) importan desde aquí.
 *
 * Reglas:
 *  - Touch target mínimo 48px (Button md, Switch, Pill).
 *  - Body 17px (text-np-body), caption 14px (text-np-caption).
 *  - Variant "ai" RESERVADA para outputs IA (sparkle ✦ + violeta).
 *  - Lenguaje plano. Errores en español. ARIA correcto en cada componente.
 *  - Wrap la app con <ToastProvider> (en root layout o feature layout).
 */

export { Button, type ButtonProps } from "./Button";
export { Input, type InputProps } from "./Input";
export { Card, CardHeader, CardTitle, CardDescription, type CardProps } from "./Card";
export { Pill, type PillProps } from "./Pill";
export { Badge, type BadgeProps } from "./Badge";
export { Switch, type SwitchProps } from "./Switch";
export { Tooltip, type TooltipProps } from "./Tooltip";
export { ToastProvider, useToast, type ToastVariant, type ToastItem } from "./Toast";
export { cn } from "./cn";
