/**
 * Stripe ingestion adapter.
 *
 * Fetches recent payment/subscription events via the Composio
 * STRIPE_LIST_EVENTS tool (or webhook payload), deduplicates, and normalizes.
 */

import { db } from "../../../server/clients/db";
import { callTool } from "../../../server/clients/ai";
import type { RawEvent } from "../types";
import { logger } from "../types";

/** Shape we expect back from the Composio Stripe tool (adapt as needed) */
interface StripeEventResponse {
  events?: Array<{
    id?: string;
    type?: string;
    created?: number;
    data?: {
      object?: {
        amount?: number;
        currency?: string;
        customer?: string;
        description?: string;
        status?: string;
        plan?: { amount?: number; interval?: string; product?: string };
        [key: string]: unknown;
      };
    };
    [key: string]: unknown;
  }>;
  [key: string]: unknown;
}

/** Stripe event types that indicate meaningful business signals */
const SIGNAL_EVENT_TYPES = new Set([
  "charge.succeeded",
  "charge.failed",
  "charge.refunded",
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "invoice.paid",
  "invoice.payment_failed",
  "payment_intent.succeeded",
  "payment_intent.payment_failed",
  "checkout.session.completed",
]);

/**
 * Ingest recent Stripe events for the given instance.
 *
 * Fetches recent charge/subscription events, filters to only
 * business-meaningful event types, deduplicates, and normalizes.
 */
export async function ingestStripe(instanceId: string): Promise<RawEvent[]> {
  logger.info("Stripe adapter: starting ingestion", { instanceId });

  const response = (await callTool(instanceId, "STRIPE_LIST_EVENTS", {
    limit: 50,
  })) as StripeEventResponse;

  const stripeEvents = response?.events ?? [];

  if (stripeEvents.length === 0) {
    logger.info("Stripe adapter: no events returned");
    return [];
  }

  const events: RawEvent[] = [];

  for (const evt of stripeEvents) {
    const eventId = evt.id;
    if (!eventId) continue;

    // Only process business-relevant event types
    if (evt.type && !SIGNAL_EVENT_TYPES.has(evt.type)) {
      continue;
    }

    // Dedup
    const existing = await db.founderMemory.findFirst({
      where: { instanceId, messageId: eventId },
    });

    if (existing) continue;

    const content = buildStripeContent(evt);
    const occurredAt = evt.created ? new Date(evt.created * 1000) : new Date();

    events.push({
      id: eventId,
      source: "Stripe",
      author: "Stripe",
      content,
      occurredAt,
      linkToSource: `https://dashboard.stripe.com/events/${eventId}`,
      rawContent: JSON.stringify(evt.data?.object ?? evt),
      metadata: {
        eventType: evt.type,
        amount: evt.data?.object?.amount,
        currency: evt.data?.object?.currency,
        customer: evt.data?.object?.customer,
      },
    });
  }

  logger.info(`Stripe adapter: ${events.length} new events from ${stripeEvents.length} stripe events`);
  return events;
}

/** Build a human-readable content string from a Stripe event */
function buildStripeContent(evt: NonNullable<StripeEventResponse["events"]>[number]): string {
  const eventType = evt.type ?? "unknown event";
  const obj = evt.data?.object;

  if (!obj) return `Stripe: ${eventType}`;

  const amount = obj.amount;
  const currency = obj.currency?.toUpperCase() ?? "USD";
  const status = obj.status ?? "";
  const description = obj.description ?? "";

  const parts: string[] = [`Stripe ${eventType}`];

  if (amount !== undefined) {
    // Stripe amounts are in cents
    const formatted = (amount / 100).toFixed(2);
    parts.push(`Amount: ${formatted} ${currency}`);
  }

  if (status) {
    parts.push(`Status: ${status}`);
  }

  if (description) {
    parts.push(description);
  }

  // Subscription-specific details
  const plan = obj.plan;
  if (plan) {
    const planAmount = plan.amount !== undefined ? (plan.amount / 100).toFixed(2) : "?";
    parts.push(`Plan: ${planAmount} ${currency}/${plan.interval ?? "month"}`);
  }

  return parts.join(" | ");
}
