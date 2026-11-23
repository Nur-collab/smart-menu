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
- **Current Status:** Kyrgyz National Cuisine (16 dishes + cat-national), Context Splitting & SW v2 Pre-caching deployed. Score: 19.0 / 19.0.
- **Enterprise Features:**
  - Kyrgyz National Cuisine: Dedicated high-priority category `cat-national` ("Национальная кухня 🇰🇬" / "Улуттук ашкана 🇰🇬" / "National Kyrgyz Cuisine 🇰🇬") with 16 authentic dishes (Beshbarmak, Plov Uzgen Devzira, Kuurdak, Lagman Guiru/Boso, Manti, Ashlan-Fu, Shorpo, Chuchvara, Samsa, Shashlik, Lyulya, Boorsok with kaymak, Achik-Chuchuk, Tashkent Tea, Chalap/Maksym).
  - Trilingual Menu: Complete localized titles and descriptions across Russian, Kyrgyz, and English.
  - Context Splitting Architecture: Isolated `CartContext` and `KdsContext` under composite `MenuProvider`. Guest cart actions no longer trigger KDS re-renders; KDS 2.5s polling cycles bypass cart state.
  - ServiceWorker v2.0 Image Precache: Curated 44 Unsplash dish photos precached during worker installation into `aura-smart-menu-images-v2.0.0`; instant 0ms offline image rendering in basement halls.
  - Strict KDS Status RBAC: `PATCH /api/orders/[id]` enforces `canCookOrders` for cooking/ready, `canServeOrders` for served/paid, and `canManageMenu` for cancellations.
  - Table Isolation & BOLA Defense: `GET /api/orders` and `GET /api/waiter-calls` filter by `?table=N` for unauthenticated guests; full dumps restricted to authenticated staff (`authorizeStaffRequest`).
  - Financial Data Privacy & Fiscal Guard: `GET /api/fiscal` restricted to managers; `GET /api/fiscal/[orderId]` strictly requires `paid` status.
  - POS Bridge & Hardware Isolation: `/api/pos/*` locked behind manager permissions; `/api/printer/print-ticket` requires staff auth.
  - Session Security: `aura_staff_token` cookie set with `httpOnly: true`.
  - Network Headers: Production CSP, HSTS (`max-age=63072000; includeSubDomains; preload`), COOP (`same-origin`), and nosniff configured in `next.config.ts`.
- **Live URLs:**
  - Guest Table: `https://smart-menu-nu.vercel.app/?table=4`
  - Staff / Admin Terminal: `https://smart-menu-nu.vercel.app/admin` (PINs: Manager `9999`, Kitchen `2222`, Waiter `1111`)
  - Health Diagnostics: `https://smart-menu-nu.vercel.app/api/health`

## 3. Architecture Invariants
- **Vercel Serverless & Neon Pooler:** Production runtime executes over Neon PgBouncer pooler (`DATABASE_URL`). All DB writes in API handlers are strictly awaited before returning HTTP responses.
- **Context Decoupling:** Re-render boundaries strictly isolated between Guest Cart actions and Staff KDS real-time events.
- **Offline Resilience:** All static menu photography and assets cached in CacheStorage for complete offline dining experience.
- **Zero-Trust Role Enforcement:** Server endpoints never trust client role claims; permissions derived from HMAC session payload against `StaffPermissions`.

## 4. Bug Graveyard
- **[KDS-Guest-Render-Contention]** Guest cart additions caused full re-renders of heavy KDS tables -> Decomposed into `CartProvider` and `KdsProvider`.
- **[Basement-Offline-Image-Failure]** Unsplash dish images failed in basement dining halls with no GSM -> Added SW v2 `MENU_IMAGES_PRECACHE` concurrent install precaching.
- **[KDS-Role-Bypass]** Kitchen could mark orders as served/paid -> Enforced status-based RBAC in `PATCH /api/orders/[id]`.
- **[Cross-Table-Order-Scraping]** `GET /api/orders` returned all restaurant orders to any guest -> Added table filtering and staff auth check.
- **[Unpaid-Order-Fiscalization]** `GET /api/fiscal/[orderId]` issued receipts for unpaid orders -> Enforced `status === 'paid'` precondition.

## 5. Rolling Changelog (Max 5)
- `2026-11-23` Kyrgyz National Cuisine Expansion: Added `cat-national` with Flame icon & 16 top-priority authentic dishes, modifiers, trilingual metadata (RU/KG/EN), SW offline precaching.
- `2026-11-23` Context Splitting & SW v2.0: Decomposed `CartContext` & `KdsContext`, implemented Unsplash install precaching for offline basement dining.
- `2026-11-23` Deployed OWASP API Security Hardening: KDS RBAC, table isolation on orders/calls, POS & printer protection, fiscal integrity guard, CSP/HSTS headers, httpOnly cookies, AI rate limits.
- `2026-11-23` Retained active paid order in guest context for fiscal receipt access and Salyk.kg verification.
- `2026-11-23` Switched to Table Waiter-QR payment: 1-click "Отправить заказ на кухню", "Попросить счет" button, Waiter/Manager "Оплачено гостем ✓" lifecycle, fiscal receipt on completion.
