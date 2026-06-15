// GET /api/cron/founderops
//
// Passive ingestion: Vercel Cron hits this on a schedule (see vercel.json) and we
// run a full ingestion cycle for every instance — pulling fresh activity from each
// founder's connected tools and writing it to typed memory. This is what makes the
// memory "build itself" without anyone clicking Sync.
//
// Scheduled DAILY (not hourly) on purpose: each cycle spends LLM + Composio calls,
// and the free-tier keys have limited quota. Daily keeps us well under the caps.

import { timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { env } from "~/env";
import { db } from "~/server/clients/db";
import { runIngestionCycle } from "~/founderops/engine/orchestrator";

export const maxDuration = 60;

export async function GET(request: Request) {
  // Vercel auto-injects `Authorization: Bearer <CRON_SECRET>` on cron requests.
  // In dev we allow unauthenticated calls so it can be triggered manually.
  if (env.NODE_ENV !== "development") {
    if (typeof env.CRON_SECRET !== "string" || env.CRON_SECRET.length === 0) {
      return new Response("Server misconfigured: CRON_SECRET missing", { status: 503 });
    }
    const authHeader = request.headers.get("authorization") ?? "";
    const expected = Buffer.from(`Bearer ${env.CRON_SECRET}`);
    const actual = Buffer.from(authHeader);
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
      return new Response("Unauthorized", { status: 401 });
    }
  }

  const instances = await db.composioClawInstance.findMany({ select: { id: true } });

  const results: Array<{ instanceId: string; extracted?: number; linked?: number; error?: string }> = [];

  // Sequential (not parallel) to stay gentle on free-tier LLM/Composio rate limits.
  for (const inst of instances) {
    try {
      const r = await runIngestionCycle(inst.id);
      results.push({ instanceId: inst.id, extracted: r.extracted, linked: r.linked });
    } catch (error) {
      results.push({
        instanceId: inst.id,
        error: error instanceof Error ? error.message : "ingestion failed",
      });
    }
  }

  return NextResponse.json({
    ran: instances.length,
    results,
    at: new Date().toISOString(),
  });
}
