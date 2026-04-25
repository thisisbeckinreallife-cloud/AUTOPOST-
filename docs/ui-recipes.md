# UI Recipes — Aluminum Studio

Patrones canónicos para componentes recurrentes. Siempre que añadas un componente nuevo, copia de aquí en vez de inventar clases. Si un patrón nuevo se repite ≥2 veces, súbelo a este doc.

## Color tokens (Tailwind)

Usar **siempre** los tokens semánticos en vez de los colores brutos de Tailwind:

| Estado | Bruto Tailwind | Token Aluminum |
|---|---|---|
| Éxito | `green-*` / `emerald-*` | `success-*` |
| Advertencia / token expirando | `amber-*` / `yellow-*` | `warning-*` |
| Error / fallo / token expirado | `red-*` | `error-*` |
| Info / programado | `blue-*` / `cyan-*` | `info-*` |

Tintas disponibles: `50, 100, 200, 300, 500, 700, 800, 900`.

**Reglas de uso:**
- Fondo de pill/banner: `*-50` (light), `*-100` (saturated)
- Borde: `*-200` o `*-300`
- Texto sobre fondo claro: `*-700`, `*-800`, `*-900`
- Iconos sobre fondo blanco: `*-700`

---

## Card (default)

```tsx
<div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
  …
</div>
```

**Hover state:**
```tsx
<div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm hover:border-zinc-300 hover:shadow-md transition-all">
  …
</div>
```

**Card primaria (con borde acento por estado):**
```tsx
<div className="rounded-xl border border-success-200 bg-white p-5">
  …
</div>
```

---

## Pill (status badge)

```tsx
<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-success-100 text-success-800 border border-success-200 text-xs font-semibold">
  <CheckCircle className="h-3 w-3" />
  Conectado
</span>
```

Para los demás estados, intercambiar `success` por `warning`, `error`, `info`. Variantes neutras usan `bg-zinc-100 text-zinc-700 border-zinc-200`.

---

## Botón primario (zinc-900)

```tsx
<button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-zinc-900 text-white text-sm font-semibold hover:bg-zinc-800 hover:shadow-lg hover:-translate-y-px transition-all">
  …
</button>
```

## Botón secundario (outline)

```tsx
<button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-zinc-200 text-zinc-700 text-sm font-semibold hover:border-zinc-300 hover:bg-zinc-50 transition-colors">
  …
</button>
```

## Botón destructivo

```tsx
<button className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-error-700 text-white text-xs font-bold hover:bg-error-800 disabled:opacity-50">
  Eliminar
</button>
```

---

## Input de texto

```tsx
<input
  type="text"
  className="w-full px-3 py-2 rounded-lg bg-white border border-zinc-200 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200"
/>
```

---

## Tipografía

| Token | Uso |
|---|---|
| `text-zinc-900` | Títulos, valores numéricos, labels primarios |
| `text-zinc-700` | Texto cuerpo | 
| `text-zinc-600` | Secundarios (descripciones, metadatos visibles) |
| `text-zinc-500` | Placeholders, etiquetas mínimas |
| `text-zinc-400` | Decorativos sin contenido (chevrons, separadores) |

**Nunca usar:**
- `text-zinc-100/200/300` sobre fondo claro (era residuo dark-mode)
- `text-{color}-400` o más bajo para texto importante (no llega a contraste AA)
- Hex hardcoded como `#86868B` o `#1D1D1F` en JSX — usar el token Tailwind correspondiente

---

## Banner/Callout

### Crítico
```tsx
<div className="rounded-xl border border-error-300 bg-error-50 p-4">
  <p className="text-sm font-semibold text-error-900">…</p>
  <p className="text-xs text-error-800 mt-0.5">…</p>
</div>
```

### Aviso
```tsx
<div className="rounded-xl border border-warning-300 bg-warning-50 p-4">…</div>
```

### Confirmación
```tsx
<div className="rounded-xl border border-success-300 bg-success-50 p-4">…</div>
```

---

## Sticky toolbar (bulk actions)

```tsx
<div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-full max-w-lg px-4">
  <div className="rounded-2xl bg-zinc-900 text-white shadow-xl border border-zinc-800">
    …
  </div>
</div>
```

---

## Focus state (WCAG AA)

Todo elemento interactivo debe tener focus visible:
```tsx
className="… focus-visible:ring-2 focus-visible:ring-zinc-900/30 focus-visible:ring-offset-2 focus-visible:outline-none"
```

Para inputs ya está incluido en el recipe de input. Para botones y links, añadir explícitamente.

---

## Iconos

- Fuente única: **lucide-react**
- Tamaños comunes: `h-3 w-3` (badges), `h-3.5 w-3.5` (pills), `h-4 w-4` (botones inline), `h-5 w-5` (headers/cards)
- Color: usar el mismo token que el texto adyacente
- Icon-only buttons: **siempre** llevar `aria-label`

---

## Antipatrones (NO usar)

- `bg-{color}-500/10` con `text-{color}-400` (residuo dark-mode → casi invisible sobre claro)
- `bg-white/[0.04]`, `border-white/[0.06]` (residuo dark-mode)
- `bg-surface-card` (alias confuso → usar `bg-white`)
- `text-brand-400` para texto crítico (es silver gris, casi invisible sobre claro)
- Mezclar `border-green-500/15` con `text-green-700` (gradient borders + text saturado se cancelan)

---

## Checklist al añadir un componente

1. ¿Usa tokens semánticos (`success/warning/error/info`) en vez de `green/red/etc`?
2. ¿Texto principal en `zinc-900`? ¿Secundario en `zinc-600`?
3. ¿Tiene focus state visible? ¿`aria-label` si es icon-only?
4. ¿Match con un recipe de este doc? Si no, considerar si hay que añadirlo aquí.
