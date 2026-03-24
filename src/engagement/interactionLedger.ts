import { getStateStore } from "../state/storeFactory.js";

const PREFIX = "engagement:interaction";
const HANDLED_TTL_SECONDS = 30 * 24 * 60 * 60;

export type InteractionSource = "mention" | "timeline";

export function buildInteractionKey(input: {
  source: InteractionSource;
  tweetId: string;
  authorId: string;
  conversationId?: string | null;
}): string {
  const threadKey = input.conversationId?.trim() || input.tweetId;
  return `${input.source}:${threadKey}:${input.authorId}`;
}

function reservationKey(interactionKey: string): string {
  return `${PREFIX}:reservation:${interactionKey}`;
}

function handledKey(interactionKey: string): string {
  return `${PREFIX}:handled:${interactionKey}`;
}

export async function isInteractionHandled(interactionKey: string): Promise<boolean> {
  const store = getStateStore();
  return store.exists(handledKey(interactionKey));
}

export async function isInteractionReserved(interactionKey: string): Promise<boolean> {
  const store = getStateStore();
  return store.exists(reservationKey(interactionKey));
}

export async function reserveInteraction(
  interactionKey: string,
  ttlSeconds: number = 15 * 60,
): Promise<boolean> {
  const store = getStateStore();
  const key = reservationKey(interactionKey);
  if (await store.exists(key)) {
    return false;
  }
  await store.set(key, "1", ttlSeconds);
  return true;
}

export async function releaseInteractionReservation(interactionKey: string): Promise<void> {
  const store = getStateStore();
  await store.del(reservationKey(interactionKey));
}

export async function markInteractionHandled(interactionKey: string): Promise<void> {
  const store = getStateStore();
  await store.set(handledKey(interactionKey), "1", HANDLED_TTL_SECONDS);
  await store.del(reservationKey(interactionKey));
}
