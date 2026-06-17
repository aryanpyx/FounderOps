import { env } from "~/env";

// Wolfram|Alpha client. Uses the LLM API (plain-text, computation-grounded answers
// designed for LLM tool use). Free AppID at https://developer.wolframalpha.com
// (~2,000 queries/month, non-commercial). Set WOLFRAM_APP_ID to enable.

export function isWolframConfigured(): boolean {
  return Boolean(env.WOLFRAM_APP_ID);
}

export interface WolframResult {
  ok: boolean;
  text: string;
}

export async function wolframQuery(input: string, maxchars = 700): Promise<WolframResult> {
  if (!env.WOLFRAM_APP_ID) {
    return { ok: false, text: "Wolfram is not configured (set WOLFRAM_APP_ID)." };
  }
  try {
    const url =
      `https://www.wolframalpha.com/api/v1/llm-api` +
      `?appid=${encodeURIComponent(env.WOLFRAM_APP_ID)}` +
      `&maxchars=${maxchars}` +
      `&input=${encodeURIComponent(input)}`;

    const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
    const text = (await res.text()).trim();

    if (!res.ok) {
      // Wolfram returns 501 ("no short answer") / 400 (invalid) with a body.
      return { ok: false, text: text.slice(0, 300) || `Wolfram could not compute that (${res.status}).` };
    }
    return { ok: true, text };
  } catch {
    return { ok: false, text: "Wolfram request timed out or failed." };
  }
}
