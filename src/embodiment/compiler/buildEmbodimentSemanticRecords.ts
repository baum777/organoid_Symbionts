import { createHash } from "node:crypto";
import type { EmbodimentProfile } from "../../embodiments/types.js";
import type { EmbodimentSemanticRecord } from "../types.js";

export interface BuildSemanticRecordsOptions {
  version?: string;
  loreByEmbodiment?: Record<string, string[]>;
}

const RELATION_LABELS: Record<string, string> = {
  complements: "complements",
  suppresses: "suppresses",
  escalates_with: "escalates with",
  stabilizes_with: "stabilizes with",
};

function makeRecordId(embodimentId: string, docType: string, text: string, version: string): string {
  const digest = createHash("sha256").update(`${embodimentId}|${docType}|${version}|${text}`).digest("hex").slice(0, 16);
  return `${embodimentId}:${docType}:${digest}`;
}

function compact(parts: Array<string | undefined>): string {
  return parts.filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
}

export function buildSemanticRecordsFromProfiles(
  profiles: EmbodimentProfile[],
  opts?: BuildSemanticRecordsOptions,
): EmbodimentSemanticRecord[] {
  const version = opts?.version ?? "v1";
  const loreByEmbodiment = opts?.loreByEmbodiment ?? {};
  const records: EmbodimentSemanticRecord[] = [];

  for (const profile of profiles) {
    const intents = profile.routing_hints?.preferred_intents ?? [];
    const energy = profile.routing_hints?.preferred_energy?.[0] as "low" | "mid" | "high" | undefined;
    const loreTags = profile.memory_rules?.default_lore_tags ?? [];

    const coreText = compact([
      `${profile.name} is a ${profile.role} embodiment with archetype ${profile.archetype}.`,
      profile.embodiment_traits?.tone ? `Tone: ${profile.embodiment_traits.tone}.` : undefined,
      profile.semantic_facets?.length ? `Semantic facets: ${profile.semantic_facets.join(", ")}.` : undefined,
      profile.style_anchors?.length ? `Style anchors: ${profile.style_anchors.join(" | ")}.` : undefined,
    ]);

    const coreRecord: EmbodimentSemanticRecord = {
      id: makeRecordId(profile.id, "embodiment_core", coreText, version),
      embodimentId: profile.id,
      namespace: "embodiments-core",
      docType: "embodiment_core",
      text: coreText,
      metadata: {
        role: profile.role,
        archetype: profile.archetype,
        loreTags,
        intents,
        energy,
        safetyCritical: true,
        sourceType: "yaml",
        active: true,
        version,
        retrievalPriority: profile.retrieval_priority,
        derivedFrom: `data/embodiments/${profile.id}.yaml`,
      },
    };
    records.push(coreRecord);

    for (const anchor of profile.style_anchors ?? []) {
      records.push({
        id: makeRecordId(profile.id, "embodiment_style_anchor", anchor, version),
        embodimentId: profile.id,
        namespace: "embodiments-style",
        docType: "embodiment_style_anchor",
        text: `${profile.name} style anchor: ${anchor}`,
        metadata: {
          role: profile.role,
          archetype: profile.archetype,
          loreTags,
          intents,
          energy,
          sourceType: "yaml",
          active: true,
          version,
          retrievalPriority: profile.retrieval_priority,
        },
      });
    }

    const activation = compact([
      `${profile.name} activates for intents: ${intents.join(", ") || "general discourse"}.`,
      profile.semantic_facets?.length ? `Prioritize when semantic facets match: ${profile.semantic_facets.join(", ")}.` : undefined,
      profile.routing_hints?.aggression_range
        ? `Best fit when aggression is within ${profile.routing_hints.aggression_range[0]}-${profile.routing_hints.aggression_range[1]}.`
        : undefined,
    ]);
    records.push({
      id: makeRecordId(profile.id, "embodiment_activation_rule", activation, version),
      embodimentId: profile.id,
      namespace: "embodiments-core",
      docType: "embodiment_activation_rule",
      text: activation,
      metadata: {
        role: profile.role,
        archetype: profile.archetype,
        loreTags,
        intents,
        energy,
        sourceType: "yaml",
        active: true,
        version,
      },
    });

    for (const boundary of [...(profile.negative_anchors ?? []), ...(profile.safety_boundaries ?? [])]) {
      records.push({
        id: makeRecordId(profile.id, "embodiment_negative_boundary", boundary, version),
        embodimentId: profile.id,
        namespace: "embodiments-style",
        docType: "embodiment_negative_boundary",
        text: `${profile.name} boundary: ${boundary}`,
        metadata: {
          role: profile.role,
          archetype: profile.archetype,
          loreTags,
          intents,
          energy,
          safetyCritical: true,
          sourceType: "yaml",
          active: true,
          version,
        },
      });
    }

    for (const example of profile.canonical_examples ?? []) {
      records.push({
        id: makeRecordId(profile.id, "embodiment_example", example, version),
        embodimentId: profile.id,
        namespace: "embodiments-examples",
        docType: "embodiment_example",
        text: example,
        metadata: {
          role: profile.role,
          archetype: profile.archetype,
          loreTags,
          intents,
          energy,
          sourceType: "example",
          exampleQuality: "gold",
          active: true,
          version,
        },
      });
    }

    const relationHints = profile.relation_hints ?? {};
    for (const key of Object.keys(RELATION_LABELS) as Array<keyof typeof relationHints>) {
      for (const target of relationHints[key] ?? []) {
        const text = `${profile.name} ${RELATION_LABELS[key]} ${target} in multi-embodiment mode.`;
        records.push({
          id: makeRecordId(profile.id, "embodiment_relation", `${key}:${target}`, version),
          embodimentId: profile.id,
          namespace: "embodiments-relations",
          docType: "embodiment_relation",
          text,
          metadata: {
            role: profile.role,
            archetype: profile.archetype,
            loreTags,
            intents,
            energy,
            relationTarget: target,
            relationType: key as "complements" | "suppresses" | "escalates_with" | "stabilizes_with",
            sourceType: "yaml",
            active: true,
            version,
          },
        });
      }
    }

    for (const loreChunk of loreByEmbodiment[profile.id] ?? []) {
      records.push({
        id: makeRecordId(profile.id, "lore_chunk", loreChunk, version),
        embodimentId: profile.id,
        namespace: "lore-active",
        docType: "lore_chunk",
        text: loreChunk,
        metadata: {
          role: profile.role,
          archetype: profile.archetype,
          loreTags,
          sourceType: "lore",
          active: true,
          version,
        },
      });
    }
  }

  return records.sort((a, b) => a.id.localeCompare(b.id));
}
