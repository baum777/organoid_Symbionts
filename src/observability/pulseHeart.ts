import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { ORGANOID_PHASES, type OrganoidMatrixNode } from "../organoid/bootstrap.js";
import { getSigilForGnome } from "../gnomes/sigils.js";
import type { OrganoidPhase } from "../gnomes/types.js";
import { getStateStore } from "../state/storeFactory.js";
import { stableHash } from "../utils/hash.js";
import { setGauge } from "./metrics.js";
import { GAUGE_NAMES } from "./metricTypes.js";

export type PulseSurface = "startup" | "server" | "worker" | "script" | "console" | "render" | "x" | "overlay" | "health";
export type PulseOutcome = "startup" | "publish" | "reply" | "tweet" | "dry_run" | "skip" | "error" | "info";

export interface PulseHeartObservation {
  surface: PulseSurface;
  label?: string;
  text?: string;
  outcome?: PulseOutcome;
  activeOrganoidIds?: string[];
  phaseIndex?: number;
  signalStrength?: number;
  resonance?: number;
  advancePhase?: boolean;
  emitTerminal?: boolean;
  persist?: boolean;
}

export interface PulseHeartState {
  version: 1;
  scope: string;
  surface: PulseSurface;
  phases: readonly OrganoidPhase[];
  matrix: OrganoidMatrixNode[];
  activeOrganoidIds: string[];
  phaseIndex: number;
  signalStrength: number;
  resonance: number;
  drift: number;
  coherence: number;
  pulse: number;
  interactionCount: number;
  updatedAt: string;
  lastInteraction?: PulseHeartObservation;
}

export interface PulseHeartPhaseView {
  index: number;
  name: OrganoidPhase;
  active: boolean;
  intensity: number;
}

export interface PulseHeartOrganoidView extends OrganoidMatrixNode {
  active: boolean;
  emphasis: number;
  angle: number;
}

export interface PulseHeartSnapshot extends PulseHeartState {
  phase: OrganoidPhase;
  phaseViews: PulseHeartPhaseView[];
  activeOrganoids: PulseHeartOrganoidView[];
  summary: string;
  svg: string;
  terminal: string;
  overlayHtml: string;
}

const STATE_KEY = "observability:pulse-heart:snapshot";
const DEFAULT_PHASES = ORGANOID_PHASES;
const PERSIST_TTL_SECONDS = 60 * 60 * 24 * 7;
const MAX_ACTIVE_ORGANOIDS = 7;

let memoryState: PulseHeartState | null = null;
let persistChain: Promise<void> = Promise.resolve();
let originalConsoleMethods: Partial<Record<"log" | "info" | "warn" | "error" | "debug", (...args: unknown[]) => void>> | null = null;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function mix(from: number, to: number, weight: number): number {
  return from + (to - from) * clamp(weight, 0, 1);
}

function norm(value: string): string {
  return value.trim().toLowerCase();
}

function uniq(ids: string[] | undefined): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const id of ids ?? []) {
    const clean = norm(id);
    if (!clean || seen.has(clean)) continue;
    seen.add(clean);
    out.push(clean);
    if (out.length >= MAX_ACTIVE_ORGANOIDS) break;
  }
  return out;
}

function fallbackMatrix(ids: string[]): OrganoidMatrixNode[] {
  const cleaned = uniq(ids);
  if (cleaned.length === 0) cleaned.push("stillhalter");
  return cleaned.map((id, index) => ({
    id,
    legacyId: id,
    embodiment: id,
    glyph: getSigilForGnome(id),
    role: index === 0 ? "primary-observer" : "support-observer",
    archetype: "dry_observer",
    phaseAffinities: [],
  }));
}

function mergeMatrices(seed: OrganoidMatrixNode[], existing: OrganoidMatrixNode[] = []): OrganoidMatrixNode[] {
  const byId = new Map<string, OrganoidMatrixNode>();
  for (const node of seed) byId.set(norm(node.id), { ...node });
  for (const node of existing) {
    const key = norm(node.id);
    const prev = byId.get(key);
    byId.set(key, prev ? { ...prev, ...node } : { ...node });
  }
  return Array.from(byId.values()).slice(0, MAX_ACTIVE_ORGANOIDS);
}

function normalizePhases(phases?: readonly OrganoidPhase[]): readonly OrganoidPhase[] {
  const cleaned = (phases ?? DEFAULT_PHASES).filter((phase, index, arr) => arr.indexOf(phase) === index);
  return cleaned.length > 0 ? cleaned.slice(0, 5) : DEFAULT_PHASES;
}

