# Condify — Agent Instructions

Condominium management SPA. React 18 + TypeScript + Vite, Chakra UI v2, Supabase (Auth + PostgreSQL + Storage), deployed on Vercel.

## Commands

```bash
npm run dev        # Vite dev server (localhost:5173)
npm run build      # tsc && vite build — typecheck runs first, must pass
npm run lint       # ESLint with --max-warnings 0, zero-tolerance
npm run preview    # Preview production build locally
```

No test runner is configured. There are no tests.

## Environment Setup

Copy `env.example` to `.env.local`. Two required vars:

- `VITE_SUPABASE_URL` — Supabase project URL
- `VITE_SUPABASE_ANON_KEY` — Supabase anon/public key

`RESEND_API_KEY` exists in the example but email notifications are not yet implemented (`src/lib/email.ts` is a stub).

After setting env vars, the Supabase project must have the schema from `supabase-schema.sql` applied via the SQL Editor. This creates all tables, RLS policies, indexes, triggers, and seed data for `payment_values`.

## Architecture

- **No backend server** — Supabase is the entire backend (Auth, DB, Storage). All data access goes through the Supabase JS client.
- **Auth flow**: `AuthProvider` wraps the app. Use `useAuth()` hook for user state, sign-in, sign-out, profile updates. First-time users see `SetupModal` to set name and fraction.
- **Data layer**: `src/lib/data.ts` exports service objects (`announcementService`, `budgetService`, `paymentProofService`, `paymentValueService`, `userService`, `feedbackService`). All use the Supabase client directly.
- **DB types**: Manually defined in `src/lib/supabase.ts` as a `Database` type — NOT generated from Supabase CLI. If the schema changes, update this type by hand.
- **Config**: `src/config.ts` centralizes fractions (`A`–`F`), currency (`EUR`/`pt-PT`), polling intervals, upload limits, and branding. Change hardcoded values there, not in components.
- **Routing**: React Router v6 in `App.tsx`. Authenticated routes render `AppLayout`; unauthenticated redirects to `/login`. Admin-only route at `/admin`.
- **Theme**: Chakra UI theme in `src/theme.ts` with custom gray palette and brand colors.

## Key Conventions

- **Portuguese locale**: Currency formatting uses `pt-PT`, UI strings are in Portuguese. Fraction enum values (`informacao`, `sugestao`, `queixa`) and status values (`todo`, `in_progress`, `done`) are English in the DB but displayed in Portuguese.
- **Fractions**: Condominium units are `A` through `F`. Default is `N/A`. These are enforced at the DB level with `CHECK` constraints and in `config.ts`.
- **RLS**: All tables have Row Level Security. The `is_admin()` Postgres function (SECURITY DEFINER) gates admin access. Regular users can only modify their own data.
- **`verbatimModuleSyntax: true`** in tsconfig — use `import type` for type-only imports.
- **`erasableSyntaxOnly: true`** — no enums with runtime behavior; use union types instead.
- **`.npmrc`**: `legacy-peer-deps=true` and `node-linker=hoisted` — needed for Chakra UI v2 peer dep conflicts.

## Known Gaps

- `feedbackService` in `data.ts` references a `feedback` table that does not exist in `supabase-schema.sql`. It was likely replaced by `announcements`.
- `budget_items` Row type in `supabase.ts` is missing columns that exist in the schema (`is_recurring`, `start_date`, `end_date`, `frequency`, `created_by`, `updated_at`). The Insert/Update types in `data.ts` use these fields correctly.
- `email.ts` is a stub — no email functionality yet.
- No tests exist anywhere in the project.

## Vercel Deployment

`vercel.json` configures SPA rewrite (all routes → `index.html`). Build command is `npm run build`. Environment vars must be set in the Vercel dashboard. Supabase redirect URLs must include the Vercel domain.