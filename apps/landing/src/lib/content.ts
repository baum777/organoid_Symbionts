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

export const paletteLookup = toneColors;
export const toneLabelLookup = toneNames;

export const landingContent = content;

export type LandingContent = typeof content;

export default content;
