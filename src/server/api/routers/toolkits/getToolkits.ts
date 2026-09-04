import { protectedProcedure } from "~/server/api/trpc";
import { createComposioClient } from "~/server/clients/composio";
import { getToolkitsInput } from "./getToolkits.schema";

export const getToolkits = protectedProcedure
  .input(getToolkitsInput)
  .query(async ({ ctx, input }) => {
    const userId = ctx.session.user.id;
    const composio = createComposioClient();
    if (!composio) {
      return {
        items: [
          { slug: "gmail", name: "Gmail", logo: "https://logos.composio.dev/api/gmail", noAuth: false, connected: false },
          { slug: "github", name: "GitHub", logo: "https://logos.composio.dev/api/github", noAuth: false, connected: false },
          { slug: "slack", name: "Slack", logo: "https://logos.composio.dev/api/slack", noAuth: false, connected: false },
          { slug: "googlecalendar", name: "Google Calendar", logo: "https://logos.composio.dev/api/googlecalendar", noAuth: false, connected: false },
          { slug: "notion", name: "Notion", logo: "https://logos.composio.dev/api/notion", noAuth: false, connected: false },
        ],
        nextCursor: null,
      };
    }
    const session = await composio.create(userId, {});

    // 1. Fetch toolkit listing
    const toolkitsResult = await session.toolkits({
      ...(input.search && input.search.length >= 3
        ? { search: input.search }
        : {}),
      ...(input.isConnected !== undefined
        ? { isConnected: input.isConnected }
        : {}),
      limit: input.limit,
      nextCursor: input.cursor,
    });

    if (toolkitsResult.items.length === 0) {
      return { items: [], nextCursor: null };
    }

    // 2. Merge and return
    const items = toolkitsResult.items.map((toolkit) => ({
      slug: toolkit.slug,
      name: toolkit.name,
      logo: toolkit.logo ?? `https://logos.composio.dev/api/${toolkit.slug}`,
      noAuth: toolkit.isNoAuth,
      connected: !!toolkit.connection?.isActive,
    }));

    return {
      items,
      nextCursor: toolkitsResult.nextCursor ?? null,
    };
  });
