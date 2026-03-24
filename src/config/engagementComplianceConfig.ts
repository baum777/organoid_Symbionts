export interface EngagementComplianceConfig {
  aiApproval: boolean;
  optInHandles: string[];
  optOutHandles: string[];
}

function parseHandles(input: string | undefined): string[] {
  if (!input) return [];
  return input
    .split(",")
    .map((value) => value.trim().replace(/^@/, "").toLowerCase())
    .filter(Boolean);
}

export function readEngagementComplianceConfig(): EngagementComplianceConfig {
  return {
    aiApproval: (process.env.ENGAGEMENT_AI_APPROVED ?? "false") === "true",
    optInHandles: parseHandles(process.env.ENGAGEMENT_OPT_IN_HANDLES),
    optOutHandles: parseHandles(process.env.ENGAGEMENT_OPT_OUT_HANDLES),
  };
}