function defaultState(scope: string, matrix: OrganoidMatrixNode[], phases: readonly OrganoidPhase[]): PulseHeartState {
  const activeOrganoidIds = uniq(matrix.map((node) => node.id));
  return {
    version: 1,
    scope,
    surface: "startup",
    phases,
    matrix,
    activeOrganoidIds: activeOrganoidIds.length > 0 ? activeOrganoidIds : ["stillhalter"],
    phaseIndex: 0,
    signalStrength: 0.56,
    resonance: 0.58,
    drift: 0.02,
    coherence: 0.98,
    pulse: 0.5,
    interactionCount: 0,
    updatedAt: new Date().toISOString(),
    lastInteraction: { surface: "startup", label: "bootstrap", outcome: "startup", advancePhase: false, emitTerminal: false, persist: false },
  };
}

function resolveActiveIds(state: PulseHeartState, observation: PulseHeartObservation): string[] {
  const preferred = uniq(observation.activeOrganoidIds);
  if (preferred.length > 0) return preferred;
  if (state.activeOrganoidIds.length > 0) return state.activeOrganoidIds;
  if (state.matrix.length > 0) return uniq(state.matrix.map((node) => node.id));
  return ["stillhalter"];
}

function hashFraction(input: string): number {
  return parseInt(stableHash(input).slice(0, 8), 16) / 0xffffffff;
}

function surfaceBias(surface: PulseSurface): number {
  return { startup: 0.12, server: 0.18, worker: 0.2, script: 0.1, console: 0.08, render: 0.16, x: 0.25, overlay: 0.14, health: 0.09 }[surface];
}

function outcomeBias(outcome: PulseOutcome | undefined): number {
  return { startup: 0.08, publish: 0.14, reply: 0.14, tweet: 0.14, dry_run: 0.03, skip: -0.08, error: -0.22, info: 0 }[outcome ?? "info"];
}

function deriveTargets(state: PulseHeartState, observation: PulseHeartObservation, activeIds: string[]): { signal: number; resonance: number; phase: number } {
  const text = observation.text?.trim() ?? observation.label ?? "";
  const textFactor = clamp(text.length / 260, 0, 1);
  const activeFactor = clamp(activeIds.length / MAX_ACTIVE_ORGANOIDS, 0, 1);
  const seed = hashFraction(`${observation.surface}|${text}|${activeIds.join(",")}|${observation.outcome ?? ""}|${state.interactionCount}`);
  const signal = clamp(observation.signalStrength ?? (0.18 + textFactor * 0.45 + activeFactor * 0.08 + surfaceBias(observation.surface) + outcomeBias(observation.outcome)), 0, 1);
  const resonance = clamp(observation.resonance ?? (0.2 + seed * 0.42 + activeFactor * 0.16 + surfaceBias(observation.surface) * 0.55 + outcomeBias(observation.outcome) * 0.35), 0, 1);
  const phase = clamp(
    observation.phaseIndex ?? Math.round(((signal * 0.56 + resonance * 0.44) + outcomeBias(observation.outcome) * 0.08) * (state.phases.length - 1)),
    0,
    state.phases.length - 1,
  );
  return { signal, resonance, phase };
}

function applySelfCorrection(state: PulseHeartState, target: { signal: number; resonance: number; phase: number }): PulseHeartState {
  const smoothing = state.interactionCount === 0 ? 0.7 : 0.34;
  const rawSignal = mix(state.signalStrength, target.signal, smoothing);
  const rawResonance = mix(state.resonance, target.resonance, smoothing * 0.92);
  const midpoint = (rawSignal + rawResonance) / 2;
  const tension = Math.abs(rawSignal - rawResonance);
  const correction = clamp(0.1 + tension * 0.52, 0.1, 0.36);
  const signalStrength = clamp(mix(rawSignal, midpoint, correction * 0.76), 0, 1);
  const resonance = clamp(mix(rawResonance, midpoint, correction * 1.05), 0, 1);
  const drift = clamp(Math.abs(signalStrength - resonance), 0, 1);
  const coherence = clamp(1 - drift * 0.88, 0, 1);
  const phaseIndex = clamp(Math.round(mix(state.phaseIndex, target.phase, 0.34 + coherence * 0.16)), 0, state.phases.length - 1);
  const pulse = clamp(0.5 + 0.5 * Math.sin((state.interactionCount + 1) * 0.94 + signalStrength * 3.1 + resonance * 4.3), 0, 1);
  return { ...state, signalStrength, resonance, drift, coherence, phaseIndex, pulse };
}

