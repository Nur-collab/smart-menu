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
- **Current Status:** Split Bill (Разделение счета) with Guest Consumption Breakdown & Direct Cashier Transfer deployed to production (`1c3e374`).
- **Enterprise Features:**
  - Split Bill Module (`SplitBillModal.tsx`):
    - Guest Consumption Breakdown ("На сколько поел"): displays detailed list of consumed dishes per guest (with quantity, e.g. ×1 or ×½, and prices), dishes subtotal, 10% service charge, tip selector, and prominent total to transfer.
    - 1-Click Fast Copy: instant copy of exact guest amount into clipboard with dynamic "Сумма скопирована ✓" feedback for quick pasting into MBANK / O!Dengi / Optima.
    - Direct Cashier Transfer Widget: expandable drawer with Cashier ELQR/MBANK QR code tagged with table number, venue MBANK phone number (`+996 555 12-34-56`) with copy button, and clear payment instructions.
    - "Перевёл кассиру ✓" Status: live tracking per guest with green state badge and table progress indicators.
    - Mode 1 (Equal Split / Поровну): 2-10 guests stepper & quick pills, integer remainder distribution ensuring `sum(shares) === total` down to 1 som, per-person payment cards with 1-click copy and cashier QR.
    - Mode 2 (Itemized Split / По позициям): Dynamic guest management (up to 8 guests), "½" fractional sharing button for teapots and shared appetizers, real-time unallocated sum tracker with visual badge ("Все блюда распределены!").
    - Waiter & Staff Notification: 1-click "Попросить раздельный счет у официанта" button firing KDS waiter call with table context.
    - Complete Dark Mode Ecosystem: Tailwind CSS v4 `@custom-variant dark (&:where(.dark, .dark *));`, `:root` & `.dark` CSS variables, persistent `localStorage('aura_theme')` with cross-tab sync.
  - Kyrgyz National Cuisine: Dedicated category `cat-national` with 16 authentic dishes, modifiers, trilingual metadata (RU/KG/EN), SW v2 image precache.
  - Context Splitting Architecture: Isolated `CartContext` & `KdsContext` under composite `MenuProvider`.
  - ServiceWorker v2.0 Image Precache: Curated 44 Unsplash dish photos precached during worker installation into `aura-smart-menu-images-v2.0.0`; instant 0ms offline image rendering.
  - Strict KDS Status RBAC: `PATCH /api/orders/[id]` enforces `canCookOrders` for cooking/ready, `canServeOrders` for served/paid, and `canManageMenu` for cancellations.
  - Table Isolation & BOLA Defense: `GET /api/orders` and `GET /api/waiter-calls` filter by `?table=N` for unauthenticated guests; full dumps restricted to authenticated staff (`authorizeStaffRequest`).
  - Financial Data Privacy & Fiscal Guard: `GET /api/fiscal` restricted to managers; `GET /api/fiscal/[orderId]` strictly requires `paid` status.
  - POS Bridge & Hardware Isolation: `/api/pos/*` locked behind manager permissions; `/api/printer/print-ticket` requires staff auth.
  - Session Security: `aura_staff_token` cookie set with `httpOnly: true`.
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
- `2026-11-24` Cashier Transfer & Consumption Breakdown: Enhanced Split Bill with itemized personal order list ("на сколько поел"), 1-click amount copy to clipboard, cashier QR widget with MBANK phone number, and "Перевёл кассиру ✓" tracking.
- `2026-11-24` Split Bill Core Module: Implemented dual-mode splitting (Equal Split with remainder integrity & Itemized Split with 1/2 portion sharing), personal ELQR/MBANK QR generation, paid toggles, trilingual support, and full dark theme integration.
- `2026-11-23` Comprehensive Dark Mode: Implemented ThemeContext, ThemeToggle, anti-FOUC script, Tailwind v4 @custom-variant, complete dark styling for all 17 guest components and all 9 admin tabs.
- `2026-11-23` Kyrgyz National Cuisine Expansion: Added `cat-national` with Flame icon & 16 top-priority authentic dishes, modifiers, trilingual metadata (RU/KG/EN), SW offline precaching.
- `2026-11-23` Context Splitting & SW v2.0: Decomposed `CartContext` & `KdsContext`, implemented Unsplash install precaching for offline basement dining.
