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
  { label: "Wetware", href: "#wetware" },
  { label: "Bottlenecks", href: "#bottlenecks" },
  { label: "Reality", href: "#reality" },
  { label: "Archetypes", href: "#archetypes" },
  { label: "Token", href: "#token" },
];

export const content = {
  brand: {
    name: "Organoid Symbiont",
    strapline: "Meme-native wetware / organoids / separate deploy",
  },
  hero: {
    eyebrow: "Dark lab / biotech glow / terminal intelligence",
    title: "Wetware is not magic. It is a harder interface.",
    description:
      "Early alchemists chased essence. Modern builders chase a substrate that can learn, adapt, and still be measured without self-deception. Organoids are not tiny consciousness toys. They are a weird, fragile, promising control problem.",
    primaryCta: "Enter the substrate",
    secondaryCta: "Read the bottlenecks",
    chips: [
      "Shared SSOT",
      "Separate deploy",
      "Research-aware",
      "Meme-native",
    ],
    cards: [
      {
        eyebrow: "Signal",
        title: "Hybrid compute",
        body: "Silicon still runs control. Biology mutates the stack.",
        tone: "bio",
        meta: "control plane stays measurable",
      },
      {
        eyebrow: "Reality",
        title: "Anti-hype by design",
        body: "The lab says signal first. Sentience can wait in line.",
        tone: "interface",
        meta: "no fake consciousness theater",
      },
      {
        eyebrow: "Signal layer",
        title: "Meme-native, not cringe",
        body: "Enough sorcery to travel. Enough rigor to survive.",
        tone: "meme",
        meta: "screenshot-friendly thesis",
      },
    ] satisfies SignalCardContent[],
  },
  sections: {
    wetware: {
      eyebrow: "01 / Definition",
      title: "What is wetware?",
      description:
        "A living substrate is still a substrate. Start with tissue, signal loops, and measurement. Do not start with science-fiction sentience cosplay.",
      points: [
        {
          eyebrow: "Living substrate",
          title: "The material is alive.",
          body: "Wetware means computation that includes living tissue, not a decorative bio skin around old ideas.",
          tone: "bio",
        },
        {
          eyebrow: "Organoids and neurons",
          title: "The useful story begins with loops.",
          body: "Organoids, neurons, and biohybrid assemblies matter because they create a different signal surface, not because they instantly become minds.",
          tone: "interface",
        },
        {
          eyebrow: "Anti-hype",
          title: "Start with control, not myth.",
          body: "The right first question is how to read, stimulate, maintain, and stabilize the tissue without lying to yourself.",
          tone: "meme",
        },
      ] satisfies SignalCardContent[],
    },
    hype: {
      eyebrow: "02 / Signal",
      title: "Why people think this changes everything",
      description:
        "The excitement is not random. There are three real stories that keep pulling people in, even when the lab reality is much less theatrical.",
      clusters: [
        {
          eyebrow: "Energy thesis",
          title: "Different watt math.",
          body: "If biology can do adaptive work under different energy constraints, the substrate story gets interesting fast.",
          tone: "bio",
        },
        {
          eyebrow: "Plasticity thesis",
          title: "Learning looks stranger here.",
          body: "A living system reorganizes in ways that are not a clean analog of gradient descent, and that is exactly why people keep staring at it.",
          tone: "interface",
        },
        {
          eyebrow: "Replacement thesis",
          title: "The market loves a full replacement fantasy.",
          body: "The dream is post-silicon replacement; the practical story is more likely interface augmentation and hybrid control.",
          tone: "meme",
        },
      ] satisfies SignalCardContent[],
    },
    bottlenecks: {
      eyebrow: "03 / Constraint",
      title: "Where it actually breaks",
      description:
        "This is the truth layer. The main failures are not aesthetic. They are mechanical, volumetric, biological, and operational.",
      items: [
        {
          eyebrow: "I/O",
          title: "Readout is the wall.",
          body: "The dream dies where the readout is too slow, too sparse, or too lossy to capture the state you care about.",
          tone: "interface",
        },
        {
          eyebrow: "Geometry",
          title: "3D tissue vs planar sensors.",
          body: "Living tissue is volumetric. Most interfaces are still flat, opinionated, and under-instrumented.",
          tone: "bio",
        },
        {
          eyebrow: "Maintenance",
          title: "Biology needs care.",
          body: "Perfusion, stability, contamination control, and ongoing maintenance are not side quests. They are the bill.",
          tone: "anchor",
        },
        {
          eyebrow: "Control",
          title: "Decoding is still hard.",
          body: "You can stimulate a tissue. Explaining the response in a way that supports control remains a separate problem.",
          tone: "meme",
        },
      ] satisfies SignalCardContent[],
      callout: "The myth is sentience. The lab sees an interface bottleneck.",
    },
    reality: {
      eyebrow: "04 / Stack",
      title: "Biohybrid reality",
      description:
        "The useful claim is not that biology replaces silicon. The useful claim is that biology mutates the stack and changes where the leverage lives.",
      thesis: "Not replacing silicon. Mutating the stack.",
      points: [
        {
          eyebrow: "Silicon side",
          title: "Control, routing, timing, measurement.",
          body: "The deterministic surfaces stay on the silicon side, where orchestration is fast, traceable, and less fragile.",
          tone: "interface",
        },
        {
          eyebrow: "Biology side",
          title: "Plasticity, adaptation, nonstandard learning.",
          body: "Living substrate contributes dynamics that are harder to fake with clean abstractions and easier to overstate from a distance.",
          tone: "bio",
        },
        {
          eyebrow: "Hybrid outcome",
          title: "A new control surface.",
          body: "The win is not purity. The win is a new stack shape with different trade-offs, different failure modes, and stranger leverage.",
          tone: "meme",
        },
      ] satisfies SignalCardContent[],
    },
    archetypes: {
      eyebrow: "05 / Meme layer",
      title: "Archetypes that make the thesis legible",
      description:
        "The page should know how to speak to the alchemist, the sorcerer, the Brahmin, and the trader-engineer-transhumanist without losing the plot.",
      cards: [
        {
          name: "Alchemist",
          classicalFunction: "Turns matter into essence and believes residue matters.",
          wetwareRewrite:
            "Treats experimental residue as a prototype and reads the lab like a transformation engine.",
          tone: "meme",
        },
        {
          name: "Sorcerer",
          classicalFunction: "Works with hidden forces and invisible channels.",
          wetwareRewrite:
            "Designs interfaces that feel like ritual, but are really disciplined control surfaces with atmosphere.",
          tone: "interface",
        },
        {
          name: "Brahmin",
          classicalFunction: "Guards canon, boundary, and doctrine.",
          wetwareRewrite:
            "Keeps semantic boundaries clean so the stack does not dissolve into hype, slippage, or public nonsense.",
          tone: "anchor",
        },
        {
          name: "Trader / Engineer / Transhumanist",
          classicalFunction: "Prices ambiguity, builds systems, and prefers leverage.",
          wetwareRewrite:
            "Reads the market, ships the container, and keeps one foot in the lab while the other foot tests the next substrate.",
          tone: "bio",
        },
      ] satisfies ArchetypeCardContent[],
    },
    snippets: {
      eyebrow: "06 / Copy wall",
      title: "The thesis as screenshot-friendly fragments",
      description:
        "Short lines should carry the whole argument. No whitepaper fog. No marketing sludge. Just enough compression to travel.",
      snippets: [
        "The substrate learns. The interface bottlenecks.",
        "You do not deploy software. You deploy stimulus.",
        "The lab says signal. The timeline says sentience.",
        "Biology mutates the stack.",
        "Code-deployable is a metaphor, not a theology.",
        "The dream is not purity. It is new trade-offs.",
        "Readout is policy.",
        "A wet future still needs a boring control plane.",
      ],
    },
    palette: {
      eyebrow: "07 / Color logic",
      title: "The palette is part of the argument",
      description:
        "Green says living substrate. Cyan says readout and instrumentation. Fuchsia says meme energy. Void says the thing still needs depth.",
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
      eyebrow: "08 / Signal economics",
      title: "Token thesis and meme-native coordination",
      description:
        "The token is not scientific proof and it is not fake utility. It is a signal amplifier that makes the thesis easier to coordinate around.",
      is: [
        "An amplifier for attention, memetics, and cultural compression.",
        "A way to package the thesis so people can carry it and remix it.",
        "A broadcast layer for the idea, not a replacement for the idea.",
      ],
      isNot: [
        "A proof of sentience.",
        "A substitute for lab results.",
        "A fake utility story with extra steps.",
      ],
    },
  },
  footer: {
    line: "Frontier compute, but stranger.",
    manifest: "Interface before mythology. The future got wet.",
  },
} as const;

export const paletteLookup = toneColors;
export const toneLabelLookup = toneNames;

export const landingContent = content;

export type LandingContent = typeof content;

export default content;
