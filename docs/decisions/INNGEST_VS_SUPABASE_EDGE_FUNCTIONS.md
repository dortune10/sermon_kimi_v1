# Decision: Inngest vs Supabase Edge Functions for Background Jobs

**Context:** SermonScriber v1 needs a background job system for AI transcription and content generation. We must choose between Inngest Cloud (already stubbed in codebase) and Supabase Edge Functions (Deno-based serverless).

**Date:** 2026-04-21
**Status:** Decision needed

---

## Option A: Inngest Cloud

### Architecture
```
User Upload → Vercel API → Supabase Storage
                    ↓
              Inngest Event (async)
                    ↓
         Inngest Cloud Orchestrator
                    ↓
         Calls /api/inngest (Vercel)
                    ↓
         Runs transcription + content steps
```

### Strengths

| Strength | Details |
|----------|---------|
| **Step-by-step workflows** | Built-in `step.run()`, `step.sleep()`, `step.waitForEvent()`. Each step is retried independently. |
| **Durable execution** | If a step fails, it retries with backoff. Function resumes from last successful step. |
| **Built-in scheduling** | `inngest.createFunction({ cron: '0 9 * * 1' })` for weekly digests, recurring jobs. |
| **Event-driven** | `step.sendEvent()` chains jobs naturally. Upload → Transcribe → Generate Content → Email notification. |
| **Vercel native** | `serve()` integrates directly with Next.js App Router. No separate deploy step. |
| **Local dev** | `npx inngest-cli@latest dev` runs locally with full UI for debugging. |
| **Concurrency control** | `concurrency: { limit: 5 }` prevents Gemini rate limit issues. |
| **Batching** | `batchEvents: { maxSize: 10, timeout: '5s' }` for bulk processing multiple sermons. |
| **Observability** | Full execution logs, step timelines, failure traces in Inngest dashboard. |

### Tradeoffs

| Tradeoff | Details |
|----------|---------|
| **External dependency** | Adds a 3rd-party service to your stack. If Inngest has downtime, background jobs pause. |
| **Cost at scale** | Free tier: 50K function runs/mo. Pro: $50/mo for 500K runs. At 1K sermons/mo, you're on Pro. |
| **Cold starts** | Inngest Cloud calls your Vercel function. Each step can incur a cold start (1-3s). |
| **Extra env vars** | Need `INNGEST_EVENT_KEY` + `INNGEST_SIGNING_KEY` + webhook config. |
| **Exit strategy** | Migrating off Inngest means rewriting workflow orchestration logic. Not trivial. |

### Cost Projection

| Monthly Sermons | Inngest Runs | Plan | Cost |
|-----------------|--------------|------|------|
| 100 | ~400 (4 runs/sermon) | Free | $0 |
| 1,000 | ~4,000 | Free | $0 |
| 5,000 | ~20,000 | Free | $0 |
| 10,000 | ~40,000 | Pro | $50/mo |
| 50,000 | ~200,000 | Pro | $50/mo |
| 100,000 | ~400,000 | Pro | $50/mo |
| 500,000+ | ~2M | Enterprise | Custom |

*Note: Each sermon = 1 upload event + 1 transcribe function (3 steps) + 1 content function (4 steps) = ~8 runs. Inngest counts each step as a run.*

---

## Option B: Supabase Edge Functions

### Architecture
```
User Upload → Vercel API → Supabase Storage
                    ↓
         Call supabase.functions.invoke('transcribe')
                    ↓
         Supabase Edge Function (Deno)
                    ↓
         Runs transcription + content steps
```

### Strengths

| Strength | Details |
|----------|---------|
| **One platform** | Everything in Supabase: DB, Auth, Storage, Edge Functions. Fewer vendors. |
| **Long timeouts** | 400s max execution time. Plenty for 60s transcription + 3x 10s content generation. |
| **No external service** | No 3rd-party orchestrator. Functions are just HTTP endpoints you control. |
| **Deno runtime** | Modern JS/TS with web standards. Good for fetch-heavy AI workloads. |
| **Free tier generous** | 500K Edge Function invocations/month on free tier. |
| **Direct DB access** | Edge Functions can use `supabaseAdmin` service role client with zero network hops (same region). |
| **Lower latency** | No webhook round-trip. Invoke is direct HTTP from Vercel → Supabase Edge. |

### Tradeoffs

| Tradeoff | Details |
|----------|---------|
| **No built-in orchestration** | No `step.run()`, retries, sleep, or event chaining. You build it yourself with DB polling or queues. |
| **All-or-nothing execution** | If step 3 of 5 fails, the whole function fails. No automatic resume from step 3. |
| **No scheduling** | No cron built-in. Need external trigger (Vercel Cron, pg_cron, or manual). |
| **Separate deployment** | Edge Functions live in `supabase/functions/`, deployed via `supabase functions deploy`. Not in your Next.js codebase. |
| **Deno ecosystem** | Different from Node.js. Some npm packages don't work. Must use esm.sh or npm specifiers. |
| **Cold starts** | Edge Functions have cold starts too (~1-2s). |
| **No observability** | Basic logging in Supabase dashboard. No step-level tracing like Inngest. |
| **Concurrency limits** | 1000 concurrent executions on free tier. Pro: 3000. |

### Cost Projection

