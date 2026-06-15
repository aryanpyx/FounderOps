// POST /api/founderops/engine/ingest
//
// Triggers a full ingestion cycle for the logged-in user's instance:
// fetch (Composio tools) → filter → extract → link → store as FounderMemory.
// Resolves instanceId from the session (no body required). Also callable by the
// scheduler/cron with a CRON_SECRET bearer token + { instanceId } body.

import { auth } from "~/server/auth";
import { db } from "~/server/clients/db";
import { env } from "~/env";
import { runIngestionCycle } from "~/founderops/engine/orchestrator";

export const maxDuration = 60;

export async function POST(request: Request): Promise<Response> {
  try {
    const instanceId = await resolveInstanceId(request);
    if (!instanceId) {
      return Response.json({ error: "unauthorized" }, { status: 401 });
    }

    const result = await runIngestionCycle(instanceId);
    return Response.json({ success: true, ...result });
  } catch (error) {
    console.error("[API] /engine/ingest error:", error);
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}

/**
 * Resolve the target instanceId.
 * 1. Logged-in user → their instance (normal UI path).
 * 2. Cron caller with valid CRON_SECRET → instanceId from the body.
 */
async function resolveInstanceId(request: Request): Promise<string | null> {
  const session = await auth.api.getSession({ headers: request.headers });
  if (session) {
    const instance = await db.composioClawInstance.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });
    return instance?.id ?? null;
  }

  const authHeader = request.headers.get("authorization");
  if (env.CRON_SECRET && authHeader === `Bearer ${env.CRON_SECRET}`) {
    const body = (await request.json().catch(() => ({}))) as { instanceId?: string };
    return body.instanceId ?? null;
  }

  return null;
}
