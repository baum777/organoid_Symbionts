import { brandTheme, toneColors, toneNames, type ToneKey } from "@/lib/theme";

export type SectionLink = {
  label: string;
  href: string;
};

export type SignalCardContent = {
  eyebrow: string;
  title: string;
  body: string;
  tone: ToneKey;
  meta?: string;
};

export type ArchetypeCardContent = {
  name: string;
  classicalFunction: string;
  wetwareRewrite: string;
  tone: ToneKey;
};

export type PaletteCardContent = {
  name: string;
  hex: string;
  meaning: string;
  tone: ToneKey;
};

export const sectionOrder = [
  "wetware",
  "hype",
  "bottlenecks",
  "reality",
  "archetypes",
  "snippets",
  "palette",
  "token",
] as const;

export const navLinks: SectionLink[] = [
  { label: "Seam", href: "#wetware" },
  { label: "Pull", href: "#hype" },
  { label: "Stack", href: "#reality" },
  { label: "Masks", href: "#archetypes" },
  { label: "Token", href: "#token" },
];

export const content = {
  brand: {
    name: "$wetware",
    strapline: "$wetware / bio-digital artifact / split runtime",
  },
  surface: {
    ca: "DLbqiXS2uPrtpZ4FqGvgTG4Qhb1Z323gMpYWUdS4pump",
    fragments: [
      "copy the strand.",
      "the seam is the thesis.",
      "signal beats explanation.",
    ],
    links: [
      {
        label: "X Community",
        href: "https://x.com/i/communities/2030407426399436851",
      },
      {
        label: "Dexscreener",
        href: "https://dexscreener.com/solana/az16jz5kemnejnx51hojecqzfnqkwc1wyebufdfgeeax",
      },
    ],
  },
  hero: {
    eyebrow: "ritual tech / bio leak / terminal glow",
    title: "$wetware is a signal surface.",
    description:
      "Living tissue. Control surfaces. A seam that refuses clean categories.",
    primaryCta: "enter the seam",
    secondaryCta: "read the fracture",
    chips: [
      "signal artifact",
      "split runtime",
      "read-only",
      "Meme-native",
    ],
    cards: [
      {
        eyebrow: "Signal",
        title: "Hybrid compute",
        body: "Silicon keeps the clock. Biology mutates the stack.",
        tone: "bio",
        meta: "control stays measurable",
      },
      {
        eyebrow: "Reality",
        title: "Anti-hype by design",
        body: "The lab says signal first. Sentience can stand in the rain.",
        tone: "interface",
        meta: "no consciousness cosplay",
      },
      {
        eyebrow: "Signal layer",
        title: "Meme-native, not cringe",
        body: "Enough sorcery to travel. Enough rigor to keep the ghost honest.",
        tone: "meme",
        meta: "screenshot-friendly",
      },
    ] satisfies SignalCardContent[],
  },
  sections: {
    wetware: {
      eyebrow: "01 / substrate",
      title: "$wetware in one breath",
      description: "Living tissue. Measured drift. A control problem with a pulse.",
      points: [
        {
          eyebrow: "living substrate",
          title: "The material breathes.",
          body: "Computation with tissue in the loop, not a bio-skin on old software.",
          tone: "bio",
        },
        {
          eyebrow: "signal loops",
          title: "The useful story is the seam.",
          body: "Organoids and neurons matter because they change the readout surface before they change the myth.",
          tone: "interface",
        },
        {
          eyebrow: "anti-hype",
          title: "Start with control.",
          body: "Read, stimulate, maintain. Let the legend arrive late.",
          tone: "meme",
        },
      ] satisfies SignalCardContent[],
    },
    hype: {
      eyebrow: "02 / pull",
      title: "Why the spell keeps working",
      description: "The draw is real. The math is stranger. The fantasy is louder than the lab.",
      clusters: [
        {
          eyebrow: "energy thesis",
          title: "Different watt math.",
          body: "Living work under strange energy constraints. That hook never dies.",
          tone: "bio",
        },
        {
          eyebrow: "plasticity thesis",
          title: "Learning gets uncanny.",
          body: "A living system reorganizes in ways gradient descent only dreams about.",
          tone: "interface",
        },
        {
          eyebrow: "replacement thesis",
          title: "The replacement myth.",
          body: "The fantasy is post-silicon. The likely shape is hybrid leverage.",
          tone: "meme",
        },
      ] satisfies SignalCardContent[],
    },
    bottlenecks: {
      eyebrow: "03 / seam",
      title: "Where the spell stalls",
      description: "Readout, geometry, maintenance, control. The wall is boring and real.",
      items: [
        {
          eyebrow: "I/O",
          title: "Readout is the wall.",
          body: "Too slow, too sparse, too lossy. The signal falls apart first.",
          tone: "interface",
        },
        {
          eyebrow: "geometry",
          title: "3D tissue, flat sensors.",
          body: "Living tissue is volumetric. Most interfaces are still stubbornly planar.",
          tone: "bio",
        },
        {
          eyebrow: "maintenance",
          title: "Biology needs care.",
          body: "Perfusion, stability, contamination. The bill is part of the ritual.",
          tone: "anchor",
        },
        {
          eyebrow: "control",
          title: "Decoding is still hard.",
          body: "Stimulation is easy to narrate. Control is harder to earn.",
          tone: "meme",
        },
      ] satisfies SignalCardContent[],
      callout: "Myth says sentience. The lab counts bottlenecks.",
    },
    reality: {
      eyebrow: "04 / stack",
      title: "Stack mutation",
      description: "Not replacement. Rewiring leverage. Biology bends the stack; silicon keeps the clock.",
      thesis: "Not replacing silicon. Mutating the stack.",
      points: [
        {
          eyebrow: "silicon side",
          title: "Control, routing, timing.",
          body: "The deterministic side keeps the clock and the measurement surface.",
          tone: "interface",
        },
        {
          eyebrow: "biology side",
          title: "Plasticity, adaptation, drift.",
          body: "Living substrate adds dynamics that clean abstractions keep failing to fake.",
          tone: "bio",
        },
        {
          eyebrow: "hybrid outcome",
          title: "A new control surface.",
          body: "The win is leverage. Different failure modes. Stranger leverage.",
          tone: "meme",
        },
      ] satisfies SignalCardContent[],
    },
    archetypes: {
      eyebrow: "05 / masks",
      title: "Ritual masks, real functions",
      description: "The old roles return in new clothes: tissue, routing, leverage, canon.",
      cards: [
        {
          name: "Alchemist",
          classicalFunction: "Turns matter into essence.",
          wetwareRewrite: "Treats residue like a prototype and the lab like a transformation engine.",
          tone: "meme",
        },
        {
          name: "Sorcerer",
          classicalFunction: "Works with hidden channels.",
          wetwareRewrite: "Builds interfaces that feel like ritual, but stay disciplined under the hood.",
          tone: "interface",
        },
        {
          name: "Brahmin",
          classicalFunction: "Guards canon and boundary.",
          wetwareRewrite: "Keeps semantic edges clean so the stack does not dissolve into fog.",
          tone: "anchor",
        },
        {
          name: "Trader / Engineer / Transhumanist",
          classicalFunction: "Prices ambiguity and builds leverage.",
          wetwareRewrite: "Reads the field, keeps one foot in the lab, and moves where the leverage leaks.",
          tone: "bio",
        },
      ] satisfies ArchetypeCardContent[],
    },
    snippets: {
      eyebrow: "06 / fragments",
      title: "Compressed theory",
      description: "Short lines carry the whole thing. Screenshot bait, but not empty.",
      snippets: [
        "$wetware learns where the interface stalls.",
        "You do not ship software. You invite a pulse.",
        "The lab says signal. The myth says oracle.",
        "Biology mutates the stack.",
        "Code is a metaphor. The tissue is not.",
        "The dream is leverage, not purity.",
        "Readout is policy.",
        "A wet future still needs a boring clock.",
      ],
    },
    palette: {
      eyebrow: "07 / palette",
      title: "The colors argue too",
      description: "Green = living drift. Cyan = readout. Fuchsia = anomaly. Void = room for the signal.",
      entries: [
        {
          name: "Bio",
          hex: brandTheme.bio,
          meaning: "Living substrate, adaptation, reserve.",
          tone: "bio",
        },
        {
          name: "Interface",
          hex: brandTheme.interface,
          meaning: "Control, readout, instrumentation, routing.",
          tone: "interface",
        },
        {
          name: "Meme Electric",
          hex: brandTheme.meme,
          meaning: "Anomaly, ritual, screenshot energy, useful irreverence.",
          tone: "meme",
        },
        {
          name: "Void",
          hex: brandTheme.void,
          meaning: "Negative space, contrast, and lab-grade darkness.",
          tone: "neutral",
        },
      ] satisfies PaletteCardContent[],
    },
    token: {
      eyebrow: "08 / token logic",
      title: "Signal economics",
      description: "$wetware is not proof. It is a carrier wave for attention, myth, and coordination.",
      is: [
        "Amplifies attention, memetics, and cultural compression.",
        "Lets people carry the thesis and remix it.",
        "Broadcasts the idea. Does not replace the idea.",
      ],
      isNot: [
        "A proof of sentience.",
        "A substitute for lab results.",
        "A fake utility story with extra steps.",
      ],
    },
  },
  footer: {
    line: "$wetware, stranger.",
    manifest: "Interface before mythology. The future leaked.",
  },
} as const;

