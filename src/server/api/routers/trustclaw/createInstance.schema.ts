import { z } from "zod";

// Selectable chat backends. "groq-cloud" routes to Groq (cloud); "local-ollama"
// routes to a local Ollama model. Legacy "claude-*" ids fall back to cloud.
export const ALLOWED_ANTHROPIC_MODELS = [
  "groq-cloud",
  "local-ollama",
] as const;

export const allowedAnthropicModelSchema = z.enum(ALLOWED_ANTHROPIC_MODELS);

export const createInstanceInput = z.object({
  anthropicModel: allowedAnthropicModelSchema.default("groq-cloud"),
});

export type CreateInstanceInput = z.infer<typeof createInstanceInput>;
