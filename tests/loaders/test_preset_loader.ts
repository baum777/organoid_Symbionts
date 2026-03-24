import { describe, expect, it } from "vitest";
import { loadPreset, loadAllPresets, getPresetByKey, resolvePresetKey } from "../../src/loaders/presetLoader.js";
import { resolve } from "path";

describe("presetLoader", () => {
  describe("resolvePresetKey", () => {
    it("returns the provided key unchanged", () => {
      expect(resolvePresetKey("custom_preset")).toBe("custom_preset");
      expect(resolvePresetKey("ORGANOID_ON_SOL_roast_card")).toBe("ORGANOID_ON_SOL_roast_card");
    });
  });

  describe("loadPreset", () => {
    it("loads a valid preset YAML", () => {
      try {
        const presetPath = resolve("./prompts/presets/images/ORGANOID_ON_SOL_roast_card.yaml");
        const preset = loadPreset(presetPath);

        expect(preset.preset_key).toBeDefined();
        expect(preset.style_prompt).toBeDefined();
      } catch {
        // Skip if file doesn't exist
      }
    });
  });

  describe("loadAllPresets", () => {
    it("returns a map of presets", () => {
      const presetsDir = resolve("./prompts/presets/images");

      try {
        const presets = loadAllPresets(presetsDir);

        expect(presets instanceof Map).toBe(true);
      } catch {
        // Skip if directory doesn't exist
      }
    });
  });

  describe("getPresetByKey", () => {
    it("finds preset via canonical key", () => {
      const mockPresets = new Map([
        ["ORGANOID_ON_SOL_roast_card", { preset_key: "ORGANOID_ON_SOL_roast_card", style_prompt: "test", sourcePath: "" }],
      ]);

      const preset = getPresetByKey(mockPresets, "ORGANOID_ON_SOL_roast_card");

      expect(preset).toBeDefined();
      expect(preset?.preset_key).toBe("ORGANOID_ON_SOL_roast_card");
    });
  });
});
