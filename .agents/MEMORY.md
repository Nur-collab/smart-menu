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
- **Current Status:** Real-time Order Status Synchronization (Neon DB + 2.5s Polling) deployed.
- **Enterprise Features:**
  - Full bidirectional order status sync: Staff KDS/Admin (`/admin`) updates propagate to Guest (`/?table=4`) in <2.5s.
  - Direct Neon PostgreSQL queries on `GET /api/orders` & `PATCH /api/orders/[id]` preventing serverless container isolation bugs.
  - Complete 3-language system (Кыргызча 🇰🇬, Русский 🇷🇺, English 🇬🇧) across all 7 categories, 28 dishes, option groups, KBJU, search, cart, waiter call, payment modals, and fiscal receipt.
  - Multilingual search union matcher (searches across RU, KG, EN in real time).
  - Sliding-window IP rate limiting (`RATE_LIMITS.PIN_AUTH` 5 attempts/5min, `ORDER_CREATION` 30/5min, `WAITER_CALL` 10/5min).
  - Timing-safe HMAC session authentication (`crypto.timingSafeEqual`).
  - Strict runtime schema validation & boundary input sanitization (`validateOrderInput`, `validateWaiterCallInput`).
  - Layered Clean Architecture: `OrderService` separates business validation and Neon DB queries from route controllers.
  - OWASP security headers in `next.config.ts` (nosniff, SAMEORIGIN, X-XSS-Protection, Referrer-Policy).
  - Health & diagnostics observability endpoint (`/api/health`).
- **Live URLs:**
  - Guest Table: `https://smart-menu-nu.vercel.app/?table=4`
  - Staff / Admin Terminal: `https://smart-menu-nu.vercel.app/admin` (PINs: Manager `9999`, Kitchen `2222`, Waiter `1111`)
  - Health Diagnostics: `https://smart-menu-nu.vercel.app/api/health`

## 3. Architecture Invariants
- **Vercel Serverless & Neon Pooler:** Production runtime executes over Neon PgBouncer pooler (`DATABASE_URL`). All DB writes in API handlers are strictly awaited before returning HTTP responses.
- **Hybrid Real-Time Sync:** Because Vercel serverless containers do not share memory, Neon PostgreSQL serves as the single source of truth; clients poll `/api/orders` every 2.5s when visible.
- **Timing-Safe Crypto & Anti-Brute-Force:** PIN auth is strictly rate-limited with HTTP 429 lockouts; tokens are verified in constant time via `crypto.timingSafeEqual`.
- **Domain Services:** Route handlers act purely as HTTP adapters; all domain validation, DB queries, and pricing calculations reside in `src/services/`.
- **Continuous Deployment (CI/CD):** Every commit pushed to `main` on GitHub triggers an automatic production build and deployment on Vercel.

## 4. Bug Graveyard
- **[Serverless-Order-Status-Desync]** Ephemeral lambdas lacked cross-container Neon sync; guest lacked polling fallback; status banner was hardcoded to "Принят" -> Direct Neon DB queries on PATCH/GET, 2.5s client polling with visibility listener, dynamic 4-stage tracking UI.
- **[PIN-Brute-Force-Risk]** Unlimited 4-digit PIN attempts allowed -> Added IP-based sliding-window rate limiter (5 max attempts / 5 min).
- **[Timing-Attack-Vulnerability]** Standard string comparison in HMAC validation -> Upgraded to `crypto.timingSafeEqual`.
- **[Serverless-Unawaited-DB-Ops]** Floating promises in Lambda caused silent Neon drops on context freeze -> Converted store mutators to async and awaited in API handlers.
- **[Price-Tampering-Vulnerability]** Client-forged prices accepted by `POST /api/orders` -> Enforced server-side DB recalculation and option validation.

## 5. Rolling Changelog (Max 5)
- `2026-11-22` Fixed real-time order status desync: Neon DB source of truth for PATCH/GET, 2.5s client polling, reactive FloatingCartBar & OrderTrackerModal stages.
- `2026-11-22` Full 3-Language System (KG, RU, EN) rolled out: 28 dishes, 7 categories, options, search, cart, waiter call, payment modals. E2E verified on production.
- `2026-11-22` Principal Architecture upgrade: Rate limiting, Timing-Safe HMAC, Input schemas, OWASP headers, `OrderService`, `/api/health`.
- `2026-11-22` Staff review audit complete: async DB writes, price tampering protection, in-memory FIFO limits, PIN auth.
- `2026-11-22` Expanded catalog to 28 dishes across 7 categories (Bar/Cocktails, Steaks, Breakfasts, Specialty Coffee) and re-seeded Neon DB.
