/* ══════════════════════════════════════════════════════════
   GLASS PANEL — live controls for the liquid glass
   ──────────────────────────────────────────────────────────
   Opened by resting the pointer on the droplet button (or a long-press /
   Arrow-Down on it). Presets plus every playground slider; changes apply
   instantly to the nav lens and, in glass mode, every card.
   Built on first open, so it costs nothing until someone asks for it.
   ══════════════════════════════════════════════════════════ */
import {
  CONTROLS,
  PRESETS,
  PRESET_LABELS,
  getGlass,
  getPreset,
  onGlass,
  setGlass,
  usePreset,
  type PresetName,
} from "./glass-config";

/* ══════════════════════════════════════════════════════════
   GLASS PANEL — live controls for the liquid glass
   ══════════════════════════════════════════════════════════ */
import {
  CONTROLS,
  PRESETS,
  PRESET_LABELS,
  getGlass,
  getPreset,
  onGlass,
  setGlass,
  usePreset,
  type PresetName,
} from "./glass-config";
import { bake } from "./lens";

let panel: HTMLElement | null = null;
let anchor: HTMLElement | null = null;

/* ── Panel SVG lens (same pipeline as nav, rebaked for panel size) ── */
const NS = "http://www.w3.org/2000/svg";
const svgEl = <K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string> = {}) => {
  const e = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  return e;
};

let panelSvg: SVGSVGElement | null = null;
let panelFilter: SVGFilterElement | null = null;
let panelMapR: SVGFEImageElement | null = null;
let panelMapG: SVGFEImageElement | null = null;
let panelMapB: SVGFEImageElement | null = null;
let panelMapL: SVGFEImageElement | null = null;
let panelBlur: SVGFEGaussianBlurElement | null = null;
let panelJitter: SVGFEDisplacementMapElement | null = null;
let panelGrade: SVGFEColorMatrixElement | null = null;
let panelOpacity: SVGFECompositeElement | null = null;
let panelDisps: SVGFEDisplacementMapElement[] = [];
let panelUrls: string[] = [];
let panelBaked = "";
let panelBakeRun = 0;

function buildPanelFilter() {
  const svg = svgEl("svg", { width: "0", height: "0", "aria-hidden": "true" });
  svg.style.cssText = "position:absolute;width:0;height:0;overflow:hidden;pointer-events:none";
  const filter = svgEl("filter", { id: "gpanel-lens", x: "0", y: "0", filterUnits: "userSpaceOnUse", "color-interpolation-filters": "sRGB" });
  const img = (result: string) => svgEl("feImage", { x: "0", y: "0", preserveAspectRatio: "none", result });
  const mr = img("pmr"); const mg = img("pmg"); const mb = img("pmb"); const ml = img("pml");
  const blur = svgEl("feGaussianBlur", { in: "SourceGraphic", result: "pblurA" });
  const opaque = svgEl("feColorMatrix", { in: "pblurA", type: "matrix", values: "1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0 1", result: "pblur" });
  const noise = svgEl("feTurbulence", { type: "fractalNoise", baseFrequency: "0.85", numOctaves: "1", seed: "12", result: "pnoiseT" });
  const noiseO = svgEl("feColorMatrix", { in: "pnoiseT", type: "matrix", values: "1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0 1", result: "pnoiseA" });
  const maskL = svgEl("feColorMatrix", { in: "pml", type: "matrix", values: "0 0 1 0 0  0 0 1 0 0  0 0 1 0 0  0 0 0 0 1", result: "pjmask" });
  const noiseM = svgEl("feComposite", { in: "pnoiseA", in2: "pjmask", operator: "arithmetic", k1: "1", k2: "0", k3: "-0.5", k4: "0.5", result: "pnoise" });
  const jitter = svgEl("feDisplacementMap", { in: "pblur", in2: "pnoise", xChannelSelector: "R", yChannelSelector: "G", result: "psrc" });
  const disp = (map: string, out: string, matrix: string) => {
    const d = svgEl("feDisplacementMap", { in: "psrc", in2: map, xChannelSelector: "R", yChannelSelector: "G", result: `${out}d` });
    const only = svgEl("feColorMatrix", { in: `${out}d`, type: "matrix", values: matrix, result: out });
    return [d, only] as const;
  };
  const [dR, oR] = disp("pmr", "pcr", "1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0");
  const [dG, oG] = disp("pmg", "pcg", "0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0");
  const [dB, oB] = disp("pmb", "pcb", "0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0");
  const grade = svgEl("feColorMatrix", { in: "prgb", type: "matrix", result: "pgraded" });
  const mulL = svgEl("feColorMatrix", { in: "pml", type: "matrix", values: "0 1 0 0 0  0 1 0 0 0  0 1 0 0 0  0 0 0 0 1", result: "plmul" });
  const addL = svgEl("feColorMatrix", { in: "pml", type: "matrix", values: "1 0 0 0 0  1 0 0 0 0  1 0 0 0 0  0 0 0 0 1", result: "pladd" });
  const opacity = svgEl("feComposite", { in: "plit", in2: "SourceGraphic", operator: "arithmetic", k1: "0", k4: "0" });
  filter.append(
    mr, mg, mb, ml, blur, opaque, noise, noiseO, maskL, noiseM, jitter,
    dR, oR, dG, oG, dB, oB,
    svgEl("feBlend", { in: "pcr", in2: "pcg", mode: "screen", result: "prg" }),
    svgEl("feBlend", { in: "prg", in2: "pcb", mode: "screen", result: "prgb" }),
    grade, mulL, addL,
    svgEl("feComposite", { in: "pgraded", in2: "plmul", operator: "arithmetic", k1: "1.1", k2: "0", k3: "0", k4: "0", result: "pmul" }),
    svgEl("feComposite", { in: "pmul", in2: "pladd", operator: "arithmetic", k1: "0", k2: "1", k3: "1", k4: "0", result: "plit" }),
    opacity,
    svgEl("feColorMatrix", { type: "matrix", values: "1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0 1" }),
  );
  svg.append(filter);
  document.body.append(svg);
  panelSvg = svg as unknown as SVGSVGElement;
  panelFilter = filter; panelMapR = mr; panelMapG = mg; panelMapB = mb; panelMapL = ml;
  panelBlur = blur; panelJitter = jitter; panelGrade = grade; panelOpacity = opacity;
  panelDisps = [dR, dG, dB];
}

