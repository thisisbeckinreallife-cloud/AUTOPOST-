# Autopost — Rebrand v1 (HTML standalone)

Rebrand completo de Autopost. Tres artifacts navegables: **Brand System · Landing · Dashboard**. HTML5 + Tailwind-less + JS vanilla. Cero frameworks. Cero build step.

> **Tira la carpeta. El resto va solo.**

---

## Cómo abrir

Cada HTML es **autosuficiente** — abre cualquiera con doble click o desde la línea de comandos:

```bash
# desde /branding-redesign/
open brand-system.html
open landing.html
open dashboard.html
```

También están servidos por el dev de Next.js (sin tocar el código del producto, solo copiados a `/public/`):

- http://localhost:3000/branding-redesign/brand-system.html
- http://localhost:3000/branding-redesign/landing.html
- http://localhost:3000/branding-redesign/dashboard.html

---

## Atajos de teclado

| Tecla | Acción |
|---|---|
| `L` | Cambiar idioma ES ⇄ EN |
| `G` | Toggle grid overlay (solo brand-system) |
| `↑ ↓` | Navegar secciones (donde aplique) |

El idioma persiste en `localStorage('autopost-locale')`, el tema en `localStorage('autopost-theme')`.

---

## Estructura

```
branding-redesign/
├── brand-system.html   ·  Guía visual interactiva (9 secciones)
├── landing.html        ·  Landing dark con hero 3D (11 secciones)
├── dashboard.html      ·  SPA del producto (5 vistas, hash routing)
├── assets/
│   ├── tokens.css      ·  Variables CSS (paleta, type, motion, sombras)
│   ├── i18n.js         ·  Diccionario ES/EN + setLocale + atajo L
│   ├── motion.js       ·  IO entrance · cursor magnético · count-up · tilt 3D
│   └── icons.js        ·  28 SVGs inline stroke 1.5
└── README.md           ·  este archivo
```

---

## Sistema en 30 segundos

- **Paleta**: `#4F7CFF` azul eléctrico (operación) + `#A855F7` violeta (IA, exclusivo). Sobre escala dark `#08080A → #FFFFFF`.
- **Tipografía**: Geist Sans + Geist Mono (fallback Inter + JetBrains Mono).
- **Logo**: grid 4×4 píxeles, cursor azul que viaja de "caos" a "lunes 9:00", formando una flecha → implícita. Wordmark monoespaciado con punto azul ("publicado").
- **Tagline**: "Tira la carpeta. El resto va solo." / "Drop the folder. The rest is automatic."
- **Motion**: 3 easings (out-quint, in-out-cubic, out-back-soft), 4 duraciones (120/200/400/800ms), `prefers-reduced-motion` respetado.
- **IA híbrido balanceado**: sparkle violeta en sugerencias del dashboard + 1 card bento explícita en landing + demo char-by-char en How it works. Cero "powered by AI".

---

## 15 decisiones de diseño no obvias

5 por artifact. Lo que se decidió y por qué.

### Brand System

1. **Violeta exclusivo IA, jamás como decoración.** El #A855F7 sólo aparece en sparkle, sugerencias IA y la "AI Draft" del dashboard. Nunca en CTAs no-IA, nunca en banners. Eso convierte el violeta en lenguaje funcional, no estético.
2. **El wordmark siempre lleva punto.** "autopost." con punto azul. El punto significa "publicado/done". Sin él el wordmark queda incompleto — es parte del mark, no del lenguaje.
3. **Inks con tinte +5° hacia el azul.** Los neutros no son grises puros; tienen un tinte +5° hacia blue para convivir con #4F7CFF y evitar que el dark se vea "marrón" en pantallas OLED.
4. **Geist como display Y body, sin pareja serif.** Una sola familia. Más coherente, menos peso de fuentes, mejor performance. El contraste lo da Geist Mono para datos.
5. **Glow solo en momentos justificados.** `--glow-blue` en CTA principal. `--glow-violet` solo en outputs IA. En el resto: cero glow. El glow es un recurso caro — usarlo en todas partes lo banaliza.

### Landing

