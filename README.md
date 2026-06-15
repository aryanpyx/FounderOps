# FounderOps AI

**The memory layer for founders — never lose a decision, commitment, blocker, or metric.**

FounderOps turns scattered startup activity — email, calendar, Slack, Notion, and chat — into **typed, sourced memory**: every **Decision**, **Commitment**, **Blocker**, and **Metric**, captured automatically with full provenance, then surfaced as daily briefs, weekly reviews, decision recovery, and a live knowledge graph.

It is built on **TrustClaw** (Composio's self-hostable agent) for secure, OAuth-brokered tool access, and runs entirely on **free, no-credit-card LLMs** — **NVIDIA NIM** for chat/reasoning/extraction and **Google Gemini** for embeddings.

> Tell it — or email it — *"We're pushing launch to July 5 because Stripe billing is blocked; I'll update investors Friday; MRR is up 21% to $5.1k"* and FounderOps extracts a **Decision**, a **Blocker**, a **Commitment**, and a **Metric**, links them into the graph, and remembers — so months later you can ask *"why did we delay launch?"* and get the real answer **with citations**.

- **Engine integration contract:** [`FOUNDEROPS_ENGINE_CONTRACT.md`](./FOUNDEROPS_ENGINE_CONTRACT.md) — the record shape the UI understands.
- The lower half of this README documents the underlying **TrustClaw** platform.

## ✨ What's inside

| Capability | What it does |
|---|---|
| 🧠 **Typed memory** | Every record is a Decision / Commitment / Blocker / Metric with source, author, timestamp, and a link back to the original (email/Slack/chat). |
| 💬 **Ask FounderOps** | A real agent (NIM + Composio tools) that **acts** on your tools (send mail, create events) **and** answers from memory **with citations**. A persistent tool-execution panel shows every call, its args, and result. |
| 📰 **Daily Brief / Weekly Review** | One click **syncs fresh activity from your connected tools**, then synthesizes an opinionated brief from your typed memory — priority-grouped (🔴 High / 🟡 Needs Attention). |
| 🕰 **Decision Recovery** | *"Why did we decide X?"* — reconstructs the reasoning from the decision plus its linked blockers and metrics, with citations. |
| 🕸 **Memory Graph** | Records auto-link (Decision ↔ Blocker / Metric / Commitment) by keyword & entity overlap into a real, navigable knowledge graph. |
| ⏰ **Passive ingest** | A **daily cron** pulls fresh activity from your tools, filters signal from noise, extracts typed records, and links them — **the memory builds itself.** |
| 📊 **Cockpit / Explorer / Insights** | Real-data dashboard, searchable memory explorer, and analytics — all from your live records. |

## 🏛 Architecture

```
   Connected tools (Composio OAuth)         Frontend — Next.js 15 + React 19
 Gmail · Calendar · Slack · Notion ───┐     cockpit · ask · brief · graph · explorer
 Sheets · Drive · Docs · Tasks        │                    │
                ▲                     │                    ▼
                │              ┌───────┴──── Intelligence Engine ───────────┐
                │              │  ingest → signal-filter → extract → link → │
                │              │  prompts (brief / weekly / decision-recover)│
                │              └───────────────────┬─────────────────────────┘
                │                          ┌────────┴────────┐
                │                          ▼                 ▼
                │            Postgres + pgvector        TrustClaw agent
                │            (typed memory + graph)     (tools + scheduler / cron)
                └──────────────────◀───────────────────────┘
                       daily cron passively ingests from the same tools
```

**Flow:** the founder works in the Next.js UI → the **Intelligence Engine** (signal-filter → LLM extraction → record-linker) converts raw activity into **typed memory** in Postgres/pgvector → the **TrustClaw agent** brokers every tool call through **Composio** (OAuth, sandboxed execution) → a **daily cron** runs the same pipeline passively so memory accrues on its own.

## ⚙️ The Intelligence Engine — `src/founderops/engine/`

| Module | Job |
|---|---|
| `ingest/*` | 5 source adapters (Gmail, Slack, Notion, Calendar, Stripe) → normalized events via Composio |
| `signal-filter.ts` | Drops noise (newsletters, notifications); keeps genuine founder signals |
| `extractor.ts` | LLM → validated JSON → typed `FounderMemory` rows |
| `linker.ts` | Keyword / entity overlap → graph edges (`relatedIds` + typed `blockerIds`/`metricIds`) |
| `orchestrator.ts` | Chains ingest → filter → extract → link with per-step error isolation |
| `prompts/*` | `daily-brief`, `weekly-review`, `decision-recovery` generators |
| `scheduler.ts` | Cron cadence constants |

## 🔌 FounderOps API routes — `src/app/api/founderops/`

| Route | Purpose |
|---|---|
| `POST /ask` | Agent run → answer + tool calls + **citations** + captured memory |
| `GET  /memories` | Typed memory for the signed-in instance |
| `POST /extract` | One-shot Gmail → typed memory |
| `POST /engine/ingest` | Full ingestion cycle (session **or** `CRON_SECRET`) |
| `POST /engine/brief`, `/engine/weekly` | Daily brief / weekly review |
| `POST /engine/recover` | Decision recovery |
| `GET  /api/cron/founderops` | **Daily passive ingest** for every instance (Vercel cron, `CRON_SECRET`) |

## 🆓 Model stack — free, no credit card

| Layer | Provider | Notes |
|---|---|---|
| Chat / reasoning / extraction | **NVIDIA NIM** | `build.nvidia.com` — 128k context, no card (`nvapi-…`) |
| Embeddings | **Google Gemini** | `aistudio.google.com` — 1024-dim |
| Tool access | **Composio** | OAuth-brokered, sandboxed execution |
| Fallback chat | Groq (rotating keys) / OpenAI | optional |

> Cloud only — model selection is environment-driven (`OPENAI_API_KEY` → NVIDIA → Groq). There is no local/Ollama path.

## 🔗 Data sources

Connected per-user through Composio. The engine **ingests** memory from **Gmail, Google Calendar, Slack, and Notion**; the agent can additionally **act on** Google Tasks, Docs, Sheets, Drive, and Meet. (Google OAuth in *Testing* mode only authorizes added test users — connect tools with a whitelisted Google account, or publish the OAuth app.)

## 🚀 Quickstart (local)

```bash
pnpm install
cp .env.example .env        # then fill the keys below
pnpm prisma db push         # creates tables (incl. founder_memory) in your Postgres
pnpm dev                    # http://localhost:3000
```

Requires **Node ≥ 22.12** and **pnpm**. Postgres with the **pgvector** extension (Neon's free tier works — run `CREATE EXTENSION IF NOT EXISTS vector;` once).

## 🔑 Environment variables

| Var | Required | What / where to get it |
|---|---|---|
| `DATABASE_URL` | ✅ | Postgres + pgvector connection string (free at [neon.tech](https://neon.tech)) |
| `BETTER_AUTH_SECRET` | ✅ | `openssl rand -base64 32` |
| `CRON_SECRET` | ✅ | `openssl rand -base64 32` |
| `COMPOSIO_API_KEY` | ✅ | Free at [dashboard.composio.dev](https://dashboard.composio.dev) (tool integrations) |
| `NVIDIA_API_KEY` | ✅ (chat) | Free, no card — [build.nvidia.com](https://build.nvidia.com) (`nvapi-…`). Powers the agent (llama/kimi, 128k context) |
| `GOOGLE_GENERATIVE_AI_API_KEY` | ✅ (embeddings) | Free, no card — [aistudio.google.com/apikey](https://aistudio.google.com/apikey) |
| `GROQ_API_KEY` / `_2` / `_3` | optional | Fallback chat if no NVIDIA key (free, [console.groq.com](https://console.groq.com); rotates on rate-limit) |
| `OPENAI_API_KEY` | optional | If set, cloud chat uses `gpt-4o-mini` instead |
| `COMPOSIO_TOOLKITS` | optional | Comma-separated toolkits to load per request, e.g. `GMAIL,GOOGLECALENDAR,GOOGLETASKS` |
| `REDIS_URL`, `TELEGRAM_*` | optional | Resumable streams / Telegram bot |

**Model routing** (`src/server/clients/ai.ts`): cloud chat prefers OpenAI → NVIDIA NIM → Groq; embeddings use Gemini. Cloud only — no local model path.

After connecting Gmail/Calendar/etc. in **Toolkits**, either:
- open **Ask FounderOps** and tell it a decision (*"Remember: we delayed launch a week due to 2 auth bugs"*), or
- click **Sync & generate** on the **Daily Brief** to passively pull + extract typed memory from your inbox & calendar.

Either way it's captured as typed memory and appears in the cockpit, explorer, and graph.

## ☁️ Deploy (Vercel)

1. Push this app to a GitHub repo and import it into Vercel.
2. **Settings → Git → Production Branch** → set to your deploy branch (so each push auto-deploys).
3. Add the env vars above — **`NEXT_PUBLIC_APP_URL` must be set** to your production URL (the build fails if it's empty).
4. Node **22.x**. The build runs `prisma generate && prisma db push && next build`, so `DATABASE_URL` must be present at build time.
5. `vercel.json` registers two **daily** crons (Hobby plan caps cron at daily — which also keeps free-tier LLM keys well under quota): the TrustClaw agent cron and `/api/cron/founderops` (passive ingest).

---

# TrustClaw

**Your AI that does things while you sleep. _Securely._**

A 24/7 personal AI assistant with 1000+ tools via **OAuth** and **sandboxed execution**. Built on the ideas behind OpenClaw, rebuilt from scratch for security. Talks to you on the web or Telegram, remembers what matters, and handles recurring work on autopilot.

> 🚀 **Self-host on Vercel** - one command, ~2 minutes. See below.

[Demo Video](https://x.com/sarahfim/status/2022518658048888916)
[Open Source Launch Video](https://x.com/sarahfim/status/2053989393036145121)
[![Star History Chart](https://api.star-history.com/svg?repos=ComposioHQ/trustclaw&type=Date)](https://star-history.com/#bytebase/star-history&Date)

---

## ⚡ Deploy your own in seconds


Click here to use the Vercel Template:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FComposioHQ%2Ftrustclaw&project-name=trustclaw&repository-name=trustclaw&env=BETTER_AUTH_SECRET,COMPOSIO_API_KEY,CRON_SECRET&envDescription=Generate%20BETTER_AUTH_SECRET%20and%20CRON_SECRET%20with%3A%20openssl%20rand%20-base64%2032.%20Get%20a%20free%20COMPOSIO_API_KEY%20at%20https%3A%2F%2Fdashboard.composio.dev%2Flogin%3Fflow%3Ddeveloper&envLink=https%3A%2F%2Fgithub.com%2FComposioHQ%2Ftrustclaw%23environment-variables&products=%5B%7B%22type%22%3A%22integration%22%2C%22integrationSlug%22%3A%22neon%22%2C%22productSlug%22%3A%22neon%22%2C%22protocol%22%3A%22storage%22%7D%2C%7B%22type%22%3A%22integration%22%2C%22integrationSlug%22%3A%22upstash%22%2C%22productSlug%22%3A%22upstash-kv%22%2C%22protocol%22%3A%22storage%22%7D%5D&skippable-integrations=1)


### Or use the CLI

```bash
npx @composio/trustclaw deploy
```

That's it. The CLI handles the entire flow.

**Prerequisites:**

- A [Vercel account](https://vercel.com) (`npx vercel login` once)
- A [GitHub account](https://github.com) (`gh auth login` once)
- A free [Composio API key](https://dashboard.composio.dev/login?next=%2F~%2Fproject%2Fsettings%2Fapi-keys&flow=developer) (install the cli `curl -fsSL https://composio.dev/install | bash`)

LLM and embedding calls route through Vercel AI Gateway - **no Anthropic or OpenAI API keys required.**

---

## ✨ Why TrustClaw

| | |
|---|---|
| 🔐 **OAuth Only** | Connects through OAuth. No passwords stored or shared. |
| ⚡ **Zero Setup** | Sign up, chat, done. No API keys or config files. |
| 💤 **Works While You Sleep** | Schedule tasks and let your agent handle them on autopilot. |
| ☁️ **Sandboxed Execution** | Every action runs in an isolated cloud environment that's gone when the task is done. |

### What it can do

- Chat with Claude in a Next.js dashboard or via a Telegram bot
- Long-term memory backed by Postgres + pgvector
- 3-layer context management (pruning, memory flush, summarization compaction) so conversations can run indefinitely
- 1000+ Composio tool integrations (Gmail, GitHub, Slack, Notion, Linear, Calendar, Drive, Stripe, HubSpot, …) gated by the user's connected accounts
- Cron-scheduled agent runs for recurring tasks
- Username/password login via Better Auth

---

## 🛡 Security model

TrustClaw is a deliberate response to the security problems with running AI agents locally:

| | TrustClaw | Vanilla local agents |
|---|---|---|
| **Setup** | Seconds | Hours of config |
| **Credentials** | Encrypted, managed by Composio | Plaintext in local config |
| **Code Execution** | Remote sandbox | On your local machine |
| **Integrations** | OAuth, 1000+ apps | Manual API key setup per app |
| **Skill Security** | Managed tool surface | Unvetted public registry |
| **Audit Trails** | Full action log | None |
| **Revocation** | One click | Find and delete config files |

The design choices:

- **No raw API keys handed to the agent** - Composio brokers OAuth for every tool
- **No code runs on your machine** - every tool call executes in an isolated remote environment
- **No long-lived shell access** - destructive prompt injection from a scraped email can't `rm -rf` your laptop because the agent doesn't have a shell on your laptop

---

## 🏗 Architecture

```
┌──────────────┐    ┌──────────────────────────────────────────┐
│  Web (Next)  │───▶│             Next.js App                  │
│   Telegram   │───▶│  ┌────────────────────────────────────┐  │
│     Cron     │───▶│  │  tRPC API + agent runtime          │  │
└──────────────┘    │  │  (prepareAgentRun → ToolLoopAgent) │  │
                    │  └─────────┬──────────────────────────┘  │
                    │            │                              │
                    │   ┌────────┼─────────┬──────────┐        │
                    │   ▼        ▼         ▼          ▼        │
                    │ Postgres  Redis  AI Gateway  Composio    │
                    │ (pgvector)      (LLM + emb.)             │
                    └──────────────────────────────────────────┘
```

### Tech stack

- [Next.js 15](https://nextjs.org) (App Router) + React 19
- [tRPC](https://trpc.io) for all backend logic
- [Better Auth](https://www.better-auth.com/) (username/password)
- [Prisma](https://prisma.io) + Postgres + [pgvector](https://github.com/pgvector/pgvector)
- [Vercel AI SDK](https://sdk.vercel.ai) + AI Gateway (LLM + embeddings)
- [Composio SDK](https://composio.dev) for tool integrations
- [Tailwind CSS](https://tailwindcss.com) + [shadcn/ui](https://ui.shadcn.com)
- Redis (resumable streams, optional)

---

## ⚠️ Before deploying to production

### Heads-up about the Vercel free (Hobby) plan

TrustClaw runs fine on the free Hobby plan, but Vercel applies two limits that affect the agent:

- **Cron jobs can only run once per day**, and even then they fire anywhere within a 60-minute window of the scheduled hour. Any cron expression more frequent than daily (e.g. hourly, every-30-min) **fails at deploy time** on Hobby. The CLI auto-adjusts `vercel.json` to a daily schedule when it detects you're on Hobby.
- **Functions are capped at 300s (5 min)** — long-running agent turns may time out.

To get **per-minute cron precision** and **up to 800s (~13 min) per function**, upgrade to [Vercel Pro](https://vercel.com/pricing) and re-run the CLI (or manually flip `vercel.json` back to `* * * * *` + bump `maxDuration`).

### Usage caps and billing

TrustClaw ships with Redis-backed per-user rate limiting on the chat, cron, and Telegram agent entrypoints. It is enabled by default and controlled with:

- `RATE_LIMIT_CHAT_PER_MINUTE` / `RATE_LIMIT_CHAT_PER_DAY`
- `RATE_LIMIT_CRON_PER_DAY`
- `RATE_LIMIT_TELEGRAM_PER_MINUTE`
- `RATE_LIMIT_FAIL_MODE` (`open` in development, `closed` otherwise)
- `RATE_LIMIT_ENABLED=false` to bypass all agent entrypoint limits

In production, configure `REDIS_URL` or explicitly set `RATE_LIMIT_FAIL_MODE=open` / `RATE_LIMIT_ENABLED=false`.

If you put a TrustClaw instance on the public internet for strangers to sign up to, add at least:

- A monthly per-user message / tool-call cap enforced server-side
- Billing or invite-only signup if you want to recoup costs

---

## 🧰 Manual setup (local dev)

If you'd rather skip the deploy CLI and run TrustClaw locally:

```bash
pnpm install
cp .env.example .env       # fill in DATABASE_URL, BETTER_AUTH_SECRET, COMPOSIO_API_KEY
pnpm prisma db push        # apply schema (Postgres + pgvector required)
pnpm dev                   # http://localhost:3000
```

For local AI Gateway access, run `vercel link && vercel env pull` to get a short-lived OIDC token, or set `AI_GATEWAY_API_KEY` manually.

For Telegram, point your bot's webhook at `<NEXT_PUBLIC_APP_URL>/api/telegram-webhook` with `TELEGRAM_WEBHOOK_SECRET` as the secret token.

### Required env vars

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Postgres + pgvector connection string |
| `BETTER_AUTH_SECRET` | Session signing key (32+ random bytes) |
| `COMPOSIO_API_KEY` | Composio tool integrations |
| `CRON_SECRET` | Auth for `/api/cron/*` routes (auto-injected on Vercel) |
| `REDIS_URL` _(optional)_ | Resumable streams + abort flags |
| `TELEGRAM_BOT_TOKEN` _(optional)_ | Telegram bot |
| `TELEGRAM_BOT_USERNAME` _(optional)_ | Telegram bot |
| `TELEGRAM_WEBHOOK_SECRET` _(optional)_ | Telegram webhook auth |

See [`.env.example`](./.env.example) for the full template.

---

## 🤝 Contributing

Bug reports, feature ideas, and PRs all welcome. See [CONTRIBUTING.md](./CONTRIBUTING.md) for setup, project layout, coding conventions, and the PR checklist.

For security issues, email [sarah@composio.dev](mailto:sarah@composio.dev) directly - please don't open a public issue.

## 📝 License

MIT - see [LICENSE](./LICENSE).

Built on top of [Composio](https://composio.dev). Inspired by [OpenClaw](https://github.com/openclaw/openclaw), rebuilt for security.
