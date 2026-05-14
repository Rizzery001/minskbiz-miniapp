# Tech debt

Living list of decisions taken with known trade-offs, plus follow-ups to
revisit later. Date entries when something is added or resolved.

## BottomNav: revision (variant B applied)

In PR #19 (`feat/waste-analytics`) we applied **variant B**:

- BottomNav base state — 3 tabs: **Карта / Аналитика / Я**.
- Cart shows up as a 4th tab **only when the cart has items** (badge =
  sum of quantities, sourced from `useCartCount`).
- Orders moved under `/me` as a sub-route — `/me/orders` (page) and
  `/me/orders/success` (post-checkout confirmation).
- Old paths `/orders` and `/orders/success` redirect to the new ones via
  `<Navigate replace>`, so any externally shared links (e.g. from the
  bot) keep working.

### Remaining debt

- **B2B / wholesale cart unification.** When wholesale orders land
  (PR #20+) we need to decide: single cart for farmers + wholesale, or
  separate carts. Today the cart only holds farmer offers, so no change
  is needed; flagging so we make the call deliberately when the second
  vertical arrives.
- **/me has only one entry today.** Planned additions: Настройки,
  Помощь, Выход. When the second entry lands, drop the "single-item
  menu" feel and consider section headers.
- **Cart redirect hop on internal navigation.** Internal `navigate()`
  calls go directly to `/me/orders/success` (updated in `Cart`).
  Anything else still pointing at `/orders` or `/orders/success` will
  pay one extra render to hit the redirect — keep an eye on it as the
  app grows.
- **`useUserMe` has no `first_name` field.** ProfilePage falls back to
  "Пользователь". When the API exposes the Telegram display name, swap
  in a real name + avatar.

## Waste analytics (PR #19) — deferred items

These are intentional MVP trade-offs, not bugs. Revisit when the
feature graduates beyond the first batch of users.

- **Demo button stays on in production.** The "Посмотреть демо" button
  in `EmptyState` is unconditional today. Once we have a `PRODUCTION`
  / `VITE_ENV` env flag, gate the demo path behind a feature flag so
  real users don't accidentally interpret demo numbers as their own.
- **`ByReasonChart` on 320 px viewport (iPhone SE 1) is unverified.**
  The donut + side legend fits 375 px (iPhone 12/13/SE 2) comfortably,
  but I didn't test on the original SE. If it crowds, switch the
  legend to wrap underneath the donut on `< 360 px`.
- **Demo data is hard-coded in `src/demo/waste-demo.ts`.** When the
  backend contract stabilizes and real users start accumulating
  records, decide whether to keep demo data for onboarding (good for
  first-impression UX) or drop it (smaller bundle, less ambiguity).
