import { targetTweetExists } from "./targetLookup.js";
import {
  buildInteractionKey,
  isInteractionHandled,
  isInteractionReserved,
  markInteractionHandled,
  releaseInteractionReservation,
  reserveInteraction,
  type InteractionSource,
} from "./interactionLedger.js";

export type WritePreflightReason = "TARGET_MISSING" | "ALREADY_REPLIED" | "RESERVATION_FAILED";

export type WritePreflightInput = {
  source: InteractionSource;
  tweetId: string;
  authorId: string;
  conversationId?: string | null;
  verifyTarget?: boolean;
};

export type WritePreflightResult =
  | { ok: true; interactionKey: string }
  | { ok: false; reason: WritePreflightReason; interactionKey: string };

export async function runWritePreflight(input: WritePreflightInput): Promise<WritePreflightResult> {
  const interactionKey = buildInteractionKey(input);

  if (await isInteractionHandled(interactionKey)) {
    return { ok: false, reason: "ALREADY_REPLIED", interactionKey };
  }

  if (await isInteractionReserved(interactionKey)) {
    return { ok: false, reason: "RESERVATION_FAILED", interactionKey };
  }

  if (input.verifyTarget) {
    const exists = await targetTweetExists(input.tweetId);
    if (!exists) {
      return { ok: false, reason: "TARGET_MISSING", interactionKey };
    }
  }

  const reserved = await reserveInteraction(interactionKey);
  if (!reserved) {
    return { ok: false, reason: "RESERVATION_FAILED", interactionKey };
  }

  return { ok: true, interactionKey };
}

export async function releaseWritePreflight(interactionKey: string): Promise<void> {
  await releaseInteractionReservation(interactionKey);
}

export async function markWriteHandled(interactionKey: string): Promise<void> {
  await markInteractionHandled(interactionKey);
}
