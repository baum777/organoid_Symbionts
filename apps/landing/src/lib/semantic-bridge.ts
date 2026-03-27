import { content, type SignalCardContent } from "@/lib/content";

export type SemanticBridgeSignal = SignalCardContent & {
  id: "dominant-embodiment" | "orchestration-mode" | "audit-trace";
};

export type SemanticBridgePreview = {
  observedAt: string;
  dominantEmbodiment: string;
  lastOrchestrationMode: string;
  sampleAuditTrace: string;
  signals: SemanticBridgeSignal[];
};

export function getSemanticBridgePreview(now: Date = new Date()): SemanticBridgePreview {
  return {
    observedAt: now.toISOString(),
    dominantEmbodiment: "◆-Pulse-Heart",
    lastOrchestrationMode: "Sovereign Propagation",
    sampleAuditTrace: `preview bridge | source: ${content.brand.name} | runtime-coupling: false`,
    signals: [
      {
        id: "dominant-embodiment",
        eyebrow: "Dominant embodiment",
        title: "◆-Pulse-Heart",
        body: "The preview stack currently leans into pressure, momentum, and controlled heat.",
        tone: "bio",
        meta: "synthetic live signal",
      },
      {
        id: "orchestration-mode",
        eyebrow: "Last orchestration mode",
        title: "Sovereign Propagation",
        body: "The preview reads like a push outward: clear thesis, clean routing, no extra drama.",
        tone: "interface",
        meta: "read-only bridge",
      },
      {
        id: "audit-trace",
        eyebrow: "Sample audit trace",
        title: "Preview only, no runtime coupling.",
        body: "This is a landing-side signal surface derived from static content and request time, not from the bot runtime.",
        tone: "meme",
        meta: "no external dependencies",
      },
    ],
  };
}
