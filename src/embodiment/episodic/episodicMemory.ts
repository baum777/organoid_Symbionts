import type { EmbodimentEpisode, EmbodimentReflection } from "../memoryTypes.js";

export class EpisodicMemoryStore {
  private readonly episodes: EmbodimentEpisode[] = [];
  private readonly reflections: EmbodimentReflection[] = [];

  addEpisode(episode: EmbodimentEpisode): void {
    this.episodes.push(episode);
  }

  addReflection(reflection: EmbodimentReflection): void {
    this.reflections.push(reflection);
  }

  getEpisodesByEmbodiment(embodimentId: string): EmbodimentEpisode[] {
    return this.episodes.filter((e) => e.embodimentId === embodimentId);
  }

  getRetainedEpisodes(embodimentId: string): EmbodimentEpisode[] {
    const retainedIds = new Set(
      this.reflections
        .filter((r) => r.embodimentId === embodimentId && r.retentionDecision === "retain")
        .map((r) => r.episodeId),
    );
    return this.episodes.filter((e) => retainedIds.has(e.id));
  }
}
