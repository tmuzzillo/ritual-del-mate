# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Product Context

**Ritual del Mate** is a personal e-commerce project for handcrafted mate accessories in Argentina. The primary acquisition channel is Instagram — users land on the shop from a link in bio.

### MVP 1 (current)
A read-only catalog (similar to Tienda Nube) where visitors can browse products, read descriptions, and view photos. A single admin manages the catalog via a protected backoffice: adding products, marking items as unavailable, editing names, descriptions, prices, and images.

### MVP 2 (future, not in scope yet)
Full e-commerce: Mercado Pago integration, checkout flow, stock management, and shipping. Do not design or build for these requirements until explicitly asked.

### Roles
- **Visitante anónimo**: browses the public storefront with no authentication required.
- **Admin (1 user)**: authenticated via Supabase Auth, manages the catalog through `/admin/*`. Created manually in Supabase — no registration flow in the app.

## Commands

```bash
npm run dev      # Start dev server at localhost:3000
npm run build    # Production build
npm run lint     # Run ESLint
```

No test runner is configured yet. When adding tests, use Jest or Vitest with React Testing Library.

## Environment Variables

Required in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

## Architecture

**Next.js 16 App Router** with two route groups:

- `app/(shop)/` — Public storefront (catalog, product detail, sets)
- `app/admin/` — Protected backoffice (auth-guarded via `proxy.ts`)
- `app/api/` — API routes for categories, products, sets (currently stubs returning `{ data: [] }`)

**Authentication** is handled in [proxy.ts](proxy.ts), which acts as middleware: unauthenticated users hitting `/admin/*` are redirected to `/admin/login`; authenticated users on `/admin/login` are redirected to `/admin`.

**Supabase** is the backend:
- `lib/supabase/client.ts` — Browser client (`createBrowserClient`)
- `lib/supabase/server.ts` — Server client (`createServerClient` with cookie handling for RSC)
- Database migrations live in `supabase/migrations/`

**Domain types** are defined in [types/index.ts](types/index.ts): `Category`, `Product`, `SetItem`, `MateSet`.

**UI components** use [shadcn/ui](https://ui.shadcn.com) (style: `new-york`, base color: `neutral`) with Radix UI primitives, Tailwind CSS v4, and Lucide icons. Components live in `components/ui/`. Shop and admin-specific components go in `components/shop/` and `components/admin/` respectively.

**Forms** use `react-hook-form` + `zod` for validation, with resolvers via `@hookform/resolvers`.

**Path aliases**: `@/` maps to the project root. Key aliases: `@/components`, `@/lib`, `@/lib/utils` (exposes `cn()`), `@/hooks`.
