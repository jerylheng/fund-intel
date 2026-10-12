# Finwise — Financial Planning Workspace

Finwise is an independent financial-planning workspace prototype for advisers. It includes adviser authentication, private client records, household and financial profile capture, goal tracking, policy register, retirement scenarios and a protection-review checklist.

## Architecture

- Next.js App Router on Vercel
- Supabase Auth for adviser sign-in
- Supabase Postgres for persistent planning records
- Row-level security (RLS) to isolate each adviser's client records
- Server-side API routes; the browser only uses the public/anon key
- GitHub Actions build validation on pushes and pull requests

## Setup

1. Create a Supabase project. Select a region appropriate for your organisation's data-residency obligations; Singapore may be available depending on the account/project options.
2. In Supabase SQL Editor, run `supabase/migrations/202610120001_initial_schema.sql`.
3. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to Vercel Project Settings → Environment Variables (Production and Preview as appropriate). Copy `.env.example` for local setup.
4. Configure Supabase Auth email confirmation and the allowed redirect URL `https://YOUR_DOMAIN/auth/callback` plus local development callback URLs.
5. Redeploy the Vercel project, open `/login`, and create/sign into an adviser account.
6. Verify that one adviser cannot read, update or delete another adviser's clients, goals, policies or reviews before entering real customer data.

**Never place a Supabase service-role key in a `NEXT_PUBLIC_*` variable or in browser code.** This app is designed to use the public/anon key with authenticated sessions and database RLS.

## Current implemented functionality

- Authenticated adviser workspace with sign-in, registration, sign-out and protected routes
- Client directory with persistent create/read/update/delete API support
- Client profiles: contact details, date of birth, residency and marital status, dependants count, income, expenses, cash, investments, CPF, property, loans and retirement assumptions
- Financial roadmap and illustrative retirement projection controls
- Persistent financial goals with target, current funding, date, priority and status
- Persistent policy register with insurer, policy type, last four digits only, sum assured, premium, review date and status
- Protection review checklist persisted to the client review record
- Row-level security policies for adviser-owned records
- Responsive desktop and mobile layouts

## Known limitations before production use

- This repository contains the application setup and migration; a Supabase project still must be provisioned and its URL/key added to Vercel.
- Build/deployment must be verified after those environment variables are configured.
- Financial projections are simplified illustrations, not actuarial/CPF calculations or personalised recommendations. They do not yet model CPF LIFE, taxes, fees, policy cash values, sequence-of-returns risk or all cash-flow timing details.
- Client profiles currently store a summary of CPF balances; detailed OA/SA/MA/RA breakdown, dependant records, assets/liabilities ledger, review history and document storage require further UI.
- Policy records currently support create/read/delete; editing, document verification and coverage-gap analysis remain future work.
- No team sharing, adviser firm hierarchy, audit log, export/report workflow, backup/restore testing or formal penetration test has been completed.
- This is not an official AIA or Finjaro website. Demo-free mode is used; no fictitious client records are preloaded.
- Confirm applicable PDPA obligations, data-processing terms, retention policy and organisational approvals before storing identifiable client financial information.

## Local development

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000.

## Build

```bash
npm run build
```

GitHub Actions runs the production build for pushes and pull requests to `main`.

## Data model

The initial migration creates:
- Adviser profiles and clients
- Dependants
- Assets and liabilities
- Policies
- Financial goals
- Client review records

All client-linked tables use adviser ownership policies and row-level security.
