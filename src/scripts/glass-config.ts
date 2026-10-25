/* ══════════════════════════════════════════════════════════
   GLASS SETTINGS — one shared set of liquid-glass parameters
   ──────────────────────────────────────────────────────────
   Same names, ranges and meaning as the @ybouane/liquidglass playground
   (liquid-glass.ybouane.com). Used by the nav lens (lens.ts, every mode)
   and the WebGL cards (liquid.ts, glass mode). Edited live from the
   settings panel (glass-panel.ts) and remembered per visitor.
   ══════════════════════════════════════════════════════════ */

export type GlassSettings = {
  blurAmount: number;
  refraction: number;
  chromAberration: number;
  edgeHighlight: number;
  specular: number;
  fresnel: number;
  distortion: number;
  cornerRadius: number;
  zRadius: number;
  opacity: number;
  saturation: number;
  brightness: number;
  shadowOpacity: number;
  shadowSpread: number;
  bevelMode: number;
};
export type PresetName = "clear" | "frosted" | "dark";

/* Clear: the playground settings this site was tuned with. Frosted and
   Dark apply the library's own Frosted / Dark Glass overrides on top. */
const CLEAR: GlassSettings = {
  blurAmount: 0.1,
  refraction: 0.69,
  chromAberration: 0.06,
  edgeHighlight: 0.01,
  specular: 0,
  fresnel: 1.03,
  distortion: 0.09,
  cornerRadius: 20,
  zRadius: 28,
  opacity: 1,
  saturation: 0,
  brightness: 0,
  shadowOpacity: 0.3,
  shadowSpread: 11,
  bevelMode: 0,
};
export const PRESETS: Record<PresetName, GlassSettings> = {
  clear: CLEAR,
  frosted: { ...CLEAR, blurAmount: 0.25, refraction: 0.5 },
  dark: { ...CLEAR, blurAmount: 0.25, refraction: 0.5, brightness: -0.3 },
};
export const PRESET_LABELS: Record<PresetName, string> = { clear: "Clear", frosted: "Frosted", dark: "Dark" };

/* Slider ranges, matching the playground. */
export const CONTROLS: { key: keyof GlassSettings; label: string; min: number; max: number; step: number }[] = [
  { key: "blurAmount", label: "Blur Amount", min: 0, max: 1, step: 0.01 },
  { key: "refraction", label: "Refraction", min: 0, max: 2, step: 0.01 },
  { key: "chromAberration", label: "Chrom. Aberration", min: 0, max: 0.3, step: 0.005 },
  { key: "edgeHighlight", label: "Edge Highlight", min: 0, max: 1, step: 0.01 },
  { key: "specular", label: "Specular", min: 0, max: 1, step: 0.01 },
  { key: "fresnel", label: "Fresnel", min: 0, max: 2, step: 0.01 },
  { key: "distortion", label: "Distortion", min: 0, max: 1, step: 0.01 },
  { key: "cornerRadius", label: "Corner Radius", min: 0, max: 100, step: 1 },
  { key: "zRadius", label: "Z-Radius", min: 0, max: 100, step: 1 },
  { key: "opacity", label: "Opacity", min: 0, max: 1, step: 0.01 },
  { key: "saturation", label: "Saturation", min: -1, max: 1, step: 0.01 },
  { key: "brightness", label: "Brightness", min: -0.5, max: 0.5, step: 0.01 },
  { key: "shadowOpacity", label: "Shadow Opacity", min: 0, max: 1, step: 0.01 },
  { key: "shadowSpread", label: "Shadow Spread", min: 0, max: 40, step: 1 },
  { key: "bevelMode", label: "Bevel Mode", min: 0, max: 1, step: 1 },
];

const KEY = "eq-glass-cfg";
type Stored = { preset: PresetName | "custom"; values: GlassSettings };

function load(): Stored {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || "null") as Partial<Stored> | null;
    if (raw && raw.values) {
      const values = { ...CLEAR };
      for (const c of CONTROLS) {
        const v = Number((raw.values as Record<string, unknown>)[c.key]);
        if (Number.isFinite(v)) values[c.key] = Math.min(c.max, Math.max(c.min, v));
      }
      const preset = raw.preset && (raw.preset === "custom" || raw.preset in PRESETS) ? raw.preset : "custom";
      return { preset, values };
    }
  } catch {
    /* storage unavailable or corrupt — fall back to Clear */
  }
  return { preset: "clear", values: { ...CLEAR } };
}

let state = load();
const listeners = new Set<(s: GlassSettings) => void>();
const html = document.documentElement;

/* Page-level side effect of the settings: the corner radius the nav pill
   and the glass cards share. */
function reflect(s: GlassSettings) {
  html.style.setProperty("--glass-r", `${s.cornerRadius}px`);
}
reflect(state.values);

export const getGlass = (): GlassSettings => state.values;
export const getPreset = (): PresetName | "custom" => state.preset;

export function onGlass(fn: (s: GlassSettings) => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function commit(next: Stored) {
  state = next;
  reflect(state.values);
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* not remembered in private mode */
  }
  listeners.forEach((fn) => fn(state.values));
}

export function setGlass(patch: Partial<GlassSettings>): void {
  commit({ preset: "custom", values: { ...state.values, ...patch } });
}

export function usePreset(name: PresetName): void {
  commit({ preset: name, values: { ...PRESETS[name] } });
}
