import { z } from "zod";

// Chat backend. Cloud only: "groq-cloud" routes to the env-configured cloud LLM
// (OpenAI gpt-4o-mini > NVIDIA NIM > Groq). Legacy ids fall back to cloud.
export const ALLOWED_ANTHROPIC_MODELS = ["groq-cloud"] as const;

export const allowedAnthropicModelSchema = z.enum(ALLOWED_ANTHROPIC_MODELS);

export const createInstanceInput = z.object({
  anthropicModel: allowedAnthropicModelSchema.default("groq-cloud"),
});

export type CreateInstanceInput = z.infer<typeof createInstanceInput>;
