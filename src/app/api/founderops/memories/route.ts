import { auth } from "~/server/auth";
import { db } from "~/server/clients/db";
import { toMemoryItem } from "~/founderops/lib/memory-mapper";

// Returns the user's real typed founder-memory records as MemoryItem[].
export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const instance = await db.composioClawInstance.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!instance) {
    return Response.json({ items: [] });
  }

  const rows = await db.founderMemory.findMany({
    where: { instanceId: instance.id },
    orderBy: { occurredAt: "desc" },
    take: 500,
  });

  return Response.json({ items: rows.map(toMemoryItem) });
}