function buildStateFromObservation(state: PulseHeartState, observation: PulseHeartObservation): PulseHeartState {
  const activeOrganoidIds = resolveActiveIds(state, observation);
  const target = deriveTargets(state, observation, activeOrganoidIds);
  const corrected = applySelfCorrection(state, target);
  return {
    ...corrected,
    surface: observation.surface,
    activeOrganoidIds,
    matrix: mergeMatrices(state.matrix, state.matrix.length > 0 ? state.matrix : fallbackMatrix(activeOrganoidIds)),
    interactionCount: observation.advancePhase === false ? state.interactionCount : state.interactionCount + 1,
    updatedAt: new Date().toISOString(),
    lastInteraction: { ...observation, activeOrganoidIds, advancePhase: observation.advancePhase ?? true, emitTerminal: observation.emitTerminal ?? false, persist: observation.persist ?? true },
  };
}

function buildPhaseViews(state: PulseHeartState): PulseHeartPhaseView[] {
  return state.phases.map((name, index) => {
    const distance = Math.abs(index - state.phaseIndex);
    return { index, name, active: index === state.phaseIndex, intensity: index === state.phaseIndex ? 1 : clamp(0.18 + state.coherence * 0.58 - distance * 0.08, 0.08, 0.78) };
  });
}

function buildActiveOrganoids(state: PulseHeartState): PulseHeartOrganoidView[] {
  const active = new Set(state.activeOrganoidIds.map(norm));
  const matrix = state.matrix.length > 0 ? state.matrix : fallbackMatrix(state.activeOrganoidIds);
  const count = Math.max(matrix.length, 1);
  const start = -Math.PI / 2 + state.pulse * 0.65;
  return matrix.map((node, index) => {
    const angle = start + (index / count) * Math.PI * 2;
    const emphasis = active.has(norm(node.id)) ? 1 : clamp(0.28 + state.resonance * 0.38 + (1 - Math.abs(index - state.phaseIndex) / Math.max(count, 1)) * 0.12, 0.2, 0.8);
    return { ...node, active: active.has(norm(node.id)), emphasis, angle };
  });
}

function pct(value: number): string {
  return `${Math.round(clamp(value, 0, 1) * 100)}%`;
}

function summaryLine(snapshot: Pick<PulseHeartSnapshot, "phase" | "signalStrength" | "resonance" | "drift" | "activeOrganoids" | "surface">): string {
  const active = snapshot.activeOrganoids.filter((node) => node.active).slice(0, 3);
  const activeLabel = active.length > 0 ? active.map((node) => `${node.glyph} ${node.embodiment}`).join(" · ") : "∅";
  return `⟡ Pulse-Heart · ${snapshot.phase} · signal ${pct(snapshot.signalStrength)} · resonance ${pct(snapshot.resonance)} · drift ${pct(snapshot.drift)} · ${activeLabel} · ${snapshot.surface}`;
}

export function digestPulseHeart(snapshot: PulseHeartSnapshot): {
  scope: string;
  surface: PulseSurface;
  phase: OrganoidPhase;
  phaseIndex: number;
  signalStrength: number;
  resonance: number;
  drift: number;
  coherence: number;
  activeOrganoids: Array<{ id: string; glyph: string; embodiment: string; active: boolean }>;
  summary: string;
  interactionCount: number;
  updatedAt: string;
} {
  return {
    scope: snapshot.scope,
    surface: snapshot.surface,
    phase: snapshot.phase,
    phaseIndex: snapshot.phaseIndex,
    signalStrength: snapshot.signalStrength,
    resonance: snapshot.resonance,
    drift: snapshot.drift,
    coherence: snapshot.coherence,
    activeOrganoids: snapshot.activeOrganoids
      .filter((node) => node.active)
      .map((node) => ({ id: node.id, glyph: node.glyph, embodiment: node.embodiment, active: node.active })),
    summary: snapshot.summary,
    interactionCount: snapshot.interactionCount,
    updatedAt: snapshot.updatedAt,
  };
}

function escapeXml(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&apos;");
}

function bars(value: number, width = 12): string {
  const filled = Math.max(0, Math.min(width, Math.round(clamp(value, 0, 1) * width)));
  return `${"█".repeat(filled)}${"░".repeat(width - filled)}`;
}

