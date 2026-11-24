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
- **Current Status:** Split Bill (Разделение счета) in dual modes (Equal & By-Items) deployed to production (`91e2053`).
- **Enterprise Features:**
  - Split Bill Module (`SplitBillModal.tsx`):
    - Mode 1 (Equal Split / Поровну): 2-10 guests stepper & quick pills, tip selection (0%, 5%, 10%, 15%), integer remainder distribution ensuring `sum(shares) === total` down to 1 som, per-person payment cards, "Оплачено ✓" status tracking, national ELQR/MBANK expandable payment QR code, waiter bill request integration.
    - Mode 2 (Itemized Split / По позициям): Dynamic guest management (up to 8 guests), individual dish portion counters, "½" fractional sharing button for teapots and shared appetizers, real-time unallocated sum tracker with visual badge ("Все блюда распределены!"), individual subtotal + 10% service charge + custom tip computation, personal ELQR/MBANK QR code generation.
    - Dual Source Support: seamlessly operates on either active placed order (`activeOrder.items`) or unplaced cart (`cart.items`).
    - Trilingual dictionary integration (`ru`, `kg`, `en`) and native Light/Dark theme token compliance.
  - Complete Dark Mode Ecosystem: Tailwind CSS v4 `@custom-variant dark (&:where(.dark, .dark *));`, `:root` & `.dark` CSS variables, persistent `localStorage('aura_theme')` with cross-tab sync, dynamic mobile `<meta name="theme-color">` (`#121214` dark, `#FBF9F5` light), 0ms anti-FOUC blocking script in `<head>`.
  - Comprehensive View Coverage: All 18 guest UI components (Header, ThemeToggle, LanguageSwitcher, WeatherBanner, SearchBar, CategoryNav, DishCards, DishDetailModal, CartDrawer, OrderTrackerModal, WaiterCallModal, FloatingCartBar, AiSommelierModal, FiscalReceiptModal, SplitBillModal) + all 9 staff admin tabs (KDS, Calls, Stop-list, QR, Analytics, KKM, POS/Printers, Reviews/2GIS, Menu Management) + PinPadLockScreen.
  - Kyrgyz National Cuisine: Dedicated category `cat-national` with 16 authentic dishes, modifiers, trilingual metadata (RU/KG/EN), SW v2 image precache.
  - Context Splitting Architecture: Isolated `CartContext` & `KdsContext` under composite `MenuProvider`.
  - ServiceWorker v2.0 Image Precache: Curated 44 Unsplash dish photos precached during worker installation into `aura-smart-menu-images-v2.0.0`; instant 0ms offline image rendering.
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
- **Split Bill Integrity:** Integer floor division with deterministic remainder assignment (`remainder = total % count`) guarantees zero rounding discrepancies. Item allocation supports fractional steps (0.5 for teapots/family platters).
- **Dark Mode Architecture:** Class-based dark mode driven by `html.dark` via `@custom-variant dark`. Zero white flash on page load guaranteed by synchronous blocking inline script in `<head>`.
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
- `2026-11-24` Split Bill (Разделение счета) Module: Implemented dual-mode splitting (Equal Split with remainder integrity & Itemized Split with 1/2 portion sharing), personal ELQR/MBANK QR generation, paid toggles, trilingual support, and full dark theme integration.
- `2026-11-23` Comprehensive Dark Mode: Implemented ThemeContext, ThemeToggle, anti-FOUC script, Tailwind v4 @custom-variant, complete dark styling for all 17 guest components and all 9 admin tabs.
- `2026-11-23` Kyrgyz National Cuisine Expansion: Added `cat-national` with Flame icon & 16 top-priority authentic dishes, modifiers, trilingual metadata (RU/KG/EN), SW offline precaching.
- `2026-11-23` Context Splitting & SW v2.0: Decomposed `CartContext` & `KdsContext`, implemented Unsplash install precaching for offline basement dining.
- `2026-11-23` Deployed OWASP API Security Hardening: KDS RBAC, table isolation on orders/calls, POS & printer protection, fiscal integrity guard, CSP/HSTS headers, httpOnly cookies, AI rate limits.
