# Stripe — Setup paso a paso

Esta guía documenta el setup completo de Stripe en AUTOPOST: dashboard, env vars, webhooks, testing y troubleshooting.

Si llegas aquí porque algo falla en producción, salta a [Troubleshooting](#troubleshooting).

---

## TL;DR

```bash
# 1. Crea cuenta en stripe.com
# 2. En dashboard.stripe.com → Products, crea 6 prices (3 tiers × 2 periods)
# 3. En dashboard.stripe.com → Developers → Webhooks, suscribe a 5 eventos
# 4. Copia las 9 env vars al Railway
# 5. Despliega
# 6. Smoke test con tarjeta 4242 4242 4242 4242
```

---

## 1. Crear products + prices

Ve a `dashboard.stripe.com/products`. Crea 3 productos:

| Producto       | Tier interno | Plan en DB |
|----------------|--------------|------------|
| AUTOPOST Básico | `basic`     | `SOLO`     |
| AUTOPOST Pro   | `pro`        | `PRO`      |
| AUTOPOST Agency | `agency`    | `AGENCY`   |

Para CADA producto crea 2 prices (recurring):

| Período  | Importe Básico | Importe Pro | Importe Agency | Currency | Interval |
|----------|----------------|-------------|----------------|----------|----------|
| Semanal  | 5,00 €         | 7,00 €      | 10,00 €        | EUR      | week     |
| Anual    | 208,00 €       | 312,00 €    | 416,00 €       | EUR      | year     |

> ⚠ El precio anual es `weekly × 52 × 0.8`, no el `yearly` mostrado en la landing.
> En la UI mostramos "4€/sem facturado anual" pero el price real es 208€/año.

Tras crearlos copia los `price_id` (formato `price_1Oxxx…`) — los necesitas en las env vars.

## 2. Configurar webhooks

`dashboard.stripe.com/webhooks` → Add endpoint.

- **URL**: `https://autopost-production-cd57.up.railway.app/api/stripe/webhook`
- **Listen to**: Events on your account
- **Events**:
  - `checkout.session.completed`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.payment_failed`
  - `invoice.payment_succeeded`

Tras crear el endpoint, **clic en "Reveal" del Signing secret** y copia el `whsec_...`.

## 3. Variables de entorno (Railway)

```bash
# Producción → llaves live
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_PUBLISHABLE_KEY=pk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Desarrollo → llaves test (sk_test, pk_test, etc.)

# Price IDs — sustituye por los reales
STRIPE_PRICE_BASIC_WEEKLY=price_xxx
STRIPE_PRICE_BASIC_YEARLY=price_xxx
STRIPE_PRICE_PRO_WEEKLY=price_xxx
STRIPE_PRICE_PRO_YEARLY=price_xxx
STRIPE_PRICE_AGENCY_WEEKLY=price_xxx
STRIPE_PRICE_AGENCY_YEARLY=price_xxx
```

> ✅ **Verifica antes de desplegar**:
> ```bash
> railway variables | grep STRIPE_
> ```
> Las 9 deben estar presentes y SIN comillas.

## 4. Migración de Prisma

```bash
npm install stripe                     # SDK aún no instalado
npx prisma migrate dev --name stripe   # crea Subscription + WebhookEvent
npx prisma generate
```

En CI/CD:
```bash
npx prisma migrate deploy
```

## 5. Smoke test (sandbox)

Con `STRIPE_SECRET_KEY=sk_test_...`:

1. Abre la landing y haz login.
2. Click en "Empezar 7 días gratis" del tier Pro.
3. Te redirige a Stripe Checkout. Usa la tarjeta de test: `4242 4242 4242 4242`, fecha cualquiera futura, CVC cualquiera.
4. Tras completar te redirige a `/billing/success`.
5. Verifica en DB:
   ```sql
   SELECT id, plan, stripeSubscriptionId FROM admin_users WHERE email = 'tu@email.com';
   SELECT * FROM "Subscription" ORDER BY "createdAt" DESC LIMIT 1;
   ```
   - `plan` debería ser `PRO`.
   - Subscription con `status = 'trialing'`.

### Webhook local (Stripe CLI)

Para probar webhooks contra `localhost:3000`:

```bash
stripe login
stripe listen --forward-to localhost:3000/api/stripe/webhook
# copia el whsec_... que muestra al STRIPE_WEBHOOK_SECRET local
```

Dispara eventos manualmente:
```bash
stripe trigger checkout.session.completed
stripe trigger invoice.payment_failed
```

## 6. Tarjetas de test (sandbox)

| Tarjeta              | Comportamiento                                     |
|----------------------|----------------------------------------------------|
| `4242 4242 4242 4242` | Pago OK                                           |
| `4000 0025 0000 3155` | Requiere 3DS (autenticación)                      |
| `4000 0000 0000 9995` | Fallo por fondos insuficientes (`payment_failed`) |
| `4000 0000 0000 0341` | Pago OK pero fallará el primer intento de cobro recurrente |

## 7. Reglas de producción

- 🔒 **Nunca** loguees `STRIPE_SECRET_KEY` ni `whsec_...`. Si fugó, rotación inmediata desde dashboard.
- 🔁 El webhook DEBE responder con 2xx en <30s. Si tu handler tarda más, Stripe reintentará y verás eventos duplicados (idempotencia los detecta y descarta).
- 💸 Para cancelar una subscripción: `stripe.subscriptions.cancel(id)` o desde el customer portal. NUNCA borres el row de `Subscription` directamente — el webhook `customer.subscription.deleted` lo marcará como canceled.
- 🧪 Tests E2E: configura un proyecto separado en Stripe (`Test mode`) con webhook apuntando a un staging deploy, no a localhost.

## 8. Cambios de precios

Stripe NO permite editar el importe de un `price` existente. Para cambiar:

1. Crea nuevo `price` en el mismo producto.
2. Actualiza la env var `STRIPE_PRICE_*` correspondiente.
3. Las suscripciones existentes mantienen el price antiguo automáticamente.
4. Si quieres migrar customers existentes al nuevo price:
   ```bash
   stripe.subscriptions.update(subId, { items: [{ id: itemId, price: newPriceId }] })
   ```

## Troubleshooting

### `503 STRIPE_NOT_CONFIGURED` al pulsar Checkout

Revisa que `STRIPE_SECRET_KEY` y `STRIPE_WEBHOOK_SECRET` no estén vacíos ni con el placeholder `sk_test_...` literal del `.env.example`.

```bash
railway variables | grep -E 'STRIPE_(SECRET|WEBHOOK_SECRET)'
```

### `400 INVALID_SIGNATURE` en /api/stripe/webhook

- Verifica que `STRIPE_WEBHOOK_SECRET` corresponde al endpoint que llega.
- El raw body **no puede transformarse** — usamos `request.text()` antes de cualquier parseo.
- Si tienes Cloudflare, asegura que NO está reescribiendo el body (Cloudflare puede des/recompresar — el webhook IP de Stripe debe llegar directo o whitelistear).

### El `plan` del user no se actualiza tras pagar

1. Verifica en `dashboard.stripe.com/webhooks` que el endpoint recibió `checkout.session.completed` con status 2xx.
2. Si recibió 5xx → revisa logs de Railway: `railway logs --filter '/stripe/webhook'`.
3. Si recibió 2xx pero el plan sigue FREE → revisa la tabla `WebhookEvent`:
   ```sql
   SELECT id, type, "processedAt", "lastError" FROM "WebhookEvent" ORDER BY "createdAt" DESC LIMIT 10;
   ```
   `lastError` te dirá qué falló en el handler.

### Eventos duplicados en `WebhookEvent`

No deberían — la tabla tiene PK = `event.id`. Si los ves, es bug del handler (alguien insertando con id derivado en vez del original).

### Cobro fallido tras trial

Stripe envía `invoice.payment_failed`. Nuestro handler marca `Subscription.status = 'past_due'` y debería disparar email (TODO implementar). Mientras tanto:

```sql
SELECT u.email, s.status, s."currentPeriodEnd"
FROM "Subscription" s
JOIN admin_users u ON u.id = s."adminUserId"
WHERE s.status = 'past_due';
```

Contacta manualmente al usuario con un link al customer portal para que actualice la tarjeta:
```bash
stripe.billingPortal.sessions.create({ customer: customerId, return_url: '...' })
```

---

## Referencias

- [Stripe Checkout docs](https://stripe.com/docs/payments/checkout)
- [Subscription lifecycle](https://stripe.com/docs/billing/subscriptions/overview)
- [Webhook signing](https://stripe.com/docs/webhooks/signatures)
- [Test cards](https://stripe.com/docs/testing)
