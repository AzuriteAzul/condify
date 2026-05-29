# Condify

<p align="center">
  <strong>Modern Condominium Management — Built for Residents, Designed for Clarity</strong>
</p>

<p align="center">
  <a href="#"><img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License: MIT" /></a>
  <a href="https://react.dev/"><img src="https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white" alt="React 18" /></a>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript&logoColor=white" alt="TypeScript" /></a>
  <a href="https://vitejs.dev/"><img src="https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white" alt="Vite" /></a>
  <a href="https://supabase.com/"><img src="https://img.shields.io/badge/Supabase-Auth%20%2B%20PostgreSQL-3ECF8E?logo=supabase&logoColor=white" alt="Supabase" /></a>
  <a href="https://vercel.com/"><img src="https://img.shields.io/badge/Deployed%20on-Vercel-000000?logo=vercel&logoColor=white" alt="Vercel" /></a>
</p>

---

## Overview

**Condify** is a single-page application (SPA) for managing condominium communities. It replaces scattered spreadsheets and informal communication with a unified, role-aware platform where residents track payments, review budgets, submit feedback, and administrators manage the entire community from one place.

Built with **React 18**, **TypeScript**, and **Vite**, styled with **Chakra UI v2**, and backed entirely by **Supabase** (Auth, PostgreSQL, and Storage), Condify is deployed on **Vercel** and ready to scale from a single building to a full portfolio.

> **Locale**: Portuguese (pt-PT)  
> **Currency**: EUR

---

## Features

- **Authentication & Onboarding** — Secure login via Supabase Auth. First-time users complete a quick setup to set their name and apartment fraction.
- **Resident Dashboard** — At-a-glance payment tracking, fraction overview, and personal financial status.
- **Budget Management** — Full income and expense ledger with support for recurring items, date ranges, and frequency tracking.
- **Payment Proof Upload** — Residents upload proof-of-payment images; administrators review and verify.
- **Quote Map** — A visual directory of condominium quotes and service providers.
- **Announcement System** — Information, suggestions, and complaints flow through a structured channel.
- **Kanban Task Board** — Track tasks across `To Do`, `In Progress`, and `Done` columns.
- **Admin Panel** — Role-gated management of users, payment values, and announcements.
- **Row-Level Security (RLS)** — Every table is protected by Supabase RLS policies; users can only touch their own data unless they are an admin.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | React 18 |
| Language | TypeScript 5 |
| Build Tool | Vite |
| UI Library | Chakra UI v2 |
| Backend | Supabase (Auth + PostgreSQL + Storage) |
| Deployment | Vercel |
| Linting | ESLint (zero-tolerance) |

---

## Getting Started

### Prerequisites

- Node.js 18+
- A Supabase project (free tier is fine)
- (Optional) A Vercel account for deployment

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/AzuriteAzul/condify.git
   cd condify
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

   > This project uses `legacy-peer-deps=true` and `node-linker=hoisted` in `.npmrc` to resolve Chakra UI v2 peer dependency conflicts.

3. **Configure environment variables**

   ```bash
   cp env.example .env.local
   ```

   Fill in the required values:

   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

4. **Apply the database schema**

   Open the **SQL Editor** in your Supabase dashboard and run the contents of `supabase-schema.sql`. This creates all tables, indexes, triggers, Row-Level Security policies, and seeds the `payment_values` table.

5. **Start the development server**

   ```bash
   npm run dev
   ```

   The app will be available at `http://localhost:5173`.

---

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start the Vite development server |
| `npm run build` | Type-check and build for production |
| `npm run lint` | Run ESLint with `--max-warnings 0` |
| `npm run preview` | Preview the production build locally |

---

## Project Structure

```
condify/
├── public/                  # Static assets
├── src/
│   ├── components/          # React components (Dashboard, Budget, QuoteMap, Kanban, etc.)
│   ├── contexts/
│   │   └── AuthContext.tsx  # Authentication provider & useAuth hook
│   ├── lib/
│   │   ├── data.ts          # Data service layer (Supabase client wrappers)
│   │   └── supabase.ts      # Supabase client initialization & Database types
│   ├── types/               # Shared TypeScript type definitions
│   ├── config.ts            # Centralized config (fractions, currency, limits, branding)
│   ├── theme.ts             # Chakra UI custom theme (gray palette, brand colors)
│   └── App.tsx              # React Router v6 routing & layout composition
├── supabase-schema.sql      # Full database schema, RLS policies, triggers, seed data
├── env.example              # Environment variable template
├── vercel.json              # SPA rewrite rules for Vercel
├── tsconfig.json             # TypeScript configuration
└── package.json
```

---

## Key Conventions

- **Portuguese UI** — All user-facing strings are in Portuguese. Database enum values for feedback types (`informacao`, `sugestao`, `queixa`) and task statuses (`todo`, `in_progress`, `done`) are stored in English but rendered in Portuguese.
- **Fractions** — Condominium units are labeled `A` through `F`. The default is `N/A`. These are enforced at the database level via `CHECK` constraints and in `src/config.ts`.
- **TypeScript strictness** —
  - `verbatimModuleSyntax: true` → use `import type` for type-only imports.
  - `erasableSyntaxOnly: true` → no enums with runtime behavior; prefer union types.
- **No backend server** — Supabase is the entire backend. All data access goes through the Supabase JS client.
- **No tests** — There is no test runner configured in this project.

---

## Deployment

Condify is optimized for **Vercel**.

1. Push your code to GitHub.
2. Import the repository in Vercel.
3. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to the Vercel Environment Variables.
4. Ensure your Supabase project’s **Auth Settings → URL Configuration** includes your Vercel production domain in the redirect URLs.

`vercel.json` is already configured to rewrite all routes to `index.html` for SPA behavior.

---

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository.
2. Create a feature branch (`git checkout -b feature/your-feature`).
3. Make your changes and ensure `npm run lint` passes with zero warnings.
4. Open a pull request with a clear description of what changed and why.

If you are adding new database fields, remember to:
- Update `supabase-schema.sql`.
- Update the `Database` type in `src/lib/supabase.ts`.
- Update the relevant service objects in `src/lib/data.ts`.

---

## License

This project is licensed under the **MIT License**.

---

<p align="center">
  <sub>Built with care for condominium communities.</sub>
</p>
