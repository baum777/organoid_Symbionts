/**
 * Bot Activation Config
 *
 * Reads activation mode and whitelist from env.
 * BOT_ACTIVATION_MODE: "global" | "whitelist"
 * BOT_WHITELIST_USERNAMES: "@Gnomes_onchain,@nirapump_"
 * BOT_WHITELIST_USER_IDS: optional cache
 */

export type ActivationMode = "global" | "whitelist";

export type DenyReplyMode = "silent" | "tease";

export type ActivationConfig = {
  mode: ActivationMode;
  whitelistUsernames: string[];
  whitelistUserIds: string[];
  /** How to handle denied mentions: silent skip or tease reply */
  denyReplyMode: DenyReplyMode;
};

export type ActivationTarget = {
  username?: string | null;
  userId?: string | null;
};

function normalizeUsername(raw: string): string {
  let u = raw.trim().toLowerCase();
  if (u && !u.startsWith("@")) {
    u = `@${u}`;
  }
  return u;
}

function parseUsernames(value: string): string[] {
  if (!value || !value.trim()) {
    return [];
  }
  return value
    .split(",")
    .map((s) => normalizeUsername(s))
    .filter((s) => s.length > 0);
}

function parseUserIds(value: string): string[] {
  if (!value || !value.trim()) {
    return [];
  }
  return value
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

/**
 * Read deny reply mode from environment.
 * Default: "silent"
 */
function parseDenyReplyMode(value: string | undefined): DenyReplyMode {
  const mode = value?.trim().toLowerCase();
  return mode === "tease" ? "tease" : "silent";
}

/**
 * Read activation config from environment.
 * Normalizes: trim, lowercase usernames, ensure @ prefix.
 */
export function readActivationConfigFromEnv(): ActivationConfig {
  const modeRaw = (process.env.BOT_ACTIVATION_MODE ?? "global").trim().toLowerCase();
  const mode: ActivationMode =
    modeRaw === "whitelist" ? "whitelist" : "global";

  const whitelistUsernames = parseUsernames(
    process.env.BOT_WHITELIST_USERNAMES ?? ""
  );

  const whitelistUserIds = parseUserIds(
    process.env.BOT_WHITELIST_USER_IDS ?? ""
  );

  const denyReplyMode = parseDenyReplyMode(process.env.BOT_DENY_REPLY_MODE);

  return {
    mode,
    whitelistUsernames,
    whitelistUserIds,
    denyReplyMode,
  };
}

/**
 * Check whether a runtime target is allowed to proceed under the activation gate.
 *
 * Global mode is intentionally permissive; whitelist mode only allows explicit matches.
 */
export function isActivationAllowed(config: ActivationConfig, target: ActivationTarget): boolean {
  if (config.mode !== "whitelist") {
    return true;
  }

  const normalizedUsername = target.username ? normalizeUsername(target.username) : "";
  const normalizedUserId = target.userId?.trim() ?? "";

  return (
    (normalizedUsername.length > 0 && config.whitelistUsernames.includes(normalizedUsername)) ||
    (normalizedUserId.length > 0 && config.whitelistUserIds.includes(normalizedUserId))
  );
}
