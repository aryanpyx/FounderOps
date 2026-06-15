// POST /api/founderops/engine/recover
//
// "Why did we decide X?" — reconstructs the reasoning behind a past decision from
// typed memory: the decision, its linked blockers/metrics, and an LLM explanation
// with citations. This is the feature that turns FounderOps from a chatbot into
// institutional memory.

import { auth } from "~/server/auth";
import { db } from "~/server/clients/db";
import { recoverDecision } from "~/founderops/engine/prompts/decision-recovery";

export const maxDuration = 60;

export async function POST(request: Request): Promise<Response> {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return Response.json({ error: "unauthorized" }, { status: 401 });

  const instance = await db.composioClawInstance.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!instance) return Response.json({ error: "no_instance" }, { status: 404 });

  const body = (await request.json().catch(() => ({}))) as { question?: string };
  if (!body.question?.trim()) {
    return Response.json({ error: "question is required" }, { status: 400 });
  }

  try {
    const answer = await recoverDecision(instance.id, body.question.trim());
    return Response.json({ answer, generatedAt: new Date().toISOString() });
  } catch (error) {
    console.error("[API] /engine/recover error:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    );
  }
}
