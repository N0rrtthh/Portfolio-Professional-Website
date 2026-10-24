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

let panel: HTMLElement | null = null;
let anchor: HTMLElement | null = null;

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
  onGlass(sync);
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
  requestAnimationFrame(() => panel?.classList.add("is-open"));
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