| Monthly Sermons | Edge Function Invocations | Plan | Cost |
|-----------------|---------------------------|------|------|
| 100 | ~100 | Free | $0 |
| 1,000 | ~1,000 | Free | $0 |
| 10,000 | ~10,000 | Free | $0 |
| 50,000 | ~50,000 | Free | $0 |
| 100,000 | ~100,000 | Free | $0 |
| 500,000+ | ~500,000 | Pro | $25/mo |

---

## Feature-by-Feature Comparison

| Feature | Inngest | Supabase Edge Functions | Winner |
|---------|---------|------------------------|--------|
| **Transcription (60s)** | ✅ Steps retry individually | ✅ 400s timeout, no timeout risk | Edge |
| **Multi-step workflows** | ✅ Native `step.run()` | ❌ Manual orchestration | Inngest |
| **Failure recovery** | ✅ Auto-retry failed step | ❌ All-or-nothing | Inngest |
| **Scheduled jobs (weekly digest)** | ✅ Built-in cron | ❌ Needs external trigger | Inngest |
| **Event chaining (upload → transcribe → content)** | ✅ `step.sendEvent()` | ❌ Manual DB polling/queuing | Inngest |
| **Rate limiting / concurrency** | ✅ `concurrency` config | ❌ Manual implementation | Inngest |
| **Batch processing (bulk sermons)** | ✅ `batchEvents` | ❌ Manual loop | Inngest |
| **Pause/resume workflows** | ✅ `step.waitForEvent()` | ❌ Not possible | Inngest |
| **Observability / debugging** | ✅ Full step traces | ❌ Basic logs | Inngest |
| **Vendor lock-in risk** | ⚠️ Moderate | ✅ Low (open source) | Edge |
| **Stack simplicity** | ⚠️ Extra service | ✅ All Supabase | Edge |
| **Local development** | ✅ Dev server with UI | ⚠️ CLI only, harder to debug | Inngest |
| **Deploy complexity** | ✅ Same Vercel deploy | ❌ Separate Deno deploy | Inngest |
| **Future: email notifications** | ✅ Scheduled + event-driven | ⚠️ Needs external scheduler | Inngest |
| **Future: social media publishing** | ✅ Step + retry logic | ⚠️ Manual error handling | Inngest |
| **Future: usage quotas per plan** | ✅ Middleware/throttling | ⚠️ Manual rate limiting | Inngest |

---

## Issues Down the Road

### If you choose Inngest

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| **Inngest pricing increases** | Medium | Cost is predictable ($50-150/mo at scale). Cheaper than hiring a dev to build orchestration. |
| **Inngest downtime** | Low | Jobs queue and resume when service recovers. No data loss. |
| **Vercel cold start per step** | Medium | Use `maxDuration` + Edge Functions for Inngest handlers if latency matters. |
| **Complex migration off** | Low | Unlikely to migrate. If you do, rewrite is ~2-3 days of work. |

### If you choose Supabase Edge Functions

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| **Building orchestration from scratch** | High | You'll end up reinventing: retry logic, dead letter queues, step tracking, idempotency. ~1-2 weeks of dev work. |
| **Debugging failures** | High | No step-level visibility. When a 5-step function fails at step 4, you re-run everything. |
| **Scheduling limitation** | High | Weekly email digests, recurring cleanup jobs require pg_cron or Vercel Cron (another service). |
| **Deno compatibility issues** | Medium | Some npm packages (like `@google/generative-ai`) may need shims or alternative imports. |
| **Concurrency burst** | Medium | 10 users uploading simultaneously = 10 Edge Functions. At 100 concurrent churches, you hit limits. |

---

## Recommendation

**Use Inngest Cloud.**

### Why?

1. **Your app is workflow-heavy.** Upload → Transcribe → Detect Scriptures → Generate Summary → Generate Social Posts → Generate Study Guide → Mark Complete. That's 6+ steps with dependencies. Inngest handles this natively.

2. **Your future features need scheduling.** Weekly email digests, batch exports, plan quota resets — all need cron. Inngest has this built-in.

3. **Failure recovery is critical.** If Gemini API rate limits you mid-transcription, Inngest retries just that step. With Edge Functions, you re-run everything (and re-pay for Gemini calls).

4. **Time to market.** Inngest is already wired in your codebase (`src/lib/inngest/functions.ts`). Switching to Edge Functions means rewriting orchestration logic, adding DB queue tables, building retry logic, and debugging Deno issues. That's 1-2 weeks vs. 5 minutes to add Inngest keys.

5. **Cost is reasonable.** At 1,000 sermons/month, you're still on Inngest's free tier. At 10,000 sermons, it's $50/mo — less than the Gemini API bill (~$2,700/mo at 10K sermons × $0.27).

### When to switch to Edge Functions?

- If you hit Inngest's Enterprise pricing tier (500K+ runs/mo)
- If Inngest has prolonged downtime or shuts down
- If you hire a dedicated infra team that wants full control
- If Supabase launches a native workflow orchestration product

---

## Hybrid Option (Future)

You can actually use **both**:

- **Inngest** for orchestration (step management, scheduling, retries)
- **Supabase Edge Functions** for the actual AI work (long-running Gemini calls)

Inngest step calls the Edge Function via HTTP, waits for result. You get Inngest's orchestration + Edge Function's timeout. Best of both worlds, but more complex.

**Not recommended for v1.** Stick with one.
