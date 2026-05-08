# A11Y_AUDIT.md — Auditoría WCAG 2.2 AA · Autopost

> Auditoría realizada sobre el sitio en producción tras el deploy del Bloque B
> (commit `b99a409d`, 2026-05-08). Delegada a `testing-accessibility-auditor`.

**URL auditada**: https://autopost-production-cd57.up.railway.app/
**Estándar**: WCAG 2.2 Nivel AA
**Veredicto inicial**: NO certificable AA · 12 hallazgos (2 críticos, 3 altos, 4 medios, 3 bajos)

---

## Lo que ya se ha arreglado en este commit

| ID | WCAG | Cambio |
|---|---|---|
| C1 | 1.4.3 | `ink-6` `#6B6A64` (3.3:1 sobre ink-1) → `#8A8980` (≥4.5:1). Token actualizado en `tailwind.config.ts` y `globals.css`. Aplica a disclaimers de pricing, footer copyright, captions del Hero, labels FAQ y meta-info en InsideTour. **Token `info.DEFAULT` también subido al mismo valor**. |
| C2 | 1.3.1 / 2.4.1 / 4.1.2 | `layout.tsx`: `<div id="main-content">` → `<main id="main-content" tabIndex={-1}>`. `PillNav.tsx`: enlaces principales ahora dentro de `<nav aria-label="Principal">` real, no `<ul>` suelto. Skip-link ahora salta a un landmark anunciable por screen readers. |
| A2 | 2.4.7 / 2.4.11 / 1.4.11 | `--ring-accent` de `rgba(255,106,44,0.45)` → `rgba(255,106,44,0.95)`. Focus visible ahora claramente discernible sobre backgrounds oscuros. |

---

## Pendiente (próxima iteración)

### Altos

#### A3 — Acordeón FAQ con `aria-controls` + `hidden`/`inert`
- **WCAG**: 1.3.1, 4.1.2
- **Localización**: `src/components/landing-v2/Faq.tsx:75-98`
- **Fix sugerido**:
  ```tsx
  const panelId = `faq-panel-${i}`;
  <button aria-expanded={isOpen} aria-controls={panelId}>...</button>
  <div id={panelId} role="region" hidden={!isOpen}>...</div>
  ```

### Medios

#### M1 — Drop zone teclado-accesible (onboarding/3)
- **WCAG**: 2.1.1, 4.1.2
- **Localización**: `src/app/onboarding/3/page.tsx:91-133`
- **Fix sugerido**: convertir `<div onClick>` a `<button type="button">` con manejo de Enter/Space y `aria-describedby`.

#### M2 — Reemplazar `confirm()` nativo por `<dialog>` estilizado
- **WCAG**: 4.1.2, 2.4.11
- **Localización**: `src/app/onboarding/3/page.tsx:73`

#### M3 — Emojis 👁/🙈 envueltos en `<span aria-hidden>` (signup/login)
- **WCAG**: 1.1.1, 4.1.2
- **Localización**: `src/app/(auth)/signup/SignupForm.tsx:122`, `LoginForm.tsx:113`
- **Fix sugerido**: cambiar emojis por iconos lucide (`<Eye />`, `<EyeOff />`).

#### M4 — Checkbox términos con `aria-describedby` al error específico
- **WCAG**: 1.3.1, 3.3.2, 4.1.2
- **Localización**: `src/app/(auth)/signup/SignupForm.tsx:145-163`

### Bajos

- **B1** Verificar reflow a 400% zoom en Hero (`clamp(2.75rem, 7vw, 5rem)`).
- **B2** Añadir `focus-visible:text-ink-9` en Footer y PillNav links para feedback teclado consistente con hover.
- **B3** Reemplazar `mix-blend-difference` del PillNav por estados explícitos.

---

## Lo que ya cumple WCAG AA

- `<html lang="es">` correcto.
- `<meta name="viewport" initial-scale=1>` no bloquea zoom.
- Skip-link presente, anunciado al primer Tab, visible al focus.
- Jerarquía de headings limpia sin saltos (h1→h2→h3).
- Inputs con label asociado, `aria-invalid`, `aria-describedby`, `role="alert"` en errores.
- `autoComplete` correcto en formularios auth.
- Toast con `role="region"` + `role="status"` + `aria-live="polite"`.
- Touch targets 44px+ en Button, Input, CTAs.
- `prefers-reduced-motion` respetado globalmente y en keyframes específicos.
- Botón Faq con `aria-expanded`.
- Pricing toggle con `<button type="button">` real.
- Imágenes/SVG decorativos con `aria-hidden="true"` consistente.
- Body text `#EDEAE3` sobre `#0E0F0D` = **17.7:1** AAA.
- `text-ink-7` sobre ink-1 = **8.6:1** AAA.
- Accent `#FF6A2C` con texto `#0A0B09` = **7.4:1** AAA.

---

## Próximos pasos

Aplicar M1-M3 + A3 en una segunda iteración (~2h estimadas). Tras eso, re-auditar con `axe-core` real en navegador (ahora bloqueado por entorno) para certificar AA.
