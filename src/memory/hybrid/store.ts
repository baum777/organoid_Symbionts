import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import type {
  ConsolidationJob,
  ConsolidationStatus,
  Episode,
  MemoryAtom,
  MemoryAtomStatus,
  OrganoidProjection,
  Partner,
  PartnerSnapshot,
  RevisionEvent,
} from "./types.js";

export interface HybridListOptions {
  limit?: number;
}

export interface AtomListOptions extends HybridListOptions {
  statuses?: MemoryAtomStatus[];
}

export interface ProjectionListOptions extends HybridListOptions {}

export interface RevisionEventListOptions extends HybridListOptions {}

export interface ConsolidationJobListOptions extends HybridListOptions {
  partnerId?: string;
  status?: ConsolidationStatus;
}

export interface HybridStore {
  upsertPartner(partner: Partner): Promise<void>;
  getPartnerById(partnerId: string): Promise<Partner | null>;

  putEpisode(episode: Episode): Promise<void>;
  getEpisodeById(episodeId: string): Promise<Episode | null>;
  listEpisodesForPartner(partnerId: string, options?: HybridListOptions): Promise<Episode[]>;

  putAtom(atom: MemoryAtom): Promise<void>;
  getAtomById(atomId: string): Promise<MemoryAtom | null>;
  listAtomsForPartner(partnerId: string, options?: AtomListOptions): Promise<MemoryAtom[]>;

  putSnapshot(snapshot: PartnerSnapshot): Promise<void>;
  getLatestSnapshotForPartner(partnerId: string): Promise<PartnerSnapshot | null>;

  putProjection(projection: OrganoidProjection): Promise<void>;
  getProjectionForPartner(partnerId: string, organoidId: string): Promise<OrganoidProjection | null>;
  listProjectionsForPartner(partnerId: string, options?: ProjectionListOptions): Promise<OrganoidProjection[]>;

  appendRevisionEvent(event: RevisionEvent): Promise<void>;
  listRevisionEventsForPartner(partnerId: string, options?: RevisionEventListOptions): Promise<RevisionEvent[]>;

  putConsolidationJob(job: ConsolidationJob): Promise<void>;
  getConsolidationJob(jobId: string): Promise<ConsolidationJob | null>;
  listConsolidationJobs(options?: ConsolidationJobListOptions): Promise<ConsolidationJob[]>;
}

interface HybridStoreState {
  partners: Partner[];
  episodes: Episode[];
  atoms: MemoryAtom[];
  snapshots: PartnerSnapshot[];
  projections: OrganoidProjection[];
  revisionEvents: RevisionEvent[];
  consolidationJobs: ConsolidationJob[];
}

const DEFAULT_LIMIT = 20;

function emptyState(): HybridStoreState {
  return {
    partners: [],
    episodes: [],
    atoms: [],
    snapshots: [],
    projections: [],
    revisionEvents: [],
    consolidationJobs: [],
  };
}

function clone<T>(value: T): T {
  return structuredClone(value);
}

function clampLimit(limit: number | undefined, fallback = DEFAULT_LIMIT): number {
  if (!limit || Number.isNaN(limit) || limit <= 0) return fallback;
  return Math.min(limit, 100);
}

function sortByTimestampDesc<T>(items: T[], getTimestamp: (item: T) => string, getId: (item: T) => string): T[] {
  return [...items].sort((a, b) => {
    const tsDiff = new Date(getTimestamp(b)).getTime() - new Date(getTimestamp(a)).getTime();
    if (tsDiff !== 0) return tsDiff;
    return getId(a).localeCompare(getId(b));
  });
}

function latestByTimestamp<T>(items: T[], getTimestamp: (item: T) => string, getId: (item: T) => string): T | null {
  return sortByTimestampDesc(items, getTimestamp, getId)[0] ?? null;
}

abstract class BaseHybridStore implements HybridStore {
  protected state: HybridStoreState = emptyState();

  async upsertPartner(partner: Partner): Promise<void> {
    const next = clone(partner);
    const index = this.state.partners.findIndex((item) => item.partner_id === next.partner_id);
    if (index >= 0) this.state.partners[index] = next;
    else this.state.partners.push(next);
  }

  async getPartnerById(partnerId: string): Promise<Partner | null> {
    return clone(this.state.partners.find((item) => item.partner_id === partnerId) ?? null);
  }

  async putEpisode(episode: Episode): Promise<void> {
    const next = clone(episode);
    const index = this.state.episodes.findIndex((item) => item.episode_id === next.episode_id);
    if (index >= 0) this.state.episodes[index] = next;
    else this.state.episodes.push(next);
  }

  async getEpisodeById(episodeId: string): Promise<Episode | null> {
    return clone(this.state.episodes.find((item) => item.episode_id === episodeId) ?? null);
  }

