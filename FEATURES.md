# Feature Tracker

Live status of SermonScriber v2.1 features.

---

## ✅ Completed

### Authentication & Authorization
| Feature | Status | Notes |
|---------|--------|-------|
| Email/password login | ✅ Done | Supabase Auth |
| Session cookies (SSR) | ✅ Done | `@supabase/ssr` |
| Middleware auth protection | ✅ Done | Redirects unauthenticated users |
| Auth redirect (login ↔ dashboard) | ✅ Done | Based on session state |
| Role-based access control | ✅ Done | `owner/admin/editor/member` |
| Auto-create profile on signup | ✅ Done | Postgres trigger on `auth.users` |
| Logout button | ✅ Done | In Navbar with Supabase signOut |

### Database & Storage
| Feature | Status | Notes |
|---------|--------|-------|
| Multi-tenant schema | ✅ Done | `churches`, `profiles`, `sermons`, `scripture_references`, `content_assets` |
| Row Level Security (RLS) | ✅ Done | All tables protected |
| Storage bucket `sermon-audio` | ✅ Done | Public bucket for audio files |
| Direct browser upload | ✅ Done | Bypasses Vercel 4.5MB limit |
| File size validation (50MB) | ✅ Done | Client-side warning + error |

### UI / Frontend
| Feature | Status | Notes |
|---------|--------|-------|
| Bilingual routing (`/en/`, `/es/`) | ✅ Done | `next-intl` with locale prefix |
| Locale-less redirect | ✅ Done | `/login` → `/en/login` |
| Landing page | ✅ Done | Basic hero with login CTA |
| Login page | ✅ Done | Email + password form |
| Dashboard | ✅ Done | Recent sermons list + church onboarding redirect |
| Sermons list page | ✅ Done | All sermons with search & filter |
| Sermon detail page | ✅ Done | Transcript + scripture refs + audio player + AI content assets |
| Upload workflow page | ✅ Done | Drag-drop + metadata form + church check |
| Navigation header | ✅ Done | Sticky navbar with Dashboard/Sermons/Upload + logout + language toggle |
| shadcn/ui components | ✅ Done | Button, Card, Input, Badge, Select, Sonner, etc. |
| Toast notifications | ✅ Done | Success/error feedback via Sonner |
| Language toggle | ✅ Done | EN/ES switcher in navbar (desktop + mobile) |
| Audio player | ✅ Done | Native HTML5 audio element on sermon detail |
| Content assets display | ✅ Done | Summary, social posts, study guide grouped by type |
| Sermon search & filtering | ✅ Done | Search title/speaker, filter by status & language |
| Church onboarding | ✅ Done | Form to create church on first login if none exists |

### AI / Background Jobs
| Feature | Status | Notes |
|---------|--------|-------|
| Gemini transcription | ✅ Done | Downloads audio, uploads to Gemini Files API, polls, transcribes |
| Scripture reference detection | ✅ Done | Regex-based extraction from transcript |
| Summary generation | ✅ Done | Via Gemini `generateSummary()` |
| Social posts generation | ✅ Done | Via Gemini `generateSocialPosts()` |
| Study guide generation | ✅ Done | Via Gemini `generateStudyGuide()` |
| Content asset storage | ✅ Done | Saved to `content_assets` table by type |
| Inngest Cloud sync | ✅ Done | Route at `/api/jobs`, events received, functions invoked |

### DevOps & Tooling
| Feature | Status | Notes |
|---------|--------|-------|
| Vercel deployment | ✅ Done | Auto-deploy from GitHub |
| Supabase project linked | ✅ Done | `yijvmslbcsdqhbayjgqo` |
| Environment variables | ✅ Done | 6 vars configured in Vercel (including GEMINI) |
| TypeScript build | ✅ Done | Passes `next build` |
| Database migrations | ✅ Done | `001_initial_schema.sql`, `002_fix_rls_recursion.sql` |
| Demo data seeded | ✅ Done | 2 sermons (EN + ES) with refs & assets |

