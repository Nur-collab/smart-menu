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
- **Current Status:** Option 3 (Payment Gateways: ELQR / MBANK / О!Деньги / Split-check) + Expanded 28-dish authentic menu across 7 categories seeded into Neon PostgreSQL.
- **Menu Scope:** 7 categories (Сезонное, Завтраки, Горячее & Стейки, Салаты & Боулы, Specialty Кофе, Бар & Напитки, Десерты & Выпечка) with 28 detailed dishes, KBJU, allergens, badges, and option groups.
- **Live URLs:**
  - Guest Table: `https://smart-menu-nu.vercel.app/?table=4`
  - Staff / Admin Terminal: `https://smart-menu-nu.vercel.app/admin` (PINs: Manager `9999`, Kitchen `2222`, Waiter `1111`)
- **Verification:** Neon DB re-seeded (28 items, 7 categories). `npm run build` passed with zero errors. Vercel auto-deployed via GitHub `main`. Autonomous UI testing via browser agent verified 100% complete (15/15 tests passed: ordering, ELQR payment simulation, Salyk.kg fiscal receipt, KDS status transitions, and menu management).

## 3. Architecture Invariants
- **Vercel Serverless & Neon Pooler:** Production runtime executes over Neon PgBouncer pooler (`DATABASE_URL`) to avoid Lambda connection exhaustion.
- **Real-Time Menu Sync:** Any mutation in `/api/menu` (POST/PATCH/DELETE) triggers `broadcastEvent({ type: 'MENU_UPDATED' })` over SSE.
- **Continuous Deployment (CI/CD):** Every commit pushed to `main` on GitHub triggers an automatic production build and deployment on Vercel.
- **Payment & Fiscalization Invariant:** Checkout routes to `PaymentModal` for ELQR/MBANK/О!Деньги, verifies via `/api/payments/[id]/status` or Sandbox simulation, generates Salyk.kg compliant `FiscalReceipt`.

## 4. Bug Graveyard
- **[Windows-Query-Engine-EPERM]** `prisma generate` failed when background server held `query_engine.node` lock -> Killed background task before build.
- **[Vercel-Build-Prisma-Generate]** Vercel build failed if Prisma Client was missing -> Configured `"build": "prisma generate && next build"` in `package.json`.
- **[Windows-Symlink-EPERM]** `vercel deploy --temporary` failed locally -> Successfully migrated to GitHub Git integration and Vercel Cloud Build.

## 5. Rolling Changelog (Max 5)
- `2026-11-22` Expanded catalog to 28 dishes across 7 categories (Bar/Cocktails, Steaks, Breakfasts, Specialty Coffee) and re-seeded Neon DB.
- `2026-11-22` Option 3 verified: ELQR/MBANK/О!Деньги payments flow, Sandbox simulation, and Salyk.kg fiscal receipt generation.
- `2026-11-22` Live Vercel production deployment completed at `https://smart-menu-nu.vercel.app`, GitHub CI/CD established.
- `2026-11-22` Option 1 complete: Built Menu CRUD API, `MenuManager.tsx` UI, real-time `MENU_UPDATED` SSE sync, 8/8 tests passed.
- `2026-11-22` Successfully migrated to Neon Cloud PostgreSQL (`soft-base-44931194`), pushed schema, seeded menu data.