6. **Hero opción (a) elegida: carpeta 3D → calendario.** Las opciones (b) cards-caóticas y (c) cursor-reactive eran más Linear/Vercel pero menos diferenciadoras. La carpeta 3D muestra LITERALMENTE la promesa de la tagline.
7. **Stats reales, no infladas.** 12.4M / 8.7s / 47. Tres números concretos en lugar de "Trusted by thousands". La precisión decimal hace que se lean como medidas reales, no como marketing.
8. **Compare slider drag-to-reveal con clip-path, no doble layer.** Implementado con `clip-path: inset()` animado en una sola capa, no con dos capas + opacity. Performance × 4, sin flicker en dispositivos lentos.
9. **Bento grid asimétrico 12-col real.** No es CSS Grid de cajas iguales rotadas — son anchuras heterogéneas (8/4 · 4/4/4) que generan ritmo. La card AI ocupa span-6/row-2 para anclar la decisión "IA híbrido balanceado".
10. **Dashboard demo en iframe live, no captura.** El landing carga `dashboard.html` real en un mockup de Arc browser. Significa que la demo funciona — clicks, drag, hover. El "Abrir en grande" es la única pieza interactiva del frame.

### Dashboard

11. **SPA con hash routing en lugar de cinco HTMLs.** Page transitions reales (200ms fade+slide), un único layout/sidebar, demuestra fluidez Linear-grade. Cinco HTMLs separados perderían el efecto "app".
12. **Drag & drop con out-back-soft, no animación lineal.** Cuando un post encaja en su nueva celda, hace un micro-rebote `cubic-bezier(0.34, 1.56, 0.64, 1)` de 320ms. Pequeño detalle que sube la calidad percibida del producto.
13. **Logs IA en tiempo real con `setInterval`, no animación pre-grabada.** El stream del dashboard genera líneas en vivo cada 1.8s con timestamp real. Cero ilusión — la IA realmente trabaja en tiempo real. Aunque los datos sean mock, el ritmo es honesto.
14. **Phone mockup real para preview Instagram.** El detalle de post incluye una vista de iOS con status bar, avatar IG nativo (gradient), iconos heart/play/share. No una imagen — DOM real con caption editable abajo.
15. **Switch on/off con glow-blue solo cuando activa.** Conn-cards no usan colores de plataforma para el toggle. Activar = azul glow (consistencia con el resto del sistema). Eso evita 7 toggles de 7 colores distintos compitiendo entre sí.

---

## Verificación end-to-end

| # | Check | Cómo |
|---|---|---|
| 1 | Apertura local | `open brand-system.html` etc. — sin servidor |
| 2 | 60fps en hero | DevTools → Rendering → FPS meter en verde durante scroll |
| 3 | Toggle ES ⇄ EN | Click ES en nav → texto cambia · recarga preserva selección |
| 4 | Drag & drop calendar | Arrastrar post a otra celda → encaja con micro-rebote |
| 5 | `prefers-reduced-motion` | Sys Prefs → Reduce → entrance OFF, transitions <120ms |
| 6 | Responsive | 320 → 1920px sin scroll horizontal |
| 7 | A11y | Focus visible · aria-labels · headings semánticos |
| 8 | Cross-browser | Chrome / Safari / Firefox · CSS 3D verificado en Safari |
| 9 | Hash routing | URL `dashboard.html#calendar` carga calendar directo |
| 10 | Console errors | `0` · verificado |

---

## Lo que NO hace este rebrand

- **No migra al Next.js de producción.** El rebrand vive en `/branding-redesign/`. La integración en `/src/app/` es una segunda iteración tras aprobación.
- **No conecta a backend.** Datos mock realistas en estado JS in-memory. No toca Prisma, S3, Redis, OAuth real.
- **No reemplaza marcas registradas.** Logos sociales son iconos genéricos para evitar issues legales hasta validar uso oficial.
- **Tema light** existe como exit-stub. Pulido v1 es dark-only.

---

## Notas técnicas

- **Tailwind CDN no usado.** `tokens.css` aporta utilities propias en ~250 líneas.
- **Sin GSAP.** Web Animations API + IntersectionObserver son suficientes para los efectos.
- **Sin Three.js.** El "3D" del hero y dropzone usa CSS `transform-style: preserve-3d` + `perspective`.
- **Sin Chart.js.** Los gráficos de Analytics están dibujados a mano con SVG `path`.
- **Geist** carga vía Google Fonts CDN (fallback automático a Inter + JetBrains Mono si bloquea).
- **`prefers-reduced-motion`** desactiva entrance animations, count-up, typewriter, parallax y tilt 3D. Mantiene transiciones esenciales <120ms.

---

## Roadmap si esto avanza

- [ ] v1.1 · Migrar tokens + componentes al Next.js de producción
- [ ] v1.2 · Pulir tema light (badges, glows, contraste)
- [ ] v1.3 · Animaciones del hero export a Lottie/Rive para reducir CPU
- [ ] v1.4 · Iconografía custom completa (set propio, no derivado de Feather)

---

**Versión:** v1.0 · 2026-05  
**Stack:** HTML5 · CSS variables · JS vanilla  
**Deploy target:** GitHub Pages, Vercel, Netlify (cualquier static host)
