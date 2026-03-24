import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import type { EmbodimentSemanticStore, EmbodimentSemanticQuery } from "../memoryTypes.js";
import type { EmbodimentSemanticRecord } from "../types.js";
import { InMemoryEmbodimentSemanticStore } from "./inMemoryEmbodimentSemanticStore.js";

export class FileEmbodimentSemanticStore implements EmbodimentSemanticStore {
  constructor(private readonly filePath: string) {}

  private async loadRecords(): Promise<EmbodimentSemanticRecord[]> {
    try {
      const raw = await readFile(this.filePath, "utf8");
      const parsed = JSON.parse(raw) as EmbodimentSemanticRecord[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private async saveRecords(records: EmbodimentSemanticRecord[]): Promise<void> {
    await mkdir(dirname(this.filePath), { recursive: true });
    await writeFile(this.filePath, JSON.stringify(records, null, 2), "utf8");
  }

  async upsert(records: EmbodimentSemanticRecord[]): Promise<void> {
    const existing = await this.loadRecords();
    const map = new Map(existing.map((r) => [r.id, r]));
    for (const r of records) map.set(r.id, r);
    await this.saveRecords(Array.from(map.values()));
  }

  async query(args: EmbodimentSemanticQuery): Promise<EmbodimentSemanticRecord[]> {
    const mem = new InMemoryEmbodimentSemanticStore();
    await mem.upsert(await this.loadRecords());
    return mem.query(args);
  }
}
