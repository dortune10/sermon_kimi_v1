# Changelog

All notable changes to the SermonScriber v1 Serverless project.

## [Unreleased]

## [0.1.0] - 2026-04-21

### Infrastructure & DevOps

- **Supabase Project Linked**
  - Project ref: `yijvmslbcsdqhbayjgqo`
  - Database schema pushed via `supabase db push`
  - Storage bucket `sermon-audio` created (initially private, later made public)
  - Demo user created: `demo@sermonscriber.com` / `DemoPass123!`
  - Demo church created: `Demo Church` (plan: `chapel`, languages: `en` + `es`)
  - Demo user profile linked to church with `owner` role

- **Vercel Deployment**
  - Project: `dortune-gmailcoms-projects/v1-serverless`
  - GitHub repo: `dortune10/sermon_kimi_v1`
  - SSO protection disabled for preview deployments
  - Environment variables configured:
    - `NEXT_PUBLIC_SUPABASE_URL`
    - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
    - `SUPABASE_SERVICE_ROLE_KEY`
    - `INNGEST_EVENT_KEY`
    - `INNGEST_SIGNING_KEY`

### Security

- **Next.js Upgrade** (`4ce1028`)
  - Upgraded `next` from `15.1.3` → `15.5.15`
  - Patches CVE-2025-66478 (middleware authorization bypass)
  - Updated `react` and `react-dom` to compatible versions

### Fixed

- **Locale Redirect** (`0407a48`)
  - Fixed 404 on paths without locale prefix (e.g., `/login` → `/en/login`)
  - Middleware now auto-redirects missing locales to default (`en`)

- **Upload Bucket Name** (`227d6e6`)
  - Fixed storage bucket reference from `sermons` → `sermon-audio`
  - Aligned with migration `001_initial_schema.sql`
  - Improved frontend error handling to display actual server messages

- **Upload Body Size Limit** (`548888e`)
  - Fixed 413 `Content Too Large` error on Vercel (4.5MB serverless limit)
  - Refactored upload flow:
    - **Before:** File uploaded through Vercel API route → Supabase Storage
    - **After:** File uploaded directly from browser → Supabase Storage (100MB+ supported)
    - API route now receives only metadata (title, speaker, filePath)
  - Added upload progress indicator UI

### Database Schema

- **Initial Migration** (`001_initial_schema.sql`)
  - Tables: `churches`, `profiles`, `sermons`, `scripture_references`, `content_assets`
  - Row Level Security (RLS) enabled on all tables
  - Role-based policies: `owner/admin/editor/member`
  - Storage bucket `sermon-audio` with upload/read policies
  - Trigger `on_auth_user_created` auto-creates profile on signup
  - Performance indexes on common query patterns

### Type System

- **Supabase Type Inference**
  - Removed `<Database>` generic from `createServerClient()` and `createClient()`
  - Resolves `never[]` return type on `supabase.from('sermons').select()`
  - Added explicit `CookieOptions` type annotations for `setAll` callbacks

- **Inngest Client**
  - Removed invalid `new Inngest<Events>()` generic
  - Updated to plain constructor for Inngest v3 compatibility

### Added

- **Initial Scaffold** (`328805b`)
  - Next.js 15 + React 19 + TypeScript 5 + Tailwind CSS 3.4.17
  - `next-intl` bilingual routing (`/en/`, `/es/`)
  - Supabase SSR auth + admin client
  - Inngest typed client for background jobs
  - shadcn/ui components (button, card, input, label, select, table, textarea, badge, sonner)
  - App pages: landing, dashboard, sermons list, sermon detail, login, workflow/upload
  - Middleware with locale-aware auth protection
  - Type definitions for `Church`, `Profile`, `Sermon`, `ScriptureReference`, `ContentAsset`
  - Pricing config (Spark/Chapel/Parish/Cathedral tiers)
  - Locale message files (`messages/en.json`, `messages/es.json`)

- **Development Tooling**
  - `.env.example` with all required environment variables
  - `supabase/config.toml` for local development
  - SSH config for GitHub (`~/.ssh/config`)

### Added

- **Demo Data Seeded**
  - English sermon: "The Good Shepherd - John 10" (status: `completed`, with transcript, summary, social post)
  - Spanish sermon: "El Buen Pastor - Juan 10" (status: `transcribed`, with transcript, summary)
  - Scripture references for both sermons (John 10, Psalm 23)

### Known Issues

- `GEMINI_API_KEY` not yet configured (transcription pipeline pending)
- `INNGEST_EVENT_KEY` and `INNGEST_SIGNING_KEY` set to `local` (dev mode)
- Supabase free tier 50MB file upload limit (client-side validation added)
- No actual transcription/Inngest functions deployed yet

---

Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
