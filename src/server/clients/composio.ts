import { Composio } from "@composio/core";
import { VercelProvider } from "@composio/vercel";
import { env } from "~/env";

export function hasComposioApiKey(): boolean {
  return Boolean(env.COMPOSIO_API_KEY && env.COMPOSIO_API_KEY.trim().length > 0);
}

export function createComposioClient(): Composio<VercelProvider> | null {
  if (!hasComposioApiKey()) {
    return null;
  }
  return new Composio({
    apiKey: env.COMPOSIO_API_KEY,
    provider: new VercelProvider(),
  });
}
