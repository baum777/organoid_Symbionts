# Accessibility Audit Gaps — Week 2

Scope: `/practice`, `/practice/embodiments/[id]`, `/consult`.
Audit checklist: A (labels/inputs), B (buttons/links), C (landmarks/headings),
D (live regions), E (focus), F (color/contrast), G (touch/mobile).
Date: 2026-06-17. All items below were either fixed inline during the
Week 2 slice or carry an explicit owner for the next iteration.

## Items fixed inline (no longer gaps)

- B: external crisis link in `practice-compliance.tsx` now has
  `aria-label="…(opens in new tab)"` and explicit visible "(new tab)".
- E: `practice-nav.tsx`, `practice-hero.tsx`, `footer-manifest.tsx`,
  `practice-compliance.tsx`, `practice/embodiments/[id]/page.tsx`,
  `practice-cohort-cta.tsx`, `practice-session-types.tsx`, and the entire
  `/consult` page now apply the shared
  `focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-void`
  pattern on every interactive element.
- G: `min-h-[44px]` added to every interactive element in scope
  (consult radios, posture chips, submit, "Ask another" reset, back-link,
  nav links, hero CTAs, cohort mailto, footer links, crisis link,
  embodiment back-link).
- C: `practice-nav.tsx` `<nav>` now has `aria-label="Practice sections"`.
- C: `/consult` form and answer sections are now explicitly
  `aria-labelledby`-bound to their `<h2>` headings.

## Remaining gaps

| # | Item | Severity | Owner | Remediation |
|---|------|----------|-------|-------------|
| 1 | F — color contrast: not run through an automated tool (axe / Lighthouse) in this slice. The 5 tone colors come from `theme.ts`; white/40 focus ring on `bio/interface/meme/anchor` tones is hand-verified only. | moderate | Week 3 QA | Run `pnpm build && npx @axe-core/cli http://localhost:3000/practice` and `/consult`; promote any < 4.5:1 text-on-tone violation to the gap board. |
| 2 | G — mobile 320px: no device-farm pass. The grid collapses to single column on mobile, but the radio card row, posture chip row, and submit button need real-device visual confirmation. | moderate | Week 3 mobile sweep | `pnpm dev` + Chrome DevTools 320px width + VoiceOver/TalkBack screenshot. |
| 3 | B — footer manifest links in `footer-manifest.tsx` render as `<a>` instead of `next/link`. Internal practice links (`/practice`, `/practice/embodiments/stabil-core`, `/practice#compliance`) get a full page navigation, no prefetch. | minor | Week 3 sweep | Swap to `next/link` from `next/link` (allowed import). |
| 4 | D — the stub answer block uses `aria-live="polite"` on the section wrapper. The 7-glyph pulse is `aria-hidden` but the leading "API wird in Woche 3 verkabelt" text is in a `role="status"` region — these are screen-reader-equivalent. A11y tree: only one of them is needed. | minor | Week 3 polish | Keep the `role="status"` block (it carries the user-facing text), drop the `aria-live` from the answer `<section>` and rely on the inner StubAnswer reset button as the live edge. |
| 5 | B — `/consult` placeholder copy rotates by context, but the rotation is silent; screen-reader users do not hear the change when they switch context. | minor | Week 3 polish | Add an `aria-live="polite"` (or `role="status"`) span near the textarea that announces the new placeholder on context change. |
| 6 | C — `/consult` uses `<h2>` for the form and answer section headings but the page-level `<h1>` is in `ConsultHeader`. There is no `h2` between the header and the form section, so the hierarchy is h1 → h2 (form) → h2 (answer) → h2 (compliance, via PracticeCompliance). That is correct, but the "Ask the matrix" and "Answer" `<h2>`s sit side-by-side with `<PracticeCompliance>`'s implicit heading structure (it has no heading element of its own). | minor | Week 3 polish | Either give `PracticeCompliance` an explicit `h2` (label "Compliance") or add an `aria-label` on the section wrapper. |
| 7 | A — the radio groups on `/consult` use a custom `handleRadioKey` helper that synthesizes `aria-label` lookup via DOM querySelector. Works in the current build but is fragile to a future markup change (e.g. nested groups). | minor | Week 3 polish | Replace the lookup with a `Map<string, () => void>` of stable keys, or extract a tiny `useRadioGroup` hook. |
| 8 | E — there is no visible skip link to the form on `/consult`. The `<h1>` is the first focusable element after the sticky nav. | minor | Week 3 polish | Add a "Skip to form" link as the first focusable element on `/consult`. |
| 9 | F — focus ring color `white/40` (rgba(255,255,255,0.4)) is fine on the dark void background, but is low-contrast on a fully white/light background. None of the practice pages have a light surface, so this is currently theoretical. | minor | Cross-pillar | Document in `theme.ts` comment that `focus-visible:ring-white/40` assumes the void background; add a `.bg-ink` variant when the practice grows a printable white-mode. |
| 10 | F — glyph-only affordances: every embodiment glyph, every pulse glyph, and every AnswerCard glyph has both an `aria-label` and visible text, so the glyph is never the sole carrier of meaning. ✓ (no gap; recorded for the audit trail). | — | — | — |

## Audit method

- A–E: hand-walked the rendered HTML for `/practice`, `/practice/embodiments/stabil-core`,
  and `/consult` after the Week 2 build.
- F: not run through an automated tool. To be done in Week 3.
- G: read the Tailwind class chains in the new components; no live
  device-farm pass yet.
- Voice-over / TalkBack: not run in this slice. To be done in Week 3.
