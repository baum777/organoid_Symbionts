export const brandTheme = {
  bio: "#6EE7B7",
  interface: "#67E8F9",
  meme: "#E879F9",
  void: "#09090B",
  surface: "#18181B",
  surfaceSoft: "#27272A",
  ink: "#FAFAFA",
  muted: "#A1A1AA",
} as const;

export type ToneKey = "bio" | "interface" | "meme" | "anchor" | "neutral";

export const toneColors: Record<ToneKey, string> = {
  bio: brandTheme.bio,
  interface: brandTheme.interface,
  meme: brandTheme.meme,
  anchor: brandTheme.ink,
  neutral: brandTheme.muted,
};

export const toneNames: Record<ToneKey, string> = {
  bio: "Bio",
  interface: "Interface",
  meme: "Meme",
  anchor: "Anchor",
  neutral: "Neutral",
};