---

## 🚧 In Progress / Partial

| Feature | Status | Blocker / Next Step |
|---------|--------|---------------------|
| End-to-end transcription test | 🚧 Pending | Inngest sync works; needs real audio upload to verify full pipeline |

---

## ⏳ Pending (Backlog)

### Core Product
| Priority | Feature | Effort | Notes |
|----------|---------|--------|-------|
| 🟡 Medium | Scripture lookup (API.Bible) | 1-2 days | Fetch verse text for detected references |
| 🟡 Medium | User management (invite members) | 2 days | Send invites, accept via email link |
| 🟢 Low | Edit sermon metadata | 0.5 day | Title, speaker, date, status |
| 🟢 Low | Delete sermon | 0.5 day | With confirmation dialog |
| 🟢 Low | Sermon clips / timestamps | 1-2 days | Extract short clips from transcript timestamps |

### Billing & Plans
| Priority | Feature | Effort | Notes |
|----------|---------|--------|-------|
| 🟡 Medium | Stripe subscription integration | 3-4 days | Checkout, webhooks, plan enforcement |
| 🟡 Medium | Usage limits per plan | 2 days | Sermons/month, storage, team size |
| 🟢 Low | Plan upgrade/downgrade UI | 1 day | Pricing page with CTA |

### Bilingual / International
| Priority | Feature | Effort | Notes |
|----------|---------|--------|-------|
| 🟡 Medium | Auto-detect sermon language | 1-2 days | Gemini can detect language from audio |
| 🟡 Medium | Transcript translation | 2-3 days | EN → ES or ES → EN via Gemini |
| 🟢 Low | RTL language support | 2-3 days | Arabic, Hebrew (future) |

### Platform & Integrations
| Priority | Feature | Effort | Notes |
|----------|---------|--------|-------|
| 🟡 Medium | Social media publishing | 2-3 days | Auto-post to Twitter/X, Facebook, Instagram |
| 🟡 Medium | Email notifications | 1-2 days | Transcription complete, weekly digest |
| 🟢 Low | Podcast RSS feed | 1 day | Public feed of published sermons |
| 🟢 Low | Embed player for websites | 1-2 days | iframe embed code for church websites |
| 🟢 Low | Mobile app (PWA) | 2-3 days | Service worker, offline support, install prompt |

### Admin & Ops
| Priority | Feature | Effort | Notes |
|----------|---------|--------|-------|
| 🟡 Medium | Sentry error tracking | 0.5 day | Add DSN to env vars |
| 🟡 Medium | Analytics dashboard | 2 days | Uploads, transcriptions, active users |
| 🟢 Low | Admin panel (superuser) | 2-3 days | View all churches, manage plans, support |
| 🟢 Low | Data export | 1 day | CSV/JSON export of sermons & assets |

---

## 🐛 Known Bugs / Limitations

| Issue | Impact | Workaround | Fix Planned |
|-------|--------|------------|-------------|
| 50MB file upload limit | High | Compress audio to 128kbps MP3 | Upgrade Supabase Pro |
| Profile RLS only self-view | Low | Can't browse church directory | Add `SECURITY DEFINER` view |
| No password reset flow | Medium | Manual admin reset only | Add forgot-password page |

---

## 📊 Metrics (as of 2026-04-23)

- **Tables:** 5
- **Migrations:** 2
- **Pages:** 8 (landing, login, dashboard, sermons, sermon detail, workflow, onboarding, 404)
- **API Routes:** 3 (`/api/jobs`, `/api/sermons/upload`, `/api/churches/create`)
- **Inngest Functions:** 2 (`transcribe-sermon`, `generate-content`)
- **Demo Sermons:** 2 (EN + ES)
- **Test Users:** 1 (`demo@sermonscriber.com`)
- **Commits:** 17
- **Deployments:** 11
