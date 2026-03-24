/**
 * Embodiment Memory Snippets — globale Roast-Muster aus Audit-Extraktion.
 * Max 5–8 Snippets, nur bei Standalone-Mentions in den Prompt eingebunden.
 */
import { getStateStore } from "../state/storeFactory.js";
import { logInfo, logWarn } from "../ops/logger.js";

/** Redis/StateStore Key (Prefix ORGANOID_ON_SOL: wird vom Store hinzugefügt) */
const SNIPPETS_KEY = "embodiment:memory:snippets";
const MAX_SNIPPETS = 6;

export interface Snippet {
  text: string;
  createdAt: string;
  sourceCount: number;
}

export async function loadEmbodimentSnippets(): Promise<Snippet[]> {
  const store = getStateStore();
  try {
    const raw = await store.get(SNIPPETS_KEY);
    return raw ? (JSON.parse(raw) as Snippet[]) : [];
  } catch (err) {
    logWarn("[EmbodimentSnippets] Failed to load", { err });
    return [];
  }
}

export async function saveEmbodimentSnippets(snippets: Snippet[]): Promise<void> {
  const store = getStateStore();
  try {
    const limited = snippets.slice(0, MAX_SNIPPETS);
    await store.set(SNIPPETS_KEY, JSON.stringify(limited));
  } catch (err) {
    logWarn("[EmbodimentSnippets] Failed to save", { err });
  }
}

export async function addOrUpdateSnippets(newSnippets: string[]): Promise<void> {
  const existing = await loadEmbodimentSnippets();
  const now = new Date().toISOString();

  for (const text of newSnippets) {
    if (!text.trim()) continue;
    const idx = existing.findIndex((s) => s.text === text);
    const item = idx >= 0 ? existing[idx] : undefined;
    if (item) {
      item.sourceCount += 1;
      item.createdAt = now;
    } else {
      existing.push({ text, createdAt: now, sourceCount: 1 });
    }
  }

  existing.sort(
    (a, b) =>
      b.sourceCount - a.sourceCount || b.createdAt.localeCompare(a.createdAt),
  );

  await saveEmbodimentSnippets(existing);
  logInfo("[EmbodimentSnippets] Updated", {
    added: newSnippets.length,
    total: existing.length,
  });
}

/**
 * Baut den Embodiment-Memory-Block für den System-Prompt.
 * Leer wenn keine Snippets vorhanden.
 */
export function buildEmbodimentMemoryPrompt(snippets: Snippet[]): string {
  if (snippets.length === 0) return "";
  const lines = snippets.map((s) => `• ${s.text}`);
  return `Organoid weiß aus den letzten Tagen und typischen CT-Mustern:\n${lines.join("\n")}\n\n`;
}


export function snippetToEmbodimentEpisode(params: {
  snippet: Snippet;
  embodimentId: string;
  userId?: string;
  threadId?: string;
}) {
  return {
    id: `snippet:${params.embodimentId}:${params.snippet.createdAt}`,
    embodimentId: params.embodimentId,
    userId: params.userId,
    threadId: params.threadId,
    topicTags: ["snippet_migration"],
    interactionText: "historical embodiment snippet",
    responseText: params.snippet.text,
    qualitySignals: {
      useful: params.snippet.sourceCount > 1,
      accepted: true,
      inEmbodiment: true,
      driftRisk: 0.2,
    },
    createdAt: params.snippet.createdAt,
  };
}