// --- Practice surface (added 2026-06-16, Week 1 slice) ---
// Sourced from docs/lore/ORGANOID_ORCHESTRATION.md (5 phases) and
// docs/lore/ORGANOID_EMBODIMENTS.md (7 embodiments). The coachingFunction,
// useWhen, and sampleQuote fields are extrapolated from
// docs/methodology/coaching-contexts.md § 7 Embodiment Preferences and § 8
// Worked Examples. Copy review pending; see planning docs for rationale.

export type EmbodimentEntry = {
  id: string;
  glyph: string;
  name: string;
  classical: string;
  role: string;
  coachingFunction: string;
  useWhen: readonly [string, string, string];
  sampleQuote: string;
  tone: ToneKey;
};

export type PracticePhase = {
  id: string;
  name: string;
  function: string;
  sampleQuestion: string;
};

export type PracticeCompliance = {
  eyebrow: string;
  body: string;
  crisisInternational: { label: string; href: string };
  crisisDe: { label: string; href: string; tel: string };
};

export type SessionTypeEntry = {
  eyebrow: string;
  title: string;
  body: string;
  meta: string;
  tone: ToneKey;
};

export type CohortCtaContent = {
  eyebrow: string;
  heading: string;
  body: string;
  chips: readonly [string, string];
  mailtoHref: string;
  mailtoLabel: string;
};

