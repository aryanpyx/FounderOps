import { createGroq } from "@ai-sdk/groq";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import type { EmbeddingModel, LanguageModel } from "ai";
import { env } from "~/env";

// Chat / agent calls run on Groq by default (free, no credit card required),
// with an optional local Ollama backend users can select for private chat.
// Embeddings run on Google Gemini, since Groq has no embedding models.
// This replaces the Vercel AI Gateway path, which requires a card on file.

// All available Groq keys. Extra keys extend the daily free-tier quota: when one
// key returns 429 (rate limit), the request is retried with the next key.
const groqKeys = [
  env.GROQ_API_KEY,
  env.GROQ_API_KEY_2,
  env.GROQ_API_KEY_3,
].filter((k): k is string => Boolean(k));

let groqKeyIndex = 0;

// Custom fetch that rotates Groq keys on 429. The AI SDK sends a string body, so
// it can be safely replayed across attempts. On success we stick with the key
// that worked; if all keys are rate-limited we return the last 429 response.
const rotatingGroqFetch: typeof fetch = async (input, init) => {
  let lastResponse: Response | undefined;
  for (let i = 0; i < groqKeys.length; i++) {
    const idx = (groqKeyIndex + i) % groqKeys.length;
    const headers = new Headers(init?.headers);
    headers.set("Authorization", `Bearer ${groqKeys[idx]}`);
    const res = await fetch(input, { ...init, headers });
    if (res.status !== 429) {
      groqKeyIndex = idx;
      return res;
    }
    lastResponse = res;
  }
  return lastResponse ?? fetch(input, init);
};

const groq = createGroq({
  apiKey: groqKeys[0] ?? env.GROQ_API_KEY,
  fetch: rotatingGroqFetch,
});
const google = createGoogleGenerativeAI({
  apiKey: env.GOOGLE_GENERATIVE_AI_API_KEY,
});

// Local models via Ollama's OpenAI-compatible endpoint (http://localhost:11434/v1).
// No API key needed - runs entirely on the user's machine/GPU.
const ollama = createOpenAICompatible({
  name: "ollama",
  baseURL: env.OLLAMA_BASE_URL,
});

// OpenAI (optional). When a key is set, Cloud chat uses gpt-4o-mini: cheap,
// high rate limits, reliable tool-calling, 128k context - no free-tier TPM wall.
const openai = env.OPENAI_API_KEY
  ? createOpenAI({ apiKey: env.OPENAI_API_KEY })
  : null;
const OPENAI_MODEL = "gpt-4o-mini";

// NIM's llama-3.3-70b only supports ONE tool call per turn. The AI SDK doesn't
// set parallel_tool_calls, so NIM defaults to parallel and 400s when the model
// emits multiple. This fetch forces parallel_tool_calls:false on tool requests.
const nimFetch: typeof fetch = async (input, init) => {
  if (init?.body && typeof init.body === "string") {
    try {
      const body = JSON.parse(init.body) as Record<string, unknown>;
      if (Array.isArray(body.tools) && body.tools.length > 0) {
        body.parallel_tool_calls = false;
        init = { ...init, body: JSON.stringify(body) };
      }
    } catch {
      // non-JSON body - send unchanged
    }
  }
  return fetch(input, init);
};

// NVIDIA NIM (optional, free, no card). OpenAI-compatible endpoint serving
// llama-3.3-70b at full 128k context - no Groq 12k TPM wall, so all tools fit.
const nvidia = env.NVIDIA_API_KEY
  ? createOpenAICompatible({
      name: "nvidia",
      baseURL: "https://integrate.api.nvidia.com/v1",
      apiKey: env.NVIDIA_API_KEY,
      fetch: nimFetch,
    })
  : null;
// Highest-fidelity agentic model on NIM. Alternatives (swap here, all tested OK
// for tool-calling): "openai/gpt-oss-120b", "nvidia/llama-3.3-nemotron-super-49b-v1.5",
// "qwen/qwen3-next-80b-a3b-instruct", "meta/llama-3.3-70b-instruct".
const NVIDIA_MODEL = "moonshotai/kimi-k2.6";

// Tool-calling capable Groq model. Change here to swap chat models globally.
// llama-3.3-70b-versatile: 12k TPM (fits the agent's ~9k request) and the only
// Groq free model that both fits AND does tools. gpt-oss-120b formats tools more
// cleanly but only has 8k TPM (too small). Occasional malformed tool calls here
// are a known small-model quirk - retry, or move to Cerebras for higher limits.
const CHAT_MODEL = "llama-3.3-70b-versatile";

// Gemini embedding model. outputDimensionality is set to 1024 to match the
// VECTOR(1024) column in the Prisma schema (composio_claw_memory.embedding).
const EMBEDDING_MODEL = "gemini-embedding-001";
const EMBEDDING_DIMENSIONS = 1024;

/**
 * Resolve a chat/agent language model from the per-instance selection.
 * A "local-*" selection routes to Ollama (on-device); anything else (including
 * legacy "claude-*" ids) routes to Groq cloud.
 */
export function chatModel(storedModel?: string): LanguageModel {
  if (storedModel?.startsWith("local")) {
    return ollama(env.OLLAMA_MODEL);
  }
  // Cloud preference: OpenAI > NVIDIA NIM (free, 128k context) > Groq.
  if (openai) {
    return openai(OPENAI_MODEL);
  }
  if (nvidia) {
    return nvidia(NVIDIA_MODEL);
  }
  return groq(CHAT_MODEL);
}

/** Gemini text embedding model for memory vectors. */
export function embeddingModel(): EmbeddingModel {
  return google.textEmbeddingModel(EMBEDDING_MODEL);
}

/** Provider options that pin the embedding output to 1024 dimensions. */
export const embeddingProviderOptions = {
  google: { outputDimensionality: EMBEDDING_DIMENSIONS },
} as const;
