# Decision: Inngest Cloud vs Self-Hosted Inngest

**Context:** Following the Inngest vs Edge Functions comparison, the user wants to evaluate running Inngest self-hosted instead of using Inngest Cloud managed service.

**Date:** 2026-04-21
**Status:** Analysis

---

## Architecture Comparison

### Inngest Cloud (Managed)
```
User Upload → Vercel API → Supabase Storage
                    ↓
         Inngest Cloud (managed SaaS)
                    ↓
         Calls /api/inngest (your Vercel function)
                    ↓
         Runs transcription + content steps
```

**You manage:** Vercel functions only
**Inngest manages:** Queue, scheduler, executor, retries, observability dashboard

---

### Self-Hosted Inngest
```
User Upload → Vercel API → Supabase Storage
                    ↓
         Your Inngest Server (VPS/Docker)
              ↙         ↘
         Redis (queues)  PostgreSQL (events)
                    ↓
         Calls /api/inngest (your Vercel function)
                    ↓
         Runs transcription + content steps
```

**You manage:** Inngest server, Redis, PostgreSQL, VPS, monitoring, backups
**Inngest provides:** Open-source Go binary + SDK

---

## Detailed Comparison

### Cost

| Scale | Inngest Cloud | Self-Hosted (VPS) | Winner |
|-------|---------------|-------------------|--------|
| 0-50K runs/mo | $0 (free tier) | $5-20/mo (VPS) + setup time | Cloud |
| 50K-500K runs/mo | $50/mo (Pro) | $20-40/mo (VPS + Redis) | Cloud |
| 500K-2M runs/mo | $150/mo (Team) | $40-80/mo (bigger VPS) | Self-hosted |
| 2M+ runs/mo | Enterprise (custom) | $80-150/mo (multi-node) | Self-hosted |

**Hidden self-hosted costs:**
- Your time monitoring/troubleshooting: ~2-4 hrs/mo
- Backup strategy for Redis/PostgreSQL
- Incident response (3am pagerduty when queue backs up)

### Setup Complexity

| Task | Inngest Cloud | Self-Hosted |
|------|---------------|-------------|
| Initial setup | 5 min (copy keys) | 2-4 hours (Docker Compose, VPS, DNS) |
| Redis setup | Not needed | Install, configure, secure |
| PostgreSQL setup | Not needed | Install, configure, backups |
| SSL/TLS | Automatic | Let's Encrypt + renewal |
| Monitoring | Built-in dashboard | Self-hosted Grafana/Prometheus or paid service |
| Log aggregation | Built-in | Self-hosted or paid service |
| Updates | Automatic | Manual (watch releases, test, deploy) |

### Operational Burden

| Scenario | Inngest Cloud | Self-Hosted |
|----------|---------------|-------------|
| Queue backs up at 2am | Inngest auto-scales | You wake up, investigate, restart |
| Redis runs out of memory | Not your problem | You resize, configure eviction, monitor |
| PostgreSQL disk full | Not your problem | You resize, archive old events |
| Security patch needed | Inngest handles | You patch, test, deploy |
| New Inngest version | Automatic | Manual migration + testing |
| Debugging a failed job | Dashboard shows step trace | SSH into VPS, grep logs, check Redis |

### Data Control & Compliance

| Concern | Inngest Cloud | Self-Hosted |
|---------|---------------|-------------|
| Event data leaves your infra | Yes (sent to Inngest Cloud) | No (stays on your VPS) |
| GDPR / data residency | Inngest is US-based | You choose region |
| HIPAA / SOC2 | Inngest has SOC2 | You build compliance yourself |
| Data retention | Inngest's policy | Your policy |
| Encryption at rest | Inngest manages | You manage |

**For SermonScriber:** Churches may care about sermon data privacy. Self-hosted keeps everything in your infrastructure. But Inngest Cloud encrypts events and has SOC2.

### Performance

| Metric | Inngest Cloud | Self-Hosted |
|--------|---------------|-------------|
| Latency (event → execution) | ~100-500ms | ~10-50ms (same region) |
| Cold starts | Same (Vercel worker) | Same (Vercel worker) |
| Throughput | Auto-scales | Limited by your VPS size |
| Geographic latency | US/EU regions | Wherever you host |

**Note:** The actual transcription happens in YOUR Vercel function, not in Inngest. Inngest just orchestrates. So transcription speed is identical.

### Reliability

| Scenario | Inngest Cloud | Self-Hosted |
|----------|---------------|-------------|
| Uptime SLA | 99.9% | Your responsibility |
| Multi-region | Built-in | You architect it |
| Disaster recovery | Inngest handles | You build backups + failover |
| Single point of failure | Inngest Cloud | Your VPS + Redis + PostgreSQL |

---

## Self-Hosted: Infrastructure Requirements

### Minimum Setup (Docker Compose)

```yaml
# docker-compose.yml
version: '3.8'
services:
  inngest:
    image: inngest/inngest:latest
    ports:
      - "8288:8288"
    environment:
      - INNGEST_SDK_URL=http://your-vercel-app.com/api/inngest
      - INNGEST_REDIS_URI=redis://redis:6379
      - INNGEST_EVENT_KEY=your-event-key
      - INNGEST_SIGNING_KEY=your-signing-key
    depends_on:
      - redis
      - postgres

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: inngest
      POSTGRES_PASSWORD: secret
      POSTGRES_DB: inngest
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  redis_data:
  postgres_data:
```

### VPS Specs