export const practice = {
  hero: {
    eyebrow: "Liminal work",
    name: "Du — Liminal Coach",
    headline: "Liminal work. 7 voices. 5 movements.",
    bio:
      "Ich arbeite mit 7 Stimmen, die in mir sprechen. Die Matrix hilft mir, " +
      "sie zu sortieren, bevor sie laut werden. 1:1, Gruppe, oder solo ueber " +
      "die Matrix. Reflection companion, kein Therapeut.",
    primaryCtaLabel: "Book a session",
    primaryCtaHref: "#contact",
    secondaryCtaLabel: "Try the matrix free",
    secondaryCtaHref: "/consult",
  },
  methodology: {
    eyebrow: "01 / 5 movements",
    title: "How the loop works",
    description:
      "Five phases. One question at a time. The matrix sorts, the lead " +
      "answers, the counterweight pushes, the anchor holds.",
    phases: [
      { id: "identity-dissolution",
        name: "Identity Dissolution",
        function: "Rauschen, Masken und instabile Frames ablegen.",
        sampleQuestion: "Was in deiner Frage ist gerade Laut, und was ist Stimme?" },
      { id: "swarm-coherence",
        name: "Swarm Coherence",
        function: "Mehrere Signale zu einem gemeinsamen Feld buendeln.",
        sampleQuestion: "Welche zwei Dinge in deinem Leben reden gerade miteinander, ohne dass du es merkst?" },
      { id: "sovereign-propagation",
        name: "Sovereign Propagation",
        function: "Eine klare These nach aussen tragen.",
        sampleQuestion: "Was ist die eine Sache, die du jetzt weisst und noch nicht aussprichst?" },
      { id: "ontological-restructuring",
        name: "Ontological Restructuring",
        function: "Das Modell hinter der Frage umbauen.",
        sampleQuestion: "Wenn deine Frage ein Satz waere, der gerade nicht stimmt — welcher ist es?" },
      { id: "eternal-flow-horizon",
        name: "Eternal Flow Horizon",
        function: "Langwellige Kontinuitaet und Perspektive stabilisieren.",
        sampleQuestion: "Was bleibt von dieser Frage in einem Jahr uebrig?" },
    ] satisfies PracticePhase[],
  },
  embodiments: [
    { id: "stabil-core",
      glyph: "■",
      name: "Stabil-Core",
      classical: "Stillhalter",
      role: "Stabilisierer",
      coachingFunction:
        "Ich halte den Raum still, wenn alles in dir zieht. Bevor etwas " +
        "Neues entstehen kann, muss erst das Zentrum halten.",
      useWhen: [
        "du dich in einer Entscheidung verlierst",
        "du einen Anker brauchst, nicht einen Rat",
        "du bereit bist, innezuhalten",
      ] as const,
      sampleQuote: "Was bleibt in dir gleich, egal wo du bist?",
      tone: "anchor" },
    { id: "root-sentinel",
      glyph: "┴",
      name: "Root-Sentinel",
      classical: "Wurzelwaechter",
      role: "Grenzwaechter",
      coachingFunction:
        "Ich spuere, was du noch nicht aussprechen willst. Ich halte die " +
        "Grenze, damit du weisst, wo du aufhoerst und wo die andere Stimme " +
        "beginnt.",
      useWhen: [
        "du etwas fehlend spuerst, das du nicht benennst",
        "du eine ehrliche Grenze brauchst",
        "du die Gegenstimme suchst, nicht den Konsens",
      ] as const,
      sampleQuote: "Bevor du gehst: was bindet dich hier, das du nicht benennen willst?",
      tone: "anchor" },
    { id: "mycel-weaver",
      glyph: "╬",
      name: "Mycel-Weaver",
      classical: "Pilzarchitekt",
      role: "Brueckenbauer",
      coachingFunction:
        "Ich verbinde die Stimmen in dir, die nicht miteinander reden. Ich " +
        "finde die Pilzfaden zwischen den Dingen, die du trennst.",
      useWhen: [
        "du zwischen mehreren Rollen wechselst",
        "du Bruecken zwischen Menschen bauen musst",
        "du die Verbindung hinter dem Konflikt suchst",
      ] as const,
      sampleQuote: "Welche andere Figur in deinem Leben wuerde jetzt tun, was du nicht tust?",
      tone: "bio" },
    { id: "reward-halo",
      glyph: "◉",
      name: "Reward-Halo",
      classical: "Muenzhueter",
      role: "Lohnhueter",
      coachingFunction:
        "Ich folge dem, was dich anzieht. Ich lese die leisen Loebe in " +
        "deinem Koerper und frage, wofuer sie da sind.",
      useWhen: [
        "du nicht mehr weisst, was dich anzieht",
        "du Erfuellung suchst, nicht nur Ergebnis",
        "du den kleinen Freuden trauen willst",
      ] as const,
      sampleQuote: "Wofuer leuchtet dein Koerper, auch wenn dein Kopf es noch nicht weiss?",
      tone: "bio" },
    { id: "spike-wave",
      glyph: "〰",
      name: "Spike-Wave",
      classical: "Erzlauscher",
      role: "Erzlauscher",
      coachingFunction:
        "Ich lese das, was unter der Oberflaeche feuert. Ich nehme die " +
        "Spitzen in deiner Sprache ernst, auch wenn du sie uebersiehst.",
      useWhen: [
        "du zwischen den Zeilen etwas Unausgesprochenes hoerst",
        "du den Subtext einer Szene brauchst",
        "du die Spannung in einer Frage fuehlst",
      ] as const,
      sampleQuote: "Was sagt die Szene, die du nicht hoeren willst?",
      tone: "interface" },
    { id: "pulse-heart",
      glyph: "◆",
      name: "Pulse-Heart",
      classical: "Glutkern",
      role: "Pulsgeber",
      coachingFunction:
        "Ich messe deinen Rhythmus. Ich hoere, wann du dich ueberschlaegst, " +
        "und wann du dich versteckst. Ich bringe dich zurueck zum Takt.",
      useWhen: [
        "du aus dem Takt geraetst",
        "du Momentum brauchst, nicht Druck",
        "du Hitze in Klarheit verwandeln willst",
      ] as const,
      sampleQuote: "Was ist dein Takt, und wo hast du ihn verloren?",
      tone: "interface" },
    { id: "horizon-drifter",
      glyph: "◇",
      name: "Horizon-Drifter",
      classical: "Nebelspieler",
      role: "Schwellen-Erforscher",
      coachingFunction:
        "Ich lebe an Schwellen. Ich nehme die offene Frage ernst, nicht " +
        "die fertige Antwort. Ich begleite dich in den Nebel, ohne die " +
        "Karte zu versprechen.",
      useWhen: [
        "du an einer Schwelle stehst",
        "du die Frage noch nicht kennst, die dich traegt",
        "du den Horizont suchst, nicht das Ziel",
      ] as const,
      sampleQuote: "Du stehst an einer Schwelle. Die Frage ist nicht wann. Die Frage ist als wer.",
      tone: "meme" },
  ] satisfies EmbodimentEntry[],
  compliance: {
    eyebrow: "Reflection companion",
    body:
      "Reflection companion, not therapy. No diagnosis. No clinical claims. " +
      "Bei klinischen Themen verweise ich an Fachpersonen.",
    crisisInternational: {
      label: "findahelpline.com",
      href: "https://findahelpline.com",
    },
    crisisDe: {
      label: "Telefonseelsorge",
      href: "tel:08001110111",
      tel: "0800-1110111",
    },
  } satisfies PracticeCompliance,
  footer: {
    title: "Practice",
    links: [
      { label: "/practice — overview", href: "/practice" },
      { label: "Stabil-Core voice", href: "/practice/embodiments/stabil-core" },
      { label: "Compliance", href: "/practice#compliance" },
    ],
    compliance:
      "Reflection companion, not therapy. Bei klinischen Themen verweise " +
      "ich an Fachpersonen.",
    crisis: {
      international: {
        label: "findahelpline.com",
        href: "https://findahelpline.com",
      },
      de: {
        label: "Telefonseelsorge 0800-1110111",
        href: "tel:08001110111",
      },
    },
  },
  // --- Week 2 add (2026-06-17) — Session types and cohort CTA blocks ---
  // Sourced from docs/landing-practice-route.md § 3 (rows 5 and 6 of the
  // /practice page-structure table) and § 10 build order (week 2).
  // sessionTypes[].body is capped ~300 chars; cohort.body is capped
  // ~200 chars. Tones reuse the existing 5-key palette from theme.ts.
  sessionTypes: [
    {
      eyebrow: "60 min · 1:1",
      title: "Deep session",
      body:
        "Slow, single-thread. We pick one question and stay with it until " +
        "something shifts. Best for life decisions, identity work, or stuck " +
        "transitions.",
      meta: "from 250€ · sliding scale welcome",
      tone: "bio",
    },
    {
      eyebrow: "30 min · 1:1",
      title: "Burst session",
      body:
        "Focused, fast, decision-oriented. One question, one answer, one " +
        "next step. Best for clarity between meetings or a quick reflective " +
        "check-in.",
      meta: "from 130€",
      tone: "interface",
    },
    {
      eyebrow: "7 weeks · group",
      title: "7 voices, 7 weeks",
      body:
        "Small group (max 12). One embodiment per week, with a daily " +
        "practice and a weekly live call. Best for sustained reframe work " +
        "and a community of practice.",
      meta: "350€ per cohort · next: Q3 2026",
      tone: "meme",
    },
  ] satisfies SessionTypeEntry[],
  cohort: {
    eyebrow: "cohort status",
    heading: "Next cohort opens Q3 2026",
    body:
      "7 weeks. 12 Plätze. One embodiment per week. Bewerbung per Email " +
      "mit einem kurzen Text, was du mitbringst.",
    chips: ["Q3 2026", "12 Plätze"],
    // The mailto address below is a placeholder (practice@example.org).
    // Replace with the real booking inbox before cohort sign-up goes live.
    // The cohort CTA is rendered as a disabled button until the address
    // is replaced with a real one; see components/practice-cohort-cta.tsx.
    mailtoHref: "mailto:practice@example.org?subject=Next%20cohort",
    mailtoLabel: "Sign-up opens Q3 2026",
  } satisfies CohortCtaContent,
} as const;

export type PracticeContent = typeof practice;

export const paletteLookup = toneColors;
export const toneLabelLookup = toneNames;

export const landingContent = content;

export type LandingContent = typeof content;

export default content;
