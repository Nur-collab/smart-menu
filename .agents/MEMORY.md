# PROJECT MEMORY & CONTEXT STATE: SMART-MENU
> Auto-maintained by AI Agent. Keep strictly under 180 lines. Use telegraphic English.

## 1. Stack & Commands
- **Framework:** Next.js 16.3.3 (App Router with Turbopack), React 19.2.8, TypeScript 5, Tailwind CSS v4, Lucide React.
- **ORM & DB:** Prisma 6.19.3, Neon PostgreSQL cloud database (`ep-floral-moon-bh015x46`).
- **Cloud Hosting:** Vercel Production (`https://smart-menu-nu.vercel.app`).
- **GitHub Repository:** `https://github.com/Nur-collab/smart-menu` (branch: `main`).
- **Core Commands:**
  - Dev server: `npm run dev`
  - Production build: `npm run build`
  - Push to Vercel/GitHub: `git push origin main` (triggers auto-deploy on Vercel)
  - DB Migration: `npx prisma db push`
  - DB Seed: `npx tsx prisma/seed.ts`

## 2. Active Work State
- **Current Status:** OWASP API Security & Defense-in-Depth Architecture Hardening deployed.
- **Enterprise Features:**
  - Strict KDS Status RBAC: `PATCH /api/orders/[id]` enforces `canCookOrders` for cooking/ready, `canServeOrders` for served/paid, and `canManageMenu` for cancellations.
  - Table Isolation & BOLA Defense: `GET /api/orders` and `GET /api/waiter-calls` filter by `?table=N` for unauthenticated guests, preventing cross-table data scraping. Full dumps restricted to authenticated staff (`authorizeStaffRequest`).
  - Waiter Call Mutation Guard: `PATCH /api/waiter-calls/[id]` requires `canHandleCalls`.
  - Financial Data Privacy: `GET /api/fiscal` restricted to managers (`canViewAnalytics`).
  - Fiscal Integrity Guard: `GET /api/fiscal/[orderId]` generates fiscal receipts strictly for `paid` orders.
  - Hardware & POS Bridge Protection: `/api/pos/*` locked behind `canManageMenu`/`canViewAnalytics`; `/api/printer/print-ticket` requires authenticated staff.
  - Session Security: `aura_staff_token` cookie set with `httpOnly: true`, preventing XSS session hijacking.
  - Network Headers: Production CSP, HSTS (`max-age=63072000; includeSubDomains; preload`), COOP (`same-origin`), and nosniff configured in `next.config.ts`.
  - AI Rate Limiting: `POST /api/ai/sommelier` throttled to 15 requests / 5 min per IP.
- **Live URLs:**
  - Guest Table: `https://smart-menu-nu.vercel.app/?table=4`
  - Staff / Admin Terminal: `https://smart-menu-nu.vercel.app/admin` (PINs: Manager `9999`, Kitchen `2222`, Waiter `1111`)
  - Health Diagnostics: `https://smart-menu-nu.vercel.app/api/health`

## 3. Architecture Invariants
- **Vercel Serverless & Neon Pooler:** Production runtime executes over Neon PgBouncer pooler (`DATABASE_URL`). All DB writes in API handlers are strictly awaited before returning HTTP responses.
- **Hybrid Real-Time Sync:** Because Vercel serverless containers do not share memory, Neon PostgreSQL serves as the single source of truth; clients poll `/api/orders` every 2.5s when visible.
- **Zero-Trust Role Enforcement:** Server endpoints never trust client role claims; permissions derived from HMAC session payload against `StaffPermissions`.
- **Domain Services:** Route handlers act purely as HTTP adapters; all domain validation, DB queries, and pricing calculations reside in `src/services/`.

## 4. Bug Graveyard
- **[KDS-Role-Bypass]** Kitchen could mark orders as served/paid -> Enforced status-based RBAC in `PATCH /api/orders/[id]`.
- **[Cross-Table-Order-Scraping]** `GET /api/orders` returned all restaurant orders to any guest -> Added table filtering and staff auth check.
- **[Unauthenticated-Call-Dismissal]** Public could cancel waiter calls -> Protected `PATCH /api/waiter-calls/[id]` with `canHandleCalls`.
- **[Unpaid-Order-Fiscalization]** `GET /api/fiscal/[orderId]` issued receipts for unpaid orders -> Enforced `status === 'paid'` precondition.
- **[Public-POS-Configuration]** POS bridge and printer routes had no auth -> Locked behind manager/staff authorization.

## 5. Rolling Changelog (Max 5)
- `2026-11-23` Deployed OWASP API Security Hardening: KDS RBAC, table isolation on orders/calls, POS & printer protection, fiscal integrity guard, CSP/HSTS headers, httpOnly cookies, AI rate limits.
- `2026-11-23` Retained active paid order in guest context for fiscal receipt access and Salyk.kg verification.
- `2026-11-23` Switched to Table Waiter-QR payment: 1-click "Отправить заказ на кухню", "Попросить счет" button, Waiter/Manager "Оплачено гостем ✓" lifecycle, fiscal receipt on completion.
- `2026-11-23` Hardened Security & Persistence: Review rate limiting, DB fallback for reviews, production webhook signature enforcement, stoplist auth token integration.
- `2026-11-22` Fixed real-time order status desync: Neon DB source of truth for PATCH/GET, 2.5s client polling, reactive FloatingCartBar & OrderTrackerModal stages.