| Scale | CPU | RAM | Disk | Monthly Cost |
|-------|-----|-----|------|--------------|
| Hobby / MVP | 1 vCPU | 2 GB | 20 GB SSD | $5-10 |
| Small production | 2 vCPU | 4 GB | 50 GB SSD | $15-25 |
| Medium production | 4 vCPU | 8 GB | 100 GB SSD | $40-60 |
| Large production | 8 vCPU | 16 GB | 200 GB SSD | $80-120 |

**Providers:** Hetzner ($5), DigitalOcean ($6), Linode ($6), Vultr ($5), AWS Lightsail ($5)

---

## When to Choose What

### Choose Inngest Cloud if:
- [ ] You're in MVP / pre-revenue phase
- [ ] Team is 1-3 developers
- [ ] You value speed over cost optimization
- [ ] You don't have DevOps expertise
- [ ] You need to ship transcription pipeline this week
- [ ] You're OK with $50-150/mo at scale
- [ ] Data residency isn't a hard requirement

### Choose Self-Hosted if:
- [ ] You're processing 500K+ runs/month
- [ ] You have DevOps capacity (or hire for it)
- [ ] Data must stay in your infrastructure (compliance)
- [ ] You already run a VPS for other services
- [ ] You want to optimize costs at scale
- [ ] You enjoy managing infrastructure

---

## SermonScriber-Specific Analysis

### Your Current Stack
- **Frontend:** Vercel (serverless)
- **Database:** Supabase (managed PostgreSQL)
- **Storage:** Supabase (managed S3)
- **Auth:** Supabase (managed)

**Adding self-hosted Inngest means:**
- You now manage a VPS + Redis + PostgreSQL (separate from Supabase)
- Your stack goes from 2 vendors (Vercel + Supabase) to 3 (+ VPS provider)
- You have one managed service (Supabase) and one self-managed (Inngest)

**This is philosophically inconsistent.** If you're going serverless/managed for everything else, why self-host just the job queue?

### Your Planned Features & Impact

| Feature | Inngest Cloud | Self-Hosted | Notes |
|---------|---------------|-------------|-------|
| Transcription pipeline | ✅ Zero setup | ⚠️ 2-4 hrs setup | Both work equally well |
| Weekly email digests | ✅ Built-in cron | ⚠️ Needs cron trigger | Self-hosted needs external cron |
| Batch exports | ✅ `batchEvents` | ❌ Manual implementation | Big advantage for Cloud |
| Plan usage quotas | ✅ Middleware | ❌ Custom rate limiting | Cloud has built-in throttling |
| Social media publishing | ✅ Retry + schedule | ⚠️ Manual retry logic | Cloud handles API failures gracefully |
| Multi-church isolation | ✅ Event metadata | ✅ Same | Both support tenant isolation |
| Bilingual (EN/ES) | ✅ Parallel steps | ⚠️ Manual parallelism | Cloud can run EN + ES transcription in parallel |

### The Real Cost for You

At **1,000 sermons/month** (realistic Year 1 target):

| | Inngest Cloud | Self-Hosted |
|---|---|---|
| Inngest/Infra cost | **$0** (free tier) | $10-20/mo |
| Your time | 0 min/mo | 2-4 hrs/mo |
| **Effective cost** | **$0** | **$200-400/mo** (your time @ $100/hr) |

At **10,000 sermons/month** (Year 2-3 target):

| | Inngest Cloud | Self-Hosted |
|---|---|---|
| Inngest/Infra cost | **$50/mo** | $20-40/mo |
| Your time | 0 min/mo | 2-4 hrs/mo |
| **Effective cost** | **$50/mo** | **$220-440/mo** |

**Self-hosted only makes financial sense when:**
- You have dedicated DevOps (sunk cost)
- You process 100K+ runs/month
- Compliance requires data residency

---

## Hybrid Recommendation for SermonScriber

### Phase 1: MVP (Now - 6 months)
**Use Inngest Cloud.**

- Free tier covers you
- Ship transcription this week
- Focus on product-market fit, not infrastructure

### Phase 2: Growth (6-18 months)
**Stay on Inngest Cloud.**

- Pro tier ($50/mo) is trivial vs. Gemini costs
- Team is still small
- Product features matter more than infra optimization

### Phase 3: Scale (18+ months)
**Re-evaluate.**

- If you're processing 100K+ sermons/month
- If you hire a platform/DevOps team
- If compliance requirements emerge
- **Then** consider migrating to self-hosted Inngest or building on Supabase Edge Functions

### Phase 4: V2 VPS Architecture (Future)
**Self-hosted everything.**

When you move to the VPS architecture (per your PRD), self-hosting Inngest makes sense because:
- You already run a VPS
- You can colocate Inngest server with your app
- Network latency drops to near-zero
- Cost optimization matters at scale

---

## Migration Path (Cloud → Self-Hosted)

If you start on Cloud and later want to self-host:

1. Deploy self-hosted Inngest server on your VPS
2. Update environment variables (`INNGEST_EVENT_KEY`, `INNGEST_SIGNING_KEY`)
3. Point your Vercel app to self-hosted server
4. **Zero code changes** — just config changes

Inngest SDK is the same. Functions are the same. Only the orchestrator URL changes.

**Migration effort:** 30 minutes

---

## Final Verdict

| | Recommendation |
|---|---|
| **For v1 (now)** | Inngest Cloud |
| **For v2 (VPS)** | Self-hosted Inngest |
| **Migration risk** | Near-zero (same SDK, same functions) |
| **Cost at MVP** | Cloud is cheaper (free vs. VPS + your time) |
| **Cost at scale** | Self-hosted wins at 500K+ runs/mo |

**Bottom line:** Start with Inngest Cloud. It's free now, it's fast to set up, and you can migrate to self-hosted later with zero code changes. Don't optimize infrastructure before you have product-market fit.
