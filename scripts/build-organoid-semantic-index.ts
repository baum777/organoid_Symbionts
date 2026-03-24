import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import yaml from "js-yaml";
import type { EmbodimentProfile } from "../src/embodiments/types.js";
import { isEmbodimentProfile } from "../src/embodiments/types.js";
import { buildSemanticRecordsFromProfiles } from "../src/embodiment/compiler/buildSemanticRecords.js";

async function loadProfiles(): Promise<EmbodimentProfile[]> {
  const dir = join(process.cwd(), "data", "embodiments");
  const files = (await readdir(dir)).filter((f) => f.endsWith(".yaml") || f.endsWith(".yml")).sort();
  const profiles: EmbodimentProfile[] = [];

  for (const file of files) {
    const parsed = yaml.load(await readFile(join(dir, file), "utf8"));
    if (!isEmbodimentProfile(parsed)) throw new Error(`Invalid embodiment profile: ${file}`);
    profiles.push(parsed);
  }
  return profiles;
}

async function loadLoreByEmbodiment(embodimentIds: string[]): Promise<Record<string, string[]>> {
  const lorePath = join(process.cwd(), "docs", "lore", "LORE.md");
  let content = "";
  try {
    content = await readFile(lorePath, "utf8");
  } catch {
    return {};
  }

  const sentences = content.split(/\n+/).map((l) => l.trim()).filter((l) => l.length > 20);
  const byEmbodiment: Record<string, string[]> = {};
  for (const embodimentId of embodimentIds) {
    byEmbodiment[embodimentId] = sentences.filter((line) => line.toLowerCase().includes(embodimentId.slice(0, 6))).slice(0, 3);
  }
  return byEmbodiment;
}

async function main(): Promise<void> {
  const version = process.env.EMBODIMENT_SEMANTIC_VERSION ?? "v1";
  const splitByEmbodiment = process.argv.includes("--split");
  const profiles = await loadProfiles();
  const loreByEmbodiment = await loadLoreByEmbodiment(profiles.map((p) => p.id));
  const records = buildSemanticRecordsFromProfiles(profiles, { version, loreByEmbodiment });

  const outDir = join(process.cwd(), "artifacts");
  await mkdir(outDir, { recursive: true });
  const outFile = join(outDir, "embodiment-semantic-records.json");
  await writeFile(outFile, JSON.stringify(records, null, 2), "utf8");

  if (splitByEmbodiment) {
    const grouped = records.reduce<Record<string, typeof records>>((acc, rec) => {
      acc[rec.embodimentId] ??= [];
      acc[rec.embodimentId].push(rec);
      return acc;
    }, {});

    for (const [embodimentId, embodimentRecords] of Object.entries(grouped)) {
      await writeFile(join(outDir, `embodiment-semantic-records.${embodimentId}.json`), JSON.stringify(embodimentRecords, null, 2), "utf8");
    }
  }

  console.log(`[embodiment] wrote ${records.length} records to ${outFile}`);
}

main().catch((err) => {
  console.error("[embodiment] build failed", err);
  process.exit(1);
});
