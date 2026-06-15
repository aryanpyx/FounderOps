import type { MemoryItem } from '../types';

export interface ToolCall {
  name: string;
  args: unknown;
  result: unknown;
}

export interface AnswerPayload {
  answer: string;
  sources: MemoryItem[];
  relatedMemories: MemoryItem[];
  suggestedQuestions: string[];
  toolCalls: ToolCall[];
  captured: number;
}

// Calls the REAL TrustClaw agent (NIM + Composio tools + pgvector memory) via the
// non-streaming /api/founderops/ask endpoint. Same-origin, so the logged-in session
// cookie is sent automatically. sources/relatedMemories/suggestedQuestions stay empty
// until the typed-memory extraction layer lands (then they'll be populated for real).
export const queryService = {
  askQuestion: async (query: string): Promise<AnswerPayload> => {
    const empty = {
      sources: [],
      relatedMemories: [],
      suggestedQuestions: [],
      toolCalls: [],
      captured: 0,
    };
    try {
      const res = await fetch('/api/founderops/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });

      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        const reason =
          res.status === 401
            ? 'You need to sign in first — open /login, then come back.'
            : res.status === 404
              ? 'No assistant instance yet. Finish onboarding in /dashboard first.'
              : err.error ?? `Request failed (${res.status})`;
        return { answer: `⚠️ ${reason}`, ...empty };
      }

      const data = (await res.json()) as {
        answer?: string;
        toolCalls?: ToolCall[];
        captured?: number;
        sources?: MemoryItem[];
      };
      return {
        answer: data.answer?.trim() || 'The agent returned no answer.',
        ...empty,
        toolCalls: data.toolCalls ?? [],
        captured: data.captured ?? 0,
        sources: data.sources ?? [],
      };
    } catch {
      return {
        answer: '⚠️ Could not reach the agent. Is the dev server running?',
        ...empty,
      };
    }
  },
};
