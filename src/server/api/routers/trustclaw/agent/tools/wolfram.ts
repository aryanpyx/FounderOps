import { z } from "zod";
import { zodSchema } from "ai";
import type { Tool } from "ai";
import { wolframQuery } from "~/server/clients/wolfram";

const wolframInputSchema = z.object({
  query: z
    .string()
    .describe(
      "A computation as a clean math expression or short phrase (Wolfram parses these best; avoid long sentences). Examples: '5100*(5100/4200)^6', 'percent change from 4200 to 5100', '250000/30000', 'doubling time at 21% growth', 'GDP of India 2024'.",
    ),
});

/**
 * Grounds the agent's math in Wolfram|Alpha. The model should call this for ANY
 * quantitative answer instead of computing in its head — finance, forecasts,
 * growth/runway/ratio math, unit conversions, statistics, and real-world data.
 */
export function createWolframTool(): Tool<{ query: string }, { result: string }> {
  return {
    description:
      "Compute EXACT answers via Wolfram|Alpha — math, finance, statistics, forecasts, unit conversions, growth/runway/ratio calculations, and real-world data. ALWAYS use this for numbers instead of calculating yourself; never guess a figure.",
    inputSchema: zodSchema(wolframInputSchema),
    execute: async ({ query }) => {
      const r = await wolframQuery(query);
      return { result: r.text };
    },
  };
}
