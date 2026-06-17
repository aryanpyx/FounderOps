import { createMemorySaveTool } from "./memory-save";
import { createMemorySearchTool } from "./memory-search";
import { createScheduleTool } from "./schedule";
import { createWolframTool } from "./wolfram";
import { isWolframConfigured } from "~/server/clients/wolfram";
export { searchMemoriesForContext } from "./memory-search";

export function createCustomTools(instanceId: string, userTimezone = "UTC") {
  return {
    memory_save: createMemorySaveTool(instanceId),
    memory_search: createMemorySearchTool(instanceId),
    schedule: createScheduleTool(instanceId, userTimezone),
    // Wolfram|Alpha exact-computation tool — only exposed when WOLFRAM_APP_ID is set.
    ...(isWolframConfigured() ? { wolfram: createWolframTool() } : {}),
  };
}