  async listEpisodesForPartner(partnerId: string, options?: HybridListOptions): Promise<Episode[]> {
    const limit = clampLimit(options?.limit);
    return sortByTimestampDesc(
      this.state.episodes.filter((episode) => episode.partner_id === partnerId),
      (episode) => episode.timestamp,
      (episode) => episode.episode_id,
    )
      .slice(0, limit)
      .map(clone);
  }

  async putAtom(atom: MemoryAtom): Promise<void> {
    const next = clone(atom);
    const index = this.state.atoms.findIndex((item) => item.atom_id === next.atom_id);
    if (index >= 0) this.state.atoms[index] = next;
    else this.state.atoms.push(next);
  }

  async getAtomById(atomId: string): Promise<MemoryAtom | null> {
    return clone(this.state.atoms.find((item) => item.atom_id === atomId) ?? null);
  }

  async listAtomsForPartner(partnerId: string, options?: AtomListOptions): Promise<MemoryAtom[]> {
    const limit = clampLimit(options?.limit);
    return sortByTimestampDesc(
      this.state.atoms.filter((atom) => {
        if (atom.partner_id !== partnerId) return false;
        if (options?.statuses?.length && !options.statuses.includes(atom.status)) return false;
        return true;
      }),
      (atom) => atom.last_confirmed_at ?? atom.first_observed_at,
      (atom) => atom.atom_id,
    )
      .slice(0, limit)
      .map(clone);
  }

  async putSnapshot(snapshot: PartnerSnapshot): Promise<void> {
    this.state.snapshots.push(clone(snapshot));
  }

  async getLatestSnapshotForPartner(partnerId: string): Promise<PartnerSnapshot | null> {
    return clone(
      latestByTimestamp(
        this.state.snapshots.filter((snapshot) => snapshot.partner_id === partnerId),
        (snapshot) => snapshot.generated_at,
        (snapshot) => snapshot.snapshot_id,
      ),
    );
  }

  async putProjection(projection: OrganoidProjection): Promise<void> {
    const next = clone(projection);
    const index = this.state.projections.findIndex(
      (item) => item.projection_id === next.projection_id || (item.partner_id === next.partner_id && item.organoid_id === next.organoid_id),
    );
    if (index >= 0) this.state.projections[index] = next;
    else this.state.projections.push(next);
  }

  async getProjectionForPartner(partnerId: string, organoidId: string): Promise<OrganoidProjection | null> {
    return clone(
      latestByTimestamp(
        this.state.projections.filter((projection) => projection.partner_id === partnerId && projection.organoid_id === organoidId),
        (projection) => projection.generated_at,
        (projection) => projection.projection_id,
      ),
    );
  }

  async listProjectionsForPartner(partnerId: string, options?: ProjectionListOptions): Promise<OrganoidProjection[]> {
    const limit = clampLimit(options?.limit);
    return sortByTimestampDesc(
      this.state.projections.filter((projection) => projection.partner_id === partnerId),
      (projection) => projection.generated_at,
      (projection) => projection.projection_id,
    )
      .slice(0, limit)
      .map(clone);
  }

  async appendRevisionEvent(event: RevisionEvent): Promise<void> {
    const next = clone(event);
    const index = this.state.revisionEvents.findIndex((item) => item.revision_event_id === next.revision_event_id);
    if (index >= 0) this.state.revisionEvents[index] = next;
    else this.state.revisionEvents.push(next);
  }

  async listRevisionEventsForPartner(partnerId: string, options?: RevisionEventListOptions): Promise<RevisionEvent[]> {
    const limit = clampLimit(options?.limit);
    return sortByTimestampDesc(
      this.state.revisionEvents.filter((event) => event.partner_id === partnerId),
      (event) => event.created_at,
      (event) => event.revision_event_id,
    )
      .slice(0, limit)
      .map(clone);
  }

  async putConsolidationJob(job: ConsolidationJob): Promise<void> {
    const next = clone(job);
    const index = this.state.consolidationJobs.findIndex((item) => item.job_id === next.job_id);
    if (index >= 0) this.state.consolidationJobs[index] = next;
    else this.state.consolidationJobs.push(next);
  }

  async getConsolidationJob(jobId: string): Promise<ConsolidationJob | null> {
    return clone(this.state.consolidationJobs.find((item) => item.job_id === jobId) ?? null);
  }

  async listConsolidationJobs(options?: ConsolidationJobListOptions): Promise<ConsolidationJob[]> {
    const limit = clampLimit(options?.limit);
    return sortByTimestampDesc(
      this.state.consolidationJobs.filter((job) => {
        if (options?.partnerId && job.partner_id !== options.partnerId) return false;
        if (options?.status && job.status !== options.status) return false;
        return true;
      }),
      (job) => job.requested_at,
      (job) => job.job_id,
    )
      .slice(0, limit)
      .map(clone);
  }
}