async function rebakePanelLens() {
  if (!panel || panel.hidden || !panelFilter) return;
  const W = panel.offsetWidth;
  const H = panel.offsetHeight;
  if (W < 40 || H < 20) return;
  const s = getGlass();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const key = `${W}x${H}@${dpr}|${s.cornerRadius},${s.zRadius},${s.refraction},${s.chromAberration},${s.edgeHighlight},${s.specular},${s.fresnel},${s.bevelMode}`;
  if (key === panelBaked) {
    applyPanelCheap(s, dpr);
    return;
  }
  panelBaked = key;
  const mine = ++panelBakeRun;
  const m = await bake(W, H, s, dpr);
  if (mine !== panelBakeRun || !panelFilter) return;
  panelUrls.forEach((u) => u.startsWith("blob:") && URL.revokeObjectURL(u));
  panelUrls = [m.r, m.g, m.b, m.light];
  panelMapR!.setAttribute("href", m.r); panelMapG!.setAttribute("href", m.g);
  panelMapB!.setAttribute("href", m.b); panelMapL!.setAttribute("href", m.light);
  for (const d of panelDisps) d.setAttribute("scale", String(m.scale));
  for (const e of [panelFilter, panelMapR!, panelMapG!, panelMapB!, panelMapL!]) {
    e.setAttribute("width", String(W)); e.setAttribute("height", String(H));
  }
  applyPanelCheap(s, dpr);
  panel!.style.setProperty("-webkit-backdrop-filter", "url(#gpanel-lens)");
  panel!.style.setProperty("backdrop-filter", "url(#gpanel-lens)");
}

function applyPanelCheap(s: ReturnType<typeof getGlass>, dpr: number) {
  if (!panelBlur || !panelGrade || !panelOpacity || !panelJitter) return;
  panelBlur.setAttribute("stdDeviation", ((s.blurAmount * 10.35) / dpr).toFixed(2));
  panelJitter.setAttribute("scale", ((s.distortion * 9.6) / dpr).toFixed(2));
  const b = 1 + s.brightness, t = 1 + s.saturation;
  const lr = 0.299 * (1 - t), lg = 0.587 * (1 - t), lb = 0.114 * (1 - t);
  const m = [[lr + t, lg, lb],[lr, lg + t, lb],[lr, lg, lb + t]]
    .map((row) => `${row.map((v) => (v * b).toFixed(4)).join(" ")} 0 0`).join("  ");
  panelGrade.setAttribute("values", `${m}  0 0 0 1 0`);
  panelOpacity.setAttribute("k2", String(s.opacity));
  panelOpacity.setAttribute("k3", String(1 - s.opacity));
}

const fmt = (v: number, step: number) => (step >= 1 ? String(Math.round(v)) : String(+v.toFixed(3)));