function shellPath(snapshot: PulseHeartSnapshot, cx: number, cy: number, radius: number, inner = false): string {
  const seed = hashFraction(`${snapshot.summary}|${snapshot.phase}|${inner ? "inner" : "outer"}`);
  const points = inner ? 64 : 90;
  const rotation = snapshot.pulse * Math.PI * 0.38 + seed * Math.PI * 2;
  const waviness = inner
    ? [
        { freq: 3, amp: 0.05 + snapshot.signalStrength * 0.04, phase: seed * 11.1 },
        { freq: 7, amp: 0.03 + snapshot.resonance * 0.04, phase: seed * 7.7 },
        { freq: 11, amp: 0.015 + snapshot.drift * 0.03, phase: seed * 4.2 },
      ]
    : [
        { freq: 3, amp: 0.07 + snapshot.signalStrength * 0.08, phase: seed * 11.1 },
        { freq: 7, amp: 0.04 + snapshot.resonance * 0.08, phase: seed * 7.7 },
        { freq: 11, amp: 0.025 + snapshot.drift * 0.06, phase: seed * 4.2 },
      ];

  return Array.from({ length: points }, (_, i) => {
    const angle = rotation + (i / points) * Math.PI * 2;
    const wobble = waviness.reduce((acc, h) => acc + Math.sin(angle * h.freq + h.phase) * h.amp, 0);
    const asymmetry = Math.sin(angle * 2 + seed * 13) * snapshot.drift * 0.06;
    const radial = radius * (1 + wobble + asymmetry);
    const x = cx + Math.cos(angle) * radial;
    const y = cy + Math.sin(angle) * radial;
    return `${i === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
  }).join(" ") + " Z";
}

export function renderPulseHeartSvg(snapshot: PulseHeartSnapshot): string {
  const palette = [
    { accent: "#6ee7ff", glow: "#a5f3fc", deep: "#082f49" },
    { accent: "#86efac", glow: "#bbf7d0", deep: "#14532d" },
    { accent: "#fbbf24", glow: "#fde68a", deep: "#78350f" },
    { accent: "#f472b6", glow: "#f9a8d4", deep: "#831843" },
    { accent: "#c084fc", glow: "#e9d5ff", deep: "#4c1d95" },
  ][snapshot.phaseIndex % 5]!;
  const orbitRadius = 164 + snapshot.drift * 14;
  const coreRadius = 34 + snapshot.signalStrength * 10 + snapshot.pulse * 5;
  const shellRadius = 122 + snapshot.resonance * 14;
  const nodes = snapshot.activeOrganoids.map((node) => {
    const x = 400 + Math.cos(node.angle) * orbitRadius;
    const y = 196 + Math.sin(node.angle) * orbitRadius;
    const r = node.active ? 18 + node.emphasis * 5 : 12 + node.emphasis * 3;
    return `
      <g transform="translate(${x.toFixed(2)} ${y.toFixed(2)})">
        <circle r="${r.toFixed(2)}" fill="${node.active ? palette.accent : "#0f172a"}" opacity="${node.active ? 0.92 : 0.45}" stroke="${node.active ? palette.glow : "#334155"}" stroke-width="2"/>
        <text text-anchor="middle" dominant-baseline="middle" font-size="${node.active ? 18 : 14}" fill="${node.active ? "#f8fafc" : "#cbd5e1"}">${escapeXml(node.glyph || getSigilForGnome(node.id))}</text>
      </g>`;
  }).join("");
  const phasePills = snapshot.phaseViews.map((phase, index) => {
    const x = 160 + index * 114;
    return `
      <g transform="translate(${x} 418)">
        <rect x="-46" y="-20" width="92" height="40" rx="18" fill="${phase.active ? palette.accent : "#0b1220"}" opacity="${phase.active ? 0.96 : 0.62}" stroke="${phase.active ? palette.glow : "#20304a"}" stroke-width="1.5"/>
        <text text-anchor="middle" y="-2" font-size="11" fill="${phase.active ? "#0b1020" : "#dbeafe"}">${phase.index + 1}/5</text>
        <text text-anchor="middle" y="12" font-size="9" fill="${phase.active ? "#0b1020" : "#94a3b8"}">${escapeXml(phase.name)}</text>
      </g>`;
  }).join("");

  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 520" role="img" aria-label="${escapeXml(snapshot.summary)}">
  <defs>
    <radialGradient id="pulse-bg" cx="50%" cy="45%" r="70%">
      <stop offset="0%" stop-color="#09101d"/>
      <stop offset="58%" stop-color="#050914"/>
      <stop offset="100%" stop-color="#02040a"/>
    </radialGradient>
    <radialGradient id="pulse-core" cx="50%" cy="45%" r="70%">
      <stop offset="0%" stop-color="${palette.glow}" stop-opacity="0.95"/>
      <stop offset="45%" stop-color="${palette.accent}" stop-opacity="0.84"/>
      <stop offset="100%" stop-color="${palette.deep}" stop-opacity="0.12"/>
    </radialGradient>
    <linearGradient id="pulse-shell" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${palette.accent}" stop-opacity="0.8"/>
      <stop offset="55%" stop-color="${palette.glow}" stop-opacity="0.5"/>
      <stop offset="100%" stop-color="${palette.deep}" stop-opacity="0.18"/>
    </linearGradient>
  </defs>
  <rect width="800" height="520" fill="url(#pulse-bg)"/>
  <path d="${shellPath(snapshot, 400, 200, shellRadius)}" fill="url(#pulse-shell)" opacity="0.94"/>
  <path d="${shellPath(snapshot, 400, 200, shellRadius * 0.72, true)}" fill="none" stroke="${palette.glow}" stroke-opacity="0.68" stroke-width="2.5"/>
  <circle cx="400" cy="200" r="${coreRadius.toFixed(2)}" fill="url(#pulse-core)"/>
  <circle cx="400" cy="200" r="${(coreRadius * 0.52).toFixed(2)}" fill="#ffffff" fill-opacity="0.08"/>
  <text x="400" y="176" text-anchor="middle" font-size="14" letter-spacing="2.2" fill="#cbd5e1">PULSE-HEART</text>
  <text x="400" y="204" text-anchor="middle" font-size="26" font-weight="700" fill="#f8fafc">${escapeXml(snapshot.phase)}</text>
  <text x="400" y="228" text-anchor="middle" font-size="13" fill="#dbeafe">${escapeXml(`signal ${pct(snapshot.signalStrength)} · resonance ${pct(snapshot.resonance)} · drift ${pct(snapshot.drift)}`)}</text>
  <text x="400" y="248" text-anchor="middle" font-size="11" fill="#94a3b8">${escapeXml(snapshot.surface)} · ${escapeXml(snapshot.scope)} · pulses ${snapshot.interactionCount}</text>
  <g>${nodes}</g>
  <g>${phasePills}</g>
  <text x="400" y="488" text-anchor="middle" font-size="12" fill="#94a3b8">${escapeXml(snapshot.summary)}</text>
</svg>`.trim();
}

export function renderPulseHeartTerminal(snapshot: PulseHeartSnapshot): string {
  const width = 76;
  const top = `╭─ Pulse-Heart ${"─".repeat(Math.max(0, width - 16))}╮`;
  const bottom = `╰${"─".repeat(width + 2)}╯`;
  const active = snapshot.activeOrganoids.filter((node) => node.active).slice(0, 3);
  const activeLine = active.length > 0 ? active.map((node) => `${node.glyph} ${node.embodiment}`).join(" · ") : "∅";
  const phaseRail = snapshot.phaseViews.map((phase) => `${phase.active ? "◉" : "◌"}${phase.index + 1}`).join("  ");
  const phaseName = `${snapshot.phaseIndex + 1}/5 ${snapshot.phase}`;
  return [
    top,
    `│ active: ${activeLine.padEnd(width - 9)}│`,
    `│ phase : ${phaseName.padEnd(width - 9)}│`,
    `│ flow  : signal ${bars(snapshot.signalStrength)}  resonance ${bars(snapshot.resonance)}│`,
    `│ arc   : drift ${bars(snapshot.drift)}  coherence ${bars(snapshot.coherence)}│`,
    `│ rail  : ${phaseRail.padEnd(width - 9)}│`,
    `│ scope : ${`${snapshot.surface} · ${snapshot.scope} · pulses ${snapshot.interactionCount}`.slice(0, width - 9).padEnd(width - 9)}│`,
    `│ note  : ${snapshot.summary.slice(0, width - 9).padEnd(width - 9)}│`,
    bottom,
  ].join("\n");
}

export function renderPulseHeartOverlayHtml(snapshot: PulseHeartSnapshot): string {
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${escapeXml(snapshot.summary)}</title>
<style>
body{margin:0;font-family:Inter,system-ui;background:#040611;color:#e2e8f0}
.wrap{max-width:1180px;margin:0 auto;padding:24px}
.grid{display:grid;grid-template-columns:1.2fr .8fr;gap:16px}
.panel{background:rgba(9,15,28,.9);border:1px solid rgba(148,163,184,.18);border-radius:20px;padding:16px}
svg{width:100%;height:auto;display:block}
pre{white-space:pre-wrap;word-break:break-word;margin:0;font:12px/1.5 ui-monospace,monospace;color:#dbeafe}
.chips{display:flex;flex-wrap:wrap;gap:8px}
.chip{padding:8px 10px;border-radius:999px;background:#0f172a;color:#94a3b8;border:1px solid rgba(148,163,184,.16)}
.chip.on{background:linear-gradient(135deg,#6ee7ff,#86efac);color:#021018}
@media (max-width:960px){.grid{grid-template-columns:1fr}}
</style></head>
<body><div class="wrap"><div class="grid">
<div class="panel">${snapshot.svg}</div>
<div class="panel"><h1 style="margin:0 0 10px;font-size:2rem">Pulse-Heart</h1>
<div class="chips" id="pulse-rail">${snapshot.phaseViews.map((phase) => `<span class="chip${phase.active ? " on" : ""}">${phase.index + 1} ${escapeXml(phase.name)}</span>`).join("")}</div>
<p id="pulse-stats">${escapeXml(`phase ${snapshot.phaseIndex + 1}/5 · signal ${pct(snapshot.signalStrength)} · resonance ${pct(snapshot.resonance)} · drift ${pct(snapshot.drift)} · coherence ${pct(snapshot.coherence)}`)}</p>
<p id="pulse-active">${escapeXml(snapshot.activeOrganoids.filter((node) => node.active).map((node) => `${node.glyph} ${node.embodiment}`).join(" · ") || "∅")}</p>
<pre id="pulse-terminal">${escapeXml(snapshot.terminal)}</pre>
</div></div></div>
<script>
const sync = async () => {
  try {
    const res = await fetch("/glyph.json", {cache:"no-store"});
    if (!res.ok) return;
    const data = await res.json();
    document.querySelector(".panel").innerHTML = data.svg;
    document.getElementById("pulse-stats").textContent = "phase " + (data.phaseIndex + 1) + "/5 · signal " + Math.round(data.signalStrength * 100) + "% · resonance " + Math.round(data.resonance * 100) + "% · drift " + Math.round(data.drift * 100) + "% · coherence " + Math.round(data.coherence * 100) + "%";
    document.getElementById("pulse-active").textContent = (data.activeOrganoids || []).filter((node) => node.active).map((node) => node.glyph + " " + node.embodiment).join(" · ") || "∅";
    document.getElementById("pulse-terminal").textContent = data.terminal || "";
    document.getElementById("pulse-rail").innerHTML = (data.phaseViews || []).map((phase) => '<span class="chip' + (phase.active ? " on" : "") + '">' + (phase.index + 1) + " " + phase.name + "</span>").join("");
  } catch {}
};
sync(); setInterval(sync, 1200);
</script></body></html>`;
}

function storageFilePath(): string {
  const dataDir = process.env.DATA_DIR ?? (process.env.NODE_ENV === "production" ? "/data" : join(process.cwd(), "data"));
  return join(dataDir, "pulse_heart.json");
}

async function persistToStore(state: PulseHeartState): Promise<void> {
  try {
    const store = getStateStore();
    await store.set(STATE_KEY, JSON.stringify(state), PERSIST_TTL_SECONDS);
  } catch {
    // best-effort only
  }
}

async function persistToFile(state: PulseHeartState): Promise<void> {
  try {
    await mkdir(join(storageFilePath(), ".."), { recursive: true });
    await writeFile(storageFilePath(), JSON.stringify(state, null, 2), "utf8");
  } catch {
    // best-effort only
  }
}

async function persistPulseHeartState(state: PulseHeartState): Promise<void> {
  if (process.env.NODE_ENV === "test") return;
  await Promise.allSettled([persistToStore(state), persistToFile(state)]);
}

async function deletePersistedPulseHeartState(): Promise<void> {
  try {
    const store = getStateStore();
    await store.del(STATE_KEY);
  } catch {
    // ignore
  }
  try {
    await unlink(storageFilePath());
  } catch {
    // ignore
  }
}

async function readPersistedPulseHeartState(): Promise<PulseHeartState | null> {
  try {
    const store = getStateStore();
    const raw = await store.get(STATE_KEY);
    if (raw) return normalizeState(JSON.parse(raw) as Partial<PulseHeartState>);
  } catch {
    // ignore and fall back to file
  }
  try {
    const raw = await readFile(storageFilePath(), "utf8");
    return normalizeState(JSON.parse(raw) as Partial<PulseHeartState>);
  } catch {
    return null;
  }
}

function normalizeState(input: Partial<PulseHeartState> | null | undefined): PulseHeartState {
  const phases = normalizePhases(input?.phases);
  const incomingMatrix = input?.matrix && input.matrix.length > 0 ? input.matrix : fallbackMatrix(input?.activeOrganoidIds ?? []);
  const matrix = mergeMatrices(incomingMatrix, input?.matrix ?? []);
  const activeOrganoidIds = uniq(input?.activeOrganoidIds ?? matrix.map((node) => node.id));
  return {
    version: 1,
    scope: input?.scope ?? "uninitialized",
    surface: input?.surface ?? "startup",
    phases,
    matrix,
    activeOrganoidIds: activeOrganoidIds.length > 0 ? activeOrganoidIds : uniq(matrix.map((node) => node.id)),
    phaseIndex: clamp(input?.phaseIndex ?? 0, 0, phases.length - 1),
    signalStrength: clamp(input?.signalStrength ?? 0.56, 0, 1),
    resonance: clamp(input?.resonance ?? 0.58, 0, 1),
    drift: clamp(input?.drift ?? 0.02, 0, 1),
    coherence: clamp(input?.coherence ?? 0.98, 0, 1),
    pulse: clamp(input?.pulse ?? 0.5, 0, 1),
    interactionCount: input?.interactionCount ?? 0,
    updatedAt: input?.updatedAt ?? new Date().toISOString(),
    lastInteraction: input?.lastInteraction,
  };
}

function hydrateSnapshot(state: PulseHeartState): PulseHeartSnapshot {
  const normalized = normalizeState(state);
  const phaseViews = buildPhaseViews(normalized);
  const activeOrganoids = buildActiveOrganoids(normalized);
  const phase = normalized.phases[normalized.phaseIndex] ?? normalized.phases[0] ?? DEFAULT_PHASES[0] ?? "Identity Dissolution";
  const snapshot: PulseHeartSnapshot = {
    ...normalized,
    phase,
    phaseViews,
    activeOrganoids,
    summary: "",
    svg: "",
    terminal: "",
    overlayHtml: "",
  };
  snapshot.summary = summaryLine(snapshot);
  snapshot.svg = renderPulseHeartSvg(snapshot);
  snapshot.terminal = renderPulseHeartTerminal(snapshot);
  snapshot.overlayHtml = renderPulseHeartOverlayHtml({
    ...snapshot,
    overlayHtml: "",
  });
  return snapshot;
}

function schedulePersist(state: PulseHeartState): void {
  if (process.env.NODE_ENV === "test") return;
  persistChain = persistChain.then(() => persistPulseHeartState(state)).catch(() => undefined);
}

function emitTerminal(snapshot: PulseHeartSnapshot, enabled: boolean): void {
  if (!enabled) return;
  if (!(process.stderr.isTTY || process.env.ORGANOID_PULSE_HEART_TERMINAL === "true")) return;
  process.stderr.write(`${snapshot.terminal}\n`);
}

function summaryFromConsole(method: "log" | "info" | "warn" | "error" | "debug", args: unknown[]): PulseHeartObservation {
  const text = args.map((arg) => {
    if (typeof arg === "string") return arg;
    if (typeof arg === "number" || typeof arg === "boolean" || typeof arg === "bigint") return String(arg);
    if (arg instanceof Error) return `${arg.name}: ${arg.message}`;
    if (arg === null) return "null";
    if (arg === undefined) return "undefined";
    try { return JSON.stringify(arg); } catch { return Object.prototype.toString.call(arg); }
  }).join(" ").slice(0, 320);
  const match = text.match(/^\[([A-Z_]+)\]/);
  const tag = match?.[1];
  const persist = method !== "log" || ["POSTED", "DRY_RUN", "SKIP", "ERROR", "POLL", "STATE", "AUTH", "LAUNCH_GATE", "COMPLIANCE", "NEW", "SAVED", "START"].includes(tag ?? "");
  const outcome: PulseOutcome | undefined =
    tag === "POSTED" ? "publish" :
    tag === "DRY_RUN" ? "dry_run" :
    tag === "SKIP" ? "skip" :
    tag === "ERROR" ? "error" :
    undefined;
  return {
    surface: "console",
    label: method,
    text,
    outcome,
    advancePhase: false,
    emitTerminal: false,
    persist,
  };
}

export function getPulseHeartSnapshot(): PulseHeartSnapshot {
  return hydrateSnapshot(memoryState ?? defaultState("uninitialized", fallbackMatrix([]), DEFAULT_PHASES));
}

export async function loadPulseHeartSnapshot(): Promise<PulseHeartSnapshot> {
  const persisted = await readPersistedPulseHeartState();
  if (persisted) memoryState = persisted;
  return getPulseHeartSnapshot();
}

export async function bootstrapPulseHeart(params: {
  scope: string;
  matrix: OrganoidMatrixNode[];
  phases?: readonly OrganoidPhase[];
  activeOrganoidIds?: string[];
  emitTerminal?: boolean;
}): Promise<PulseHeartSnapshot> {
  const existing = await readPersistedPulseHeartState();
  const phases = normalizePhases(params.phases ?? existing?.phases ?? DEFAULT_PHASES);
  const matrix = mergeMatrices(params.matrix, existing?.matrix ?? []);
  const seed = defaultState(params.scope, matrix, phases);
  const state: PulseHeartState = {
    ...seed,
    scope: existing?.scope ?? params.scope,
    surface: existing?.surface ?? "startup",
    matrix,
    phases,
    activeOrganoidIds: uniq(params.activeOrganoidIds ?? existing?.activeOrganoidIds ?? seed.activeOrganoidIds),
    phaseIndex: existing ? clamp(existing.phaseIndex, 0, phases.length - 1) : seed.phaseIndex,
    signalStrength: existing?.signalStrength ?? seed.signalStrength,
    resonance: existing?.resonance ?? seed.resonance,
    drift: existing?.drift ?? seed.drift,
    coherence: existing?.coherence ?? seed.coherence,
    pulse: existing?.pulse ?? seed.pulse,
    interactionCount: existing?.interactionCount ?? seed.interactionCount,
    updatedAt: existing?.updatedAt ?? seed.updatedAt,
    lastInteraction: existing?.lastInteraction ?? seed.lastInteraction,
  };
  memoryState = state;
  const snapshot = hydrateSnapshot(state);
  await persistPulseHeartState(state);
  emitTerminal(snapshot, params.emitTerminal ?? true);
  setGauge(GAUGE_NAMES.PULSE_HEART_SIGNAL, snapshot.signalStrength);
  setGauge(GAUGE_NAMES.PULSE_HEART_RESONANCE, snapshot.resonance);
  setGauge(GAUGE_NAMES.PULSE_HEART_DRIFT, snapshot.drift);
  setGauge(GAUGE_NAMES.PULSE_HEART_COHERENCE, snapshot.coherence);
  setGauge(GAUGE_NAMES.PULSE_HEART_PHASE_INDEX, snapshot.phaseIndex);
  return snapshot;
}

export function observePulseHeart(observation: PulseHeartObservation): PulseHeartSnapshot {
  const base = memoryState ?? defaultState("uninitialized", fallbackMatrix([]), DEFAULT_PHASES);
  const next = buildStateFromObservation(base, observation);
  memoryState = next;
  const snapshot = hydrateSnapshot(next);
  if (observation.persist ?? true) schedulePersist(next);
  emitTerminal(snapshot, observation.emitTerminal ?? false);
  setGauge(GAUGE_NAMES.PULSE_HEART_SIGNAL, snapshot.signalStrength);
  setGauge(GAUGE_NAMES.PULSE_HEART_RESONANCE, snapshot.resonance);
  setGauge(GAUGE_NAMES.PULSE_HEART_DRIFT, snapshot.drift);
  setGauge(GAUGE_NAMES.PULSE_HEART_COHERENCE, snapshot.coherence);
  setGauge(GAUGE_NAMES.PULSE_HEART_PHASE_INDEX, snapshot.phaseIndex);
  return snapshot;
}

export async function resetPulseHeartState(): Promise<void> {
  memoryState = null;
  persistChain = Promise.resolve();
  await deletePersistedPulseHeartState();
  setGauge(GAUGE_NAMES.PULSE_HEART_SIGNAL, 0);
  setGauge(GAUGE_NAMES.PULSE_HEART_RESONANCE, 0);
  setGauge(GAUGE_NAMES.PULSE_HEART_DRIFT, 0);
  setGauge(GAUGE_NAMES.PULSE_HEART_COHERENCE, 0);
  setGauge(GAUGE_NAMES.PULSE_HEART_PHASE_INDEX, 0);
}

export function installPulseHeartConsoleTap(): void {
  if (process.env.NODE_ENV === "test" || process.env.ORGANOID_PULSE_HEART_CONSOLE_TAP === "false" || originalConsoleMethods) return;
  originalConsoleMethods = {
    log: console.log.bind(console),
    info: console.info.bind(console),
    warn: console.warn.bind(console),
    error: console.error.bind(console),
    debug: console.debug.bind(console),
  };
  const wrap = (method: "log" | "info" | "warn" | "error" | "debug") => (...args: unknown[]) => {
    try {
      observePulseHeart(summaryFromConsole(method, args));
    } catch {
      // ignore
    }
    originalConsoleMethods?.[method]?.(...args);
  };
  console.log = wrap("log");
  console.info = wrap("info");
  console.warn = wrap("warn");
  console.error = wrap("error");
  console.debug = wrap("debug");
}

export function restorePulseHeartConsoleTap(): void {
  if (!originalConsoleMethods) return;
  console.log = originalConsoleMethods.log ?? console.log;
  console.info = originalConsoleMethods.info ?? console.info;
  console.warn = originalConsoleMethods.warn ?? console.warn;
  console.error = originalConsoleMethods.error ?? console.error;
  console.debug = originalConsoleMethods.debug ?? console.debug;
  originalConsoleMethods = null;
}
