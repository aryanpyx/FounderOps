// GET /api/founderops/metric-intel
//
// Metric Intelligence — turns captured Metric memory into computed insights via
// Wolfram|Alpha. For genuine growth metrics it computes a 6-period forecast
// (newV * (newV/oldV)^6) using exact computation, never an LLM guess.
// Degrades gracefully when WOLFRAM_APP_ID is unset (returns { configured: false }).

import { auth } from "~/server/auth";
import { db } from "~/server/clients/db";
import { isWolframConfigured, wolframQuery } from "~/server/clients/wolfram";

export const maxDuration = 60;

// Metrics where a compounding forecast is meaningful (recurring growth), so we
// don't project a one-off price change or a rate like churn/CAC into nonsense.
const GROWTH_RE =
  /mrr|arr|revenue|\busers?\b|signup|customer|subscriber|\bsales\b|waitlist|booking|\bgmv\b|\bcount\b|members|downloads|traffic|visitors|active/i;
const CURRENCY_RE = /\$|mrr|arr|revenue|cac|pric|cost|cash|burn|\bltv\b|\barpu\b/i;

interface MetricInsight {
  metric: string;
  fromLabel: string;
  toLabel: string;
  change: string;
  currency: string;
  projection: number | null;
  horizon: number;
}

function toNumber(v: unknown): number | null {
  if (v == null) return null;
  const n = parseFloat(String(v).replace(/[^0-9.\-]/g, ""));
  return Number.isFinite(n) ? n : null;
}

// Pull the computed value out of a Wolfram LLM-API response. Use the decimal
// approximation only — never the "Exact result:" fraction numerator.
function parseComputed(text: string): number | null {
  const m = /Decimal approximation:\s*([\d,]+(?:\.\d+)?)/i.exec(text);
  if (!m?.[1]) return null;
  const n = parseFloat(m[1].replace(/,/g, ""));
  return Number.isFinite(n) ? Math.round(n) : null;
}

export async function GET(request: Request): Promise<Response> {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return Response.json({ error: "unauthorized" }, { status: 401 });

  const instance = await db.composioClawInstance.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!instance) return Response.json({ error: "no_instance" }, { status: 404 });

  const metrics = await db.founderMemory.findMany({
    where: { instanceId: instance.id, type: "Metric" },
    orderBy: { occurredAt: "desc" },
    take: 12,
  });

  if (!isWolframConfigured()) {
    return Response.json({ configured: false, hasMetrics: metrics.length > 0, insights: [] });
  }

  const insights: MetricInsight[] = [];
  for (const m of metrics) {
    if (insights.length >= 4) break;
    const d = (m.details && typeof m.details === "object" && !Array.isArray(m.details)
      ? (m.details as Record<string, unknown>)
      : {}) as Record<string, unknown>;
    const name = String(d.name ?? m.title);
    const oldV = toNumber(d.old_value);
    const newV = toNumber(d.new_value);
    if (oldV === null || newV === null || oldV <= 0) continue;

    const currency = CURRENCY_RE.test(`${d.old_value}${d.new_value}${name}`) ? "$" : "";

    // Forecast only genuine, growing metrics — exact computation via Wolfram.
    let projection: number | null = null;
    if (GROWTH_RE.test(name) && newV > oldV) {
      const r = await wolframQuery(`${newV}*(${newV}/${oldV})^6`, 600);
      if (r.ok) projection = parseComputed(r.text);
    }

    insights.push({
      metric: name,
      fromLabel: `${currency}${oldV.toLocaleString("en-US")}`,
      toLabel: `${currency}${newV.toLocaleString("en-US")}`,
      change: String(d.change ?? ""),
      currency,
      projection,
      horizon: 6,
    });
  }

  return Response.json({
    configured: true,
    hasMetrics: metrics.length > 0,
    insights,
    generatedAt: new Date().toISOString(),
  });
}
