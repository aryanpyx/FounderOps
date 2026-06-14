# FounderOps — Intelligence Engine Contract

This is the integration seam for the **Founder Intelligence Engine** (the "categorizer / orchestrator", box 2 of the architecture). Read this before building so your engine plugs into the UI + memory that already exist — **don't invent a new schema.**

## TL;DR
Your engine's only job is to turn activity into **typed records** and write them to the **`founder_memory`** table in the shape below. The moment you do, the whole UI (cockpit, memory explorer, memory graph, Ask citations) lights up automatically — it already reads from that table.

```
activity (email / slack / chat / stripe ...)
        │   ← YOUR ENGINE classifies + links
        ▼
   founder_memory  (Postgres)   ← the contract
        │
        ▼
   GET /api/founderops/memories → MemoryItem[]  → UI (already built)
```

## The data model (do not change without updating the mapper)

### DB table — `FounderMemory` (`prisma/schema.prisma`)
| field | type | notes |
|---|---|---|
| `id` | string (cuid) | auto |
| `instanceId` | string | **scope every record to the user's instance** (`composio_claw_instance.id`) |
| `type` | enum | `Decision` \| `Commitment` \| `Blocker` \| `Metric` |
| `title` | string | short label |
| `content` | text | one–two sentence summary |
| `occurredAt` | DateTime | when it happened |
| `source` | string | `Gmail` \| `Slack` \| `Linear` \| `Notion` \| `Calendar` \| `Stripe` \| `chat` |
| `author` | string | who |
| `messageId` / `linkToSource` / `rawContent` | string? | provenance back to the source |
| `relatedIds` | string[] | **ids of linked records** (this drives the graph edges) |
| `details` | Json | type-specific payload (below) |

### `details` payload by type (keep these exact keys)
- **Decision:** `{ decision, reason, date, blockerIds: string[], metricIds: string[] }`
- **Commitment:** `{ owner, task, deadline, status: "Open"|"Fulfilled"|"Overdue" }`
- **Blocker:** `{ issue, severity: "High"|"Medium"|"Low", status: "Open"|"Resolved" }`
- **Metric:** `{ name, old_value, new_value, change }`

### Frontend contract — `MemoryItem` (`src/founderops/types/index.ts`)
The read endpoint converts each `FounderMemory` row to a `MemoryItem` (see `src/founderops/lib/memory-mapper.ts`). If you write the fields above correctly, the mapper handles the rest. **The UI only understands `MemoryItem`** — match it.

## How to persist a record (two options)

**Option A — reuse the existing extractor** (LLM categorizes free text → records):
```ts
import { extractMemories } from "~/founderops/lib/extract";
await extractMemories(instanceId, someText, "Slack"); // returns { inserted, found }
```

**Option B — write directly** (when you've already structured it):
```ts
import { db } from "~/server/clients/db";
await db.founderMemory.create({
  data: {
    instanceId,
    type: "Decision",
    title: "Raise pricing to $49",
    content: "Raised pricing from $29 to $49 because CAC rose 22%.",
    occurredAt: new Date(),
    source: "Slack",
    author: "Founder",
    relatedIds: ["<blocker-id>", "<metric-id>"], // ← link for graph edges
    details: { decision: "...", reason: "...", date: "2026-06-15", blockerIds: [], metricIds: [] },
  },
});
```

## How the UI reads it (already built — don't touch)
- `GET /api/founderops/memories` → `{ items: MemoryItem[] }` (scoped to the logged-in user's instance)
- `src/founderops/services/{memoryService,dashboardService,analyticsService}.ts` consume it
- Pages: `src/app/(founderops)/{page,ask,memory-explorer,memory-graph,insights,...}`

## What already exists (don't rebuild)
- ✅ UI (Next.js), memory schema, read API, mapper, services
- ✅ Agent + tools (Gmail/Calendar/Tasks) via NVIDIA NIM (`src/server/clients/ai.ts`)
- ✅ Basic categorizer + chat-source capture (`src/founderops/lib/extract.ts`, wired into `/api/founderops/ask`)

## What to build (the real engine work)
1. **Multi-source ingestion** — categorize from Gmail / Slack / Notion / Stripe, not just chat.
2. **Record linking** — populate `relatedIds` / `blockerIds` / `metricIds` / `decisionId` so the graph shows Decision↔Blocker↔Metric↔Commitment edges.
3. **Opinionated prompt engine** — founder-specific synthesis (daily brief, weekly review).
4. (optional) **Multi-agent orchestration** — currently single-agent.

## Rules
- **Always scope by `instanceId`.** Never write cross-user.
- **Match the `MemoryItem` shape.** If you must change the schema, update `memory-mapper.ts` + `types/index.ts` in the same change.
- **Don't commit secrets.** `.env` is gitignored; use `~/env` for config.