function build(): HTMLElement {
  const el = document.createElement("div");
  el.className = "gpanel";
  el.id = "glass-panel";
  el.setAttribute("role", "dialog");
  el.setAttribute("aria-label", "Liquid glass settings");
  el.hidden = true;

  const presets = (Object.keys(PRESETS) as PresetName[])
    .map((p) => `<button type="button" class="gpanel-preset" data-preset="${p}" aria-pressed="false">${PRESET_LABELS[p]}</button>`)
    .join("");
  const rows = CONTROLS.map(
    (c) => `<div class="gpanel-row">
      <label for="g-${c.key}">${c.label}</label>
      <input id="g-${c.key}" type="range" data-key="${c.key}" min="${c.min}" max="${c.max}" step="${c.step}" />
      <output for="g-${c.key}" data-out="${c.key}"></output>
    </div>`,
  ).join("");
  el.innerHTML = `
    <div class="gpanel-head">
      <div>
        <p class="gpanel-title">Liquid glass</p>
        <p class="gpanel-sub">Nav glass everywhere · every card in glass mode</p>
      </div>
      <button type="button" class="gpanel-close" aria-label="Close glass settings">
        <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
      </button>
    </div>
    <div class="gpanel-presets" role="group" aria-label="Glass style">${presets}</div>
    <div class="gpanel-rows">${rows}</div>
    <div class="gpanel-foot">
      <span class="gpanel-state" aria-live="polite"></span>
      <button type="button" class="gpanel-reset">Reset to Clear</button>
    </div>`;

  el.addEventListener("input", (ev) => {
    const t = ev.target as HTMLInputElement;
    if (t.dataset.key) setGlass({ [t.dataset.key]: Number(t.value) });
  });
  el.addEventListener("click", (ev) => {
    const t = (ev.target as HTMLElement).closest("button");
    if (!t) return;
    if (t.dataset.preset) usePreset(t.dataset.preset as PresetName);
    else if (t.classList.contains("gpanel-reset")) usePreset("clear");
    else if (t.classList.contains("gpanel-close")) closeGlassPanel(true);
  });
  el.addEventListener("keydown", (ev) => {
    if (ev.key === "Escape") {
      ev.stopPropagation();
      closeGlassPanel(true);
    }
  });
  document.body.append(el);
  if (!panelSvg) buildPanelFilter();
  onGlass(sync);
  onGlass(() => { panelBaked = ""; void rebakePanelLens(); });
  return el;
}

function sync() {
  if (!panel) return;
  const s = getGlass();
  for (const c of CONTROLS) {
    const input = panel.querySelector<HTMLInputElement>(`input[data-key="${c.key}"]`)!;
    if (document.activeElement !== input) input.value = String(s[c.key]);
    panel.querySelector<HTMLOutputElement>(`output[data-out="${c.key}"]`)!.textContent = fmt(s[c.key], c.step);
  }
  const preset = getPreset();
  panel.querySelectorAll<HTMLButtonElement>("[data-preset]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.preset === preset)));
  panel.querySelector(".gpanel-state")!.textContent = preset === "custom" ? "Custom" : `${PRESET_LABELS[preset]} preset`;
}

function place() {
  if (!panel || !anchor) return;
  const r = anchor.getBoundingClientRect();
  const w = panel.offsetWidth;
  const left = Math.min(Math.max(12, r.right - w), innerWidth - w - 12);
  panel.style.left = `${Math.round(left)}px`;
  panel.style.top = `${Math.round(r.bottom + 12)}px`;
}

function onOutside(ev: PointerEvent) {
  if (!panel || panel.hidden) return;
  const t = ev.target as Node;
  if (panel.contains(t) || anchor?.contains(t)) return;
  closeGlassPanel(false);
}
function onEsc(ev: KeyboardEvent) {
  if (ev.key === "Escape") closeGlassPanel(true);
}

export function isGlassPanelOpen() {
  return !!panel && !panel.hidden;
}

export function openGlassPanel(from: HTMLElement, focus = false) {
  panel ??= build();
  anchor = from;
  sync();
  panel.hidden = false;
  place();
  requestAnimationFrame(() => {
    panel?.classList.add("is-open");
    void rebakePanelLens();
  });
  from.setAttribute("aria-expanded", "true");
  addEventListener("resize", place);
  addEventListener("scroll", place, { passive: true });
  document.addEventListener("pointerdown", onOutside, true);
  document.addEventListener("keydown", onEsc);
  if (focus) panel.querySelector<HTMLElement>(".gpanel-preset[aria-pressed='true'], .gpanel-preset")?.focus();
}

export function closeGlassPanel(returnFocus: boolean) {
  if (!panel || panel.hidden) return;
  panel.classList.remove("is-open");
  panel.hidden = true;
  anchor?.setAttribute("aria-expanded", "false");
  removeEventListener("resize", place);
  removeEventListener("scroll", place);
  document.removeEventListener("pointerdown", onOutside, true);
  document.removeEventListener("keydown", onEsc);
  if (returnFocus) anchor?.focus();
}
