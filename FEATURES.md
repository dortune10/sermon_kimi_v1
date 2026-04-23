# Feature Tracker

Live status of SermonScriber v1 features.

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
| Dashboard | ✅ Done | Recent sermons list |
| Sermons list page | ✅ Done | All sermons with status badges |
| Sermon detail page | ✅ Done | Transcript + scripture references |
| Upload workflow page | ✅ Done | Drag-drop + metadata form |
| shadcn/ui components | ✅ Done | Button, Card, Input, Badge, etc. |
| Toast notifications | ✅ Done | Success/error feedback |

### DevOps & Tooling
| Feature | Status | Notes |
|---------|--------|-------|
| Vercel deployment | ✅ Done | Auto-deploy from GitHub |
| Supabase project linked | ✅ Done | `yijvmslbcsdqhbayjgqo` |
| Environment variables | ✅ Done | 5 vars configured in Vercel |
| TypeScript build | ✅ Done | Passes `next build` |
| Database migrations | ✅ Done | `001_initial_schema.sql`, `002_fix_rls_recursion.sql` |
| Demo data seeded | ✅ Done | 2 sermons (EN + ES) with refs & assets |

---

## 🚧 In Progress / Partial

| Feature | Status | Blocker / Next Step |
|---------|--------|---------------------|
| Inngest event sending | 🚧 Stubbed | Event is sent but key is `local`. Pipeline not built yet. |
| Spanish UI translations | 🚧 Partial | `messages/es.json` exists but not all keys translated |
| Logout button | 🚧 Missing | No UI element to sign out |
| Navigation header | 🚧 Missing | No nav between dashboard/sermons/upload/settings |

---

## ⏳ Pending (Backlog)

### Core Product
| Priority | Feature | Effort | Notes |
|----------|---------|--------|-------|
| 🔴 High | Gemini transcription pipeline | ✅ Done | Code deployed. Needs `GEMINI_API_KEY` to activate. |
| 🔴 High | Content generation (AI) | 2-3 days | Summary, social posts, clips from transcript |
| 🔴 High | Church onboarding flow | 1-2 days | Create church on first login if none exists |
| 🟡 Medium | Scripture reference detection | 1-2 days | Parse transcript for Bible verses, normalize |
| 🟡 Medium | Scripture lookup (API.Bible) | 1-2 days | Fetch verse text for detected references |
| 🟡 Medium | Sermon search & filtering | 1 day | By date, speaker, status, language |
| 🟡 Medium | User management (invite members) | 2 days | Send invites, accept via email link |
| 🟢 Low | Audio player on sermon detail | 1 day | Inline audio playback |
| 🟢 Low | Edit sermon metadata | 0.5 day | Title, speaker, date, status |
| 🟢 Low | Delete sermon | 0.5 day | With confirmation dialog |

### Billing & Plans
| Priority | Feature | Effort | Notes |
|----------|---------|--------|-------|
| 🟡 Medium | Stripe subscription integration | 3-4 days | Checkout, webhooks, plan enforcement |
| 🟡 Medium | Usage limits per plan | 2 days | Sermons/month, storage, team size |
| 🟢 Low | Plan upgrade/downgrade UI | 1 day | Pricing page with CTA |

### Bilingual / International
| Priority | Feature | Effort | Notes |
|----------|---------|--------|-------|
| 🔴 High | Spanish UI (full translation) | 1 day | Complete `messages/es.json` |
| 🟡 Medium | Language toggle in UI | 0.5 day | Dropdown or link to switch locale |
| 🟡 Medium | Auto-detect sermon language | 1-2 days | Gemini can detect language from audio |
| 🟡 Medium | Transcript translation | 2-3 days | EN → ES or ES → EN via Gemini |
| 🟢 Low | RTL language support | 2-3 days | Arabic, Hebrew (future) |

### Platform & Integrations
| Priority | Feature | Effort | Notes |
|----------|---------|--------|-------|
| 🟡 Medium | Inngest Cloud setup | 1 day | Real event key, deploy functions |
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
| Inngest not configured | Medium | Upload works, transcription doesn't | Set up Inngest Cloud |
| No logout UI | Low | Close browser or clear cookies | Add logout button |
| No navigation header | Low | Use browser back/forward | Add top nav |
| Profile RLS only self-view | Low | Can't browse church directory | Add `SECURITY DEFINER` view |

---

## 📊 Metrics (as of 2026-04-21)

- **Tables:** 5
- **Migrations:** 2
- **Pages:** 6
- **API Routes:** 2
- **Demo Sermons:** 2 (EN + ES)
- **Test Users:** 1 (`demo@sermonscriber.com`)
- **Commits:** 12
- **Deployments:** 8
