// POST /api/founderops/engine/weekly — generates the founder's weekly review from
// stored typed memory (resolves instanceId from the logged-in session).
import { auth } from "~/server/auth";
import { db } from "~/server/clients/db";
import { generateWeeklyReview } from "~/founderops/engine/prompts/weekly-review";

export const maxDuration = 60;

export async function POST(request: Request): Promise<Response> {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return Response.json({ error: "unauthorized" }, { status: 401 });
    }
    const instance = await db.composioClawInstance.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });
    if (!instance) {
      return Response.json({ error: "no_instance" }, { status: 404 });
    }

    const review = await generateWeeklyReview(instance.id);
    return Response.json({
      success: true,
      review,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[API] /engine/weekly error:", error);
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}
