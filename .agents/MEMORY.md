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
- **Current Status:** Offline Table Payment Flow (Waiter Bill & QR) + Security & Persistence Hardening deployed.
- **Enterprise Features:**
  - Removed online gateway simulation from guest flow; guests order straight to kitchen ("Отправить заказ на кухню").
  - Table payment flow: Guests request bill with QR via "Попросить счет", triggering waiter call (`reason: 'bill'`).
  - Waiter / Manager KDS terminal (`/admin`) allows advancing served orders to "Оплачено гостем ✓" (`status: 'paid'`).
  - Automatic fiscal receipt generation on payment confirmation with Salyk.kg verification link.
  - Full bidirectional order status sync: Staff KDS/Admin (`/admin`) updates propagate to Guest (`/?table=4`) in <2.5s.
  - Hardened security: Webhook test-signature bypass disabled in production; `crypto.timingSafeEqual` signature checks; sliding-window IP rate limiter on reviews (`RATE_LIMITS.REVIEWS` 5/5min); stoplist mutation token enforcement (`Authorization: Bearer <token>`); staff RBAC permissions on review moderation (`canManageReviews`).
  - Neon DB persistence fallback for reviews: `getAllReviews()` and `updateReviewStatus()` query Neon DB directly across serverless container restarts.
- **Live URLs:**
  - Guest Table: `https://smart-menu-nu.vercel.app/?table=4`
  - Staff / Admin Terminal: `https://smart-menu-nu.vercel.app/admin` (PINs: Manager `9999`, Kitchen `2222`, Waiter `1111`)
  - Health Diagnostics: `https://smart-menu-nu.vercel.app/api/health`

## 3. Architecture Invariants
- **Vercel Serverless & Neon Pooler:** Production runtime executes over Neon PgBouncer pooler (`DATABASE_URL`). All DB writes in API handlers are strictly awaited before returning HTTP responses.
- **Hybrid Real-Time Sync:** Because Vercel serverless containers do not share memory, Neon PostgreSQL serves as the single source of truth; clients poll `/api/orders` every 2.5s when visible.
- **Timing-Safe Crypto & Anti-Brute-Force:** PIN auth is strictly rate-limited with HTTP 429 lockouts; tokens and webhook signatures are verified in constant time via `crypto.timingSafeEqual`.
- **Domain Services:** Route handlers act purely as HTTP adapters; all domain validation, DB queries, and pricing calculations reside in `src/services/`.
- **Continuous Deployment (CI/CD):** Every commit pushed to `main` on GitHub triggers an automatic production build and deployment on Vercel.

## 4. Bug Graveyard
- **[Online-Gateway-Friction]** Guests forced through mock online card/ELQR gateway modals -> Switched to Kyrgyz restaurant standard: offline table payment via waiter pre-cheque, QR, or terminal; 1-click send to kitchen.
- **[Serverless-Review-Desync]** Reviews stored purely in-memory lost on container recycle -> Persisted to Neon `GuestReview` table with DB fallback in `getAllReviews` & `updateReviewStatus`.
- **[Webhook-Signature-Bypass-Risk]** Test signatures accepted in production -> Gated test signatures behind `NODE_ENV !== 'production'` and enforced `timingSafeEqual`.
- **[Stoplist-Unauthorized-Mutation]** Stoplist POST lacked Authorization header from client context -> Passed `staff_session_token` in `MenuContext.toggleStopList`.
- **[Serverless-Order-Status-Desync]** Ephemeral lambdas lacked cross-container Neon sync; guest lacked polling fallback -> Direct Neon DB queries on PATCH/GET, 2.5s client polling with visibility listener.

## 5. Rolling Changelog (Max 5)
- `2026-11-23` Switched to Table Waiter-QR payment: 1-click "Отправить заказ на кухню", "Попросить счет" button, Waiter/Manager "Оплачено гостем ✓" lifecycle, fiscal receipt on completion.
- `2026-11-23` Hardened Security & Persistence: Review rate limiting, DB fallback for reviews, production webhook signature enforcement, stoplist auth token integration.
- `2026-11-22` Fixed real-time order status desync: Neon DB source of truth for PATCH/GET, 2.5s client polling, reactive FloatingCartBar & OrderTrackerModal stages.
- `2026-11-22` Full 3-Language System (KG, RU, EN) rolled out: 28 dishes, 7 categories, options, search, cart, waiter call, payment modals. E2E verified on production.
- `2026-11-22` Principal Architecture upgrade: Rate limiting, Timing-Safe HMAC, Input schemas, OWASP headers, `OrderService`, `/api/health`.
