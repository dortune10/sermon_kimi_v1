# Changelog

All notable changes to the SermonScriber v1 Serverless project.

## [Unreleased]

### Added

- **Navigation Header** — Sticky navbar with Dashboard, Sermons, Upload links and logout button
- **Content Assets Display** — Sermon detail page now shows AI-generated summary, social media posts, and study guide
- **Language Toggle** — EN/ES switcher in navbar (desktop + mobile)
- **Audio Player** — Inline HTML5 audio player on sermon detail page
- **Sermon Search & Filtering** — Search by title/speaker, filter by status and language
- **Church Onboarding Flow** — New users without a church are redirected to onboarding to create their church

## [0.2.0] - 2026-04-23

### Infrastructure & DevOps

- **Inngest Cloud Sync Fixed**
  - Renamed `/api/inngest` → `/api/jobs` to bypass Vercel edge security blocking paths containing "inngest"
  - Added `servePath: '/api/jobs'` to Inngest serve handler
  - Confirmed sync working: events received, functions invoked, runs tracked in Inngest Cloud dashboard

- **Vercel Environment Variables**
  - Added `GEMINI_API_KEY` for transcription pipeline
  - Inngest keys updated from `local` dev stubs to real Cloud production keys

### Added

- **Gemini Transcription Pipeline** (end-to-end)
  - `transcribeAudio()`: downloads audio → saves to temp file → uploads to Gemini Files API → polls until ACTIVE → generates transcript
  - Inngest `transcribeSermon` function: updates status to `processing` → transcribes → saves transcript → detects scripture references → saves refs → triggers content generation
  - Inngest `generateContent` function: generates summary, social posts, study guide → saves as `content_assets` → marks sermon `completed`
  - Gracefully handles missing `GEMINI_API_KEY` (skips AI, saves placeholders)

- **Church Creation API**
  - `POST /api/churches/create` — admin-level endpoint creating church + linking user as owner atomically
  - Rollback on profile update failure

### Fixed

- **Inngest Route Blocked by Vercel**
  - Vercel's edge security returns 403 (`x-vercel-mitigated: deny`) on any path containing "inngest"
  - Fixed by renaming serve endpoint to `/api/jobs`

---

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
    - `GEMINI_API_KEY`

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

- **Upload Body Size Limit** (`548888e`)
  - Fixed 413 `Content Too Large` error on Vercel (4.5MB serverless limit)
  - Refactored upload flow:
    - **Before:** File uploaded through Vercel API route → Supabase Storage
    - **After:** File uploaded directly from browser → Supabase Storage (bypasses Vercel limit)
    - API route now receives only metadata (title, speaker, filePath)

- **RLS Infinite Recursion** (`002_fix_rls_recursion.sql`)
  - Fixed `infinite recursion detected in policy for relation "profiles"`
  - Root cause: `profiles` SELECT policy queried `profiles` inside itself
  - Replaced recursive policy with simple `id = auth.uid()` check
  - Simplified storage policies to avoid `profiles` subquery

- **Supabase Type Compatibility** (`4769b6f`)
  - Replaced custom `Database` interface with Supabase CLI-generated types
  - Re-enabled `<Database>` generic on server and admin clients
  - Added explicit type casts on dashboard/sermons/sermon detail pages

- **Inngest Upload Failure** (`19eee20`)
  - Made Inngest event sending non-blocking (try-catch)
  - Upload now succeeds even when `INNGEST_EVENT_KEY` is not configured
  - Prevents 401 `Event key not found` from failing the entire upload

### Added

- **Client-Side Upload Validation**
  - File size check before upload (50MB Supabase free tier limit)
  - File size display in dropzone with color indicator (green/red)
  - Helpful error message suggesting 128kbps MP3 compression

- **Demo Data Seeded**
  - English sermon: "The Good Shepherd - John 10" (status: `completed`, with transcript, summary, social post)
  - Spanish sermon: "El Buen Pastor - Juan 10" (status: `transcribed`, with transcript, summary)
  - Scripture references for both sermons (John 10, Psalm 23)

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

---

Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
