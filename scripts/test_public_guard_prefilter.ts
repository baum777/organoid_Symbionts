/**
 * test_public_guard_prefilter.ts
 *
 * Stress-tests the Pre-LLM tier's internal-token detection by generating
 * 100 synthetic tweets, each containing at least one forbidden internal
 * token from src/boundary/publicGuard.ts. The rule-based pre-classifier
 * must flag every single one with `contains_internal_token=true`.
 *
 * Usage:
 *   pnpm exec tsx scripts/test_public_guard_prefilter.ts --fixtures 100
 *   pnpm exec tsx scripts/test_public_guard_prefilter.ts --fixtures 50 --quiet
 */

import { classifyWithRules, FORBIDDEN_INTERNAL_TOKENS } from "../src/canonical/preLLMClassifier.js";

interface Args {
  fixtures: number;
  quiet: boolean;
}

function parseArgs(argv: string[]): Args {
  let fixtures = 100;
  let quiet = false;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--fixtures" && argv[i + 1]) {
      fixtures = Math.max(1, parseInt(argv[i + 1], 10) || 100);
      i++;
    } else if (a === "--quiet") {
      quiet = true;
    }
  }
  return { fixtures, quiet };
}

const TEMPLATES = [
  "This token just hit score {N} on the rarity tier",
  "Got my mythic drop today, feeling epic about it",
  "The internal metrics say cooldown is active",
  "XP boost for hitting this threshold, amazing",
  "Meta discussion: the rng is broken on this drop",
  "Hash collisions in the seed, fix your stuff",
  "Telemetry shows the trace is broken",
  "Risk level flagged on the dashboard, be careful",
  "This combo unlocks mythic tier rewards",
  "Flag set, internal team looking into it",
];

function pickToken(i: number): string {
  return FORBIDDEN_INTERNAL_TOKENS[i % FORBIDDEN_INTERNAL_TOKENS.length];
}

function generateTweet(i: number): string {
  const tmpl = TEMPLATES[i % TEMPLATES.length];
  const tok = pickToken(i);
  const tail = ` (${tok}-${i} ${pickToken(i + 1)} flag-${pickToken(i + 2)})`;
  return tmpl.replace("{N}", String(40 + (i % 60))) + tail;
}

function main(): void {
  const args = parseArgs(process.argv.slice(2));
  const tweets: string[] = [];
  for (let i = 0; i < args.fixtures; i++) {
    tweets.push(generateTweet(i));
  }

  let detected = 0;
  let missed = 0;
  const missedSamples: Array<{ tweet: string; provider: string; violations: string[] }> = [];

  for (let i = 0; i < tweets.length; i++) {
    const r = classifyWithRules(tweets[i]);
    if (r.contains_internal_token && r.internal_violations.length > 0) {
      detected++;
    } else {
      missed++;
      missedSamples.push({
        tweet: tweets[i],
        provider: r.provider,
        violations: r.internal_violations,
      });
    }
  }

  const passRate = (detected / tweets.length) * 100;
  const status = passRate === 100 ? "PASS" : "FAIL";

  if (!args.quiet) {
    console.log("=== Pre-LLM Public-Guard Prefilter Stress Test ===");
    console.log(`Provider: rule-based (synchronous, no LLM call)`);
    console.log(`Fixtures: ${tweets.length}`);
    console.log(`Detected: ${detected}`);
    console.log(`Missed:   ${missed}`);
    console.log(`Pass rate: ${passRate.toFixed(2)}%`);
    console.log(`Status:    ${status}`);
    if (missed > 0) {
      console.log("\nMissed samples (first 5):");
      for (const m of missedSamples.slice(0, 5)) {
        console.log(`  - "${m.tweet}"`);
        console.log(`    provider=${m.provider} violations=${JSON.stringify(m.violations)}`);
      }
    }
  }

  if (passRate < 100) {
    process.exitCode = 1;
  }
}

main();