export class InMemoryHybridStore extends BaseHybridStore {}

export interface FileHybridStoreOptions {
  filePath: string;
}

export class FileHybridStore extends BaseHybridStore {
  private loaded = false;

  constructor(private readonly filePath: string) {
    super();
  }

  private async ensureLoaded(): Promise<void> {
    if (this.loaded) return;
    this.state = await this.readState();
    this.loaded = true;
  }

  private async readState(): Promise<HybridStoreState> {
    try {
      const raw = await readFile(this.filePath, "utf8");
      const parsed = JSON.parse(raw) as Partial<HybridStoreState>;
      return {
        partners: Array.isArray(parsed.partners) ? parsed.partners : [],
        episodes: Array.isArray(parsed.episodes) ? parsed.episodes : [],
        atoms: Array.isArray(parsed.atoms) ? parsed.atoms : [],
        snapshots: Array.isArray(parsed.snapshots) ? parsed.snapshots : [],
        projections: Array.isArray(parsed.projections) ? parsed.projections : [],
        revisionEvents: Array.isArray(parsed.revisionEvents) ? parsed.revisionEvents : [],
        consolidationJobs: Array.isArray(parsed.consolidationJobs) ? parsed.consolidationJobs : [],
      };
    } catch {
      return emptyState();
    }
  }

  private async persist(): Promise<void> {
    await mkdir(dirname(this.filePath), { recursive: true });
    await writeFile(this.filePath, JSON.stringify(this.state, null, 2), "utf8");
  }

  private async read<T>(fn: () => Promise<T>): Promise<T> {
    await this.ensureLoaded();
    return fn();
  }

  private async write<T>(fn: () => Promise<T>): Promise<T> {
    await this.ensureLoaded();
    const result = await fn();
    await this.persist();
    return result;
  }

  async upsertPartner(partner: Partner): Promise<void> {
    return this.write(() => super.upsertPartner(partner));
  }

  async getPartnerById(partnerId: string): Promise<Partner | null> {
    return this.read(() => super.getPartnerById(partnerId));
  }

  async putEpisode(episode: Episode): Promise<void> {
    return this.write(() => super.putEpisode(episode));
  }

  async getEpisodeById(episodeId: string): Promise<Episode | null> {
    return this.read(() => super.getEpisodeById(episodeId));
  }

  async listEpisodesForPartner(partnerId: string, options?: HybridListOptions): Promise<Episode[]> {
    return this.read(() => super.listEpisodesForPartner(partnerId, options));
  }

  async putAtom(atom: MemoryAtom): Promise<void> {
    return this.write(() => super.putAtom(atom));
  }

  async getAtomById(atomId: string): Promise<MemoryAtom | null> {
    return this.read(() => super.getAtomById(atomId));
  }

  async listAtomsForPartner(partnerId: string, options?: AtomListOptions): Promise<MemoryAtom[]> {
    return this.read(() => super.listAtomsForPartner(partnerId, options));
  }

  async putSnapshot(snapshot: PartnerSnapshot): Promise<void> {
    return this.write(() => super.putSnapshot(snapshot));
  }

  async getLatestSnapshotForPartner(partnerId: string): Promise<PartnerSnapshot | null> {
    return this.read(() => super.getLatestSnapshotForPartner(partnerId));
  }

  async putProjection(projection: OrganoidProjection): Promise<void> {
    return this.write(() => super.putProjection(projection));
  }

  async getProjectionForPartner(partnerId: string, organoidId: string): Promise<OrganoidProjection | null> {
    return this.read(() => super.getProjectionForPartner(partnerId, organoidId));
  }

  async listProjectionsForPartner(partnerId: string, options?: ProjectionListOptions): Promise<OrganoidProjection[]> {
    return this.read(() => super.listProjectionsForPartner(partnerId, options));
  }

  async appendRevisionEvent(event: RevisionEvent): Promise<void> {
    return this.write(() => super.appendRevisionEvent(event));
  }

  async listRevisionEventsForPartner(partnerId: string, options?: RevisionEventListOptions): Promise<RevisionEvent[]> {
    return this.read(() => super.listRevisionEventsForPartner(partnerId, options));
  }

  async putConsolidationJob(job: ConsolidationJob): Promise<void> {
    return this.write(() => super.putConsolidationJob(job));
  }

  async getConsolidationJob(jobId: string): Promise<ConsolidationJob | null> {
    return this.read(() => super.getConsolidationJob(jobId));
  }

  async listConsolidationJobs(options?: ConsolidationJobListOptions): Promise<ConsolidationJob[]> {
    return this.read(() => super.listConsolidationJobs(options));
  }
}

export function createHybridStore(options?: { filePath?: string }): HybridStore {
  return options?.filePath ? new FileHybridStore(options.filePath) : new InMemoryHybridStore();
}
