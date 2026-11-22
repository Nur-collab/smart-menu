# PROJECT MEMORY & CONTEXT STATE: SMART-MENU
> Auto-maintained by AI Agent. Keep strictly under 180 lines. Use telegraphic English.

## 1. Stack & Commands
- **Framework:** Next.js 16.3.3 (App Router), React 19.2.8, TypeScript 5, Tailwind CSS v4, Lucide React.
- **ORM & DB:** Prisma 6.19.3, Neon PostgreSQL cloud database (`ep-floral-moon-bh015x46`).
- **Core Commands:**
  - Dev server: `npm run dev`
  - Production build: `npm run build`
  - Production server: `npm run start` (available at `http://localhost:3000` & `http://<LAN_IP>:3000`)
  - DB Migration: `npx prisma db push`
  - DB Seed: `npx tsx prisma/seed.ts`
  - Test suites: `npx tsx scripts/test_menu_crud.ts`, `npx tsx scripts/test_neon_integration.ts`

## 2. Active Work State
- **Current Status:** Option 1 (Menu CRUD in Admin Panel) 100% complete. Admin dashboard `/admin` has dedicated "Управление меню" tab with inline price editor, creation modal (with allergens, badges, and modifiers), real-time SSE broadcasts (`MENU_UPDATED`), and full delete capabilities.
- **Verification:** `npm run build` passed in 8.2s (all 14 routes generated), `scripts/test_menu_crud.ts` passed 8/8 tests, `scripts/test_neon_integration.ts` passed 10/10 tests.
- **Immediate Next Step:** Ready for Option 2 (Deployment to Vercel or testing via local Wi-Fi / tunnel) or Option 3 (Kyrgyz live payment gateways ElQR/MBANK).

## 3. Architecture Invariants
- **Real-Time Menu Sync:** Any mutation in `/api/menu` (POST/PATCH/DELETE) triggers `broadcastEvent({ type: 'MENU_UPDATED' })` over SSE, causing guest browsers and KDS tablets to reload items without hard page refreshes.
- **Dual-URL Connection Invariant:** Runtime queries connect via Neon PgBouncer pooler (`DATABASE_URL`), schema migrations (`prisma db push`) use `DIRECT_URL`.
- **Hybrid Real-Time & Persistence:** Orders and menu updates persist asynchronously to Neon PostgreSQL while maintaining sub-50ms reactive UI via SSE.
- **Defensive Menu Fallback:** `/api/menu` queries Neon DB first; if database is unreachable, it seamlessly falls back to static `mockData` without crashing the customer UI.

## 4. Bug Graveyard
- **[Next16-RouteParams-Promise]** Next.js 16 route parameters `context.params` are asynchronous Promises -> Must `await context.params` in dynamic route handlers (`/api/menu/[id]`).
- **[Prisma8-CLI-Mismatch]** `npm i -g neon` pulled Prisma 8 RC which removed `prisma generate` -> Pinned stable `prisma@^6` and `@prisma/client@^6`.
- **[PgBouncer-Migration-Lock]** Pushing migrations over PgBouncer connection pool failed on advisory locks -> Separated `DATABASE_URL` (pooler) and `DIRECT_URL` (direct instance).

## 5. Rolling Changelog (Max 5)
- `2026-11-22` Option 1 complete: Built Menu CRUD API (`/api/menu`, `/api/menu/[id]`), `MenuManager.tsx` UI, real-time `MENU_UPDATED` SSE sync, 8/8 tests passed.
- `2026-11-22` Successfully migrated to Neon Cloud PostgreSQL (`soft-base-44931194`), pushed schema, seeded menu data, verified 10/10 E2E tests.
- `2026-11-22` Project evaluated and selected over static `cafe-qr-menu` prototype; `.agents/MEMORY.md` established.
- `2026-10-07` Stage 7 complete: Guest reviews system with 2GIS/Google Maps funnel & Admin NPS analytics dashboard.
- `2026-10-07` Stage 6 complete: PWA, offline caching, and Service Worker background sync.
