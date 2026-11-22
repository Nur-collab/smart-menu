# PROJECT MEMORY & CONTEXT STATE: SMART-MENU
> Auto-maintained by AI Agent. Keep strictly under 180 lines. Use telegraphic English.

## 1. Stack & Commands
- **Framework:** Next.js 16.3.3 (App Router), React 19.2.8, TypeScript 5, Tailwind CSS v4, Lucide React.
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
- **Current Status:** Senior Code Audit Fixes complete: Serverless async DB awaiting, Price tampering guard, In-memory FIFO caps, Server-side PIN & API guards, SSE decoupling.
- **Security & Reliability:** All mutating routes (`/api/menu/*`, `/api/orders/[id]`, `/api/stoplist`) protected via `authorizeStaffRequest` HMAC tokens. `POST /api/orders` recalculates subtotal and options from Neon DB.
- **Live URLs:**
  - Guest Table: `https://smart-menu-nu.vercel.app/?table=4`
  - Staff / Admin Terminal: `https://smart-menu-nu.vercel.app/admin` (PINs: Manager `9999`, Kitchen `2222`, Waiter `1111`)
- **Verification:** Unit and integration tests passed for async DB persistence, price tampering prevention, and auth guards. Full local `npm run build` compiled cleanly. Pushed to Vercel production.

## 3. Architecture Invariants
- **Vercel Serverless & Neon Pooler:** Production runtime executes over Neon PgBouncer pooler (`DATABASE_URL`). All DB writes in API handlers are strictly awaited before returning HTTP responses.
- **Server-Side Price Integrity:** Server recalculates all cart item unit prices, modifiers, and final amounts against Neon DB records; client prices are never trusted.
- **Server-Side Staff Auth Guard:** Mutating admin routes require valid signed HMAC session token (`aura_staff_token`) validated against role permissions.
- **Continuous Deployment (CI/CD):** Every commit pushed to `main` on GitHub triggers an automatic production build and deployment on Vercel.

## 4. Bug Graveyard
- **[Serverless-Unawaited-DB-Ops]** Floating promises in Lambda caused silent Neon drops on context freeze -> Converted store mutators to async and awaited in API handlers.
- **[Price-Tampering-Vulnerability]** Client-forged prices accepted by `POST /api/orders` -> Enforced server-side DB recalculation and option validation.
- **[Unbounded-In-Memory-Growth]** Orders/calls arrays grew without limit -> Added FIFO caps (100 orders, 50 calls/reviews, 200 txns).
- **[Unprotected-Admin-API]** Mutating endpoints lacked auth -> Implemented `/api/auth/pin`, HMAC session tokens, and route guards.
- **[SSE-Sound-Thrashing]** `useEffect` dependent on `isSoundEnabled` caused SSE reconnections -> Decoupled via `isSoundEnabledRef`.

## 5. Rolling Changelog (Max 5)
- `2026-11-22` Adversarial code review audit completed: resolved 5 critical/high/medium issues (DB awaiting, price tampering, memory limits, PIN auth, SSE).
- `2026-11-22` Expanded catalog to 28 dishes across 7 categories (Bar/Cocktails, Steaks, Breakfasts, Specialty Coffee) and re-seeded Neon DB.
- `2026-11-22` Option 3 verified: ELQR/MBANK/О!Деньги payments flow, Sandbox simulation, and Salyk.kg fiscal receipt generation.
- `2026-11-22` Live Vercel production deployment completed at `https://smart-menu-nu.vercel.app`, GitHub CI/CD established.
- `2026-11-22` Option 1 complete: Built Menu CRUD API, `MenuManager.tsx` UI, real-time `MENU_UPDATED` SSE sync, 8/8 tests passed.
