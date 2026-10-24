/* ══════════════════════════════════════════════════════════
   LIQUID GLASS MODE — real refraction via @ybouane/liquidglass
   ──────────────────────────────────────────────────────────
   Loaded on demand (dynamic import) only while glass mode is on, so the
   default site never downloads it.

   How it fits a long scrolling page — the library needs its glass
   elements to be direct children of one root, and re-renders every glass
   that moves:

   · A document-sized BACK stage (behind all content) holds one glass
     plate per card at the card's document position, plus the gradient
     canvas fixed to the viewport. Plates scroll with their cards, so the
     library only re-renders the on-screen ones when the gradient repaints.
   · The nav is not part of this: it refracts the live page through an
     SVG backdrop filter instead (scripts/lens.ts), in every mode.
   · The real elements above the plates turn transparent, so their text
     and icons stay razor-sharp on top of the refraction.

   If WebGL or the library fails, everything stays on the CSS glass.
   ══════════════════════════════════════════════════════════ */
import { LiquidGlass } from "../vendor/liquidglass/index.js";
import { getGlass, onGlass } from "./glass-config";

/* Settings are shared with the nav lens and edited live from the glass
   panel (glass-config.ts). */

/* Fox palette: cream → peach → fox orange → rust. No rainbow. */
type Blob = { c: string; a: number; r: number; x: number; y: number; fx: number; fy: number; ph: number };
const PALETTE = {
  light: {
    base: ["#fbf8f5", "#f3eee9"],
    blobs: [
      { c: "242,101,34", a: 0.36, r: 0.42, x: 0.14, y: 0.22, fx: 0.07, fy: 0.05, ph: 0 },
      { c: "255,158,110", a: 0.32, r: 0.5, x: 0.86, y: 0.18, fx: 0.05, fy: 0.08, ph: 1.7 },
      { c: "194,65,12", a: 0.16, r: 0.36, x: 0.4, y: 0.78, fx: 0.08, fy: 0.06, ph: 4.4 },
      { c: "251,248,245", a: 0.85, r: 0.46, x: 0.62, y: 0.52, fx: 0.06, fy: 0.04, ph: 3.1 },
      { c: "38,34,32", a: 0.07, r: 0.5, x: 0.92, y: 0.92, fx: 0.04, fy: 0.07, ph: 5.6 },
    ] as Blob[],
  },
  dark: {
    base: ["#0d0d0e", "#140e0b"],
    blobs: [
      { c: "194,65,12", a: 0.42, r: 0.5, x: 0.18, y: 0.2, fx: 0.07, fy: 0.05, ph: 0 },
      { c: "240,90,34", a: 0.26, r: 0.38, x: 0.82, y: 0.3, fx: 0.05, fy: 0.08, ph: 1.7 },
      { c: "110,36,10", a: 0.45, r: 0.55, x: 0.55, y: 0.85, fx: 0.06, fy: 0.04, ph: 3.1 },
      { c: "255,138,76", a: 0.14, r: 0.32, x: 0.35, y: 0.6, fx: 0.08, fy: 0.06, ph: 4.4 },
      { c: "18,16,15", a: 0.85, r: 0.55, x: 0.7, y: 0.05, fx: 0.04, fy: 0.07, ph: 5.6 },
    ] as Blob[],
  },
};

const CARD_TARGETS = ".sheet, .proj, .cert, .skill-table, .gh, .stat, .cta";
const html = document.documentElement;

function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls: string, css: string) {
  const e = document.createElement(tag);
  e.className = cls;
  e.style.cssText = css;
  return e;
}

export async function startLiquid(): Promise<() => void> {
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ── Stages ─────────────────────────────────────────────────
     BACK spans the whole document (html is position:relative in glass
     mode), so each card's plate sits at fixed document coordinates and
     scrolls with its card: plates never move relative to the library's
     root, so scrolling alone re-renders nothing. The gradient canvas is
     position:fixed inside it, so it stays put like a wallpaper. */
  const back = el("div", "lg-stage lg-back", "position:absolute;inset:0;z-index:-1;pointer-events:none;");
  back.setAttribute("aria-hidden", "true");
  // The canvas reaches 60vh past both viewport edges: cards about to scroll
  // in are already rendered against real colour, so a fast fling never
  // shows a plate's blank first render.
  const OVER = 0.6;
  const bgBack = el("canvas", "lg-bg", `position:fixed;z-index:0;left:0;width:100%;top:-${OVER * 100}vh;height:${(1 + OVER * 2) * 100}vh;`);
  back.append(bgBack);

  const targets = Array.from(document.querySelectorAll<HTMLElement>(CARD_TARGETS));
  // z-index:1 makes each plate its own stacking context: the library paints
  // its output canvas at z-index:-1, which would otherwise drop below the
  // gradient canvas.
  const plateCss = "position:absolute;z-index:1;left:-4000px;top:0;width:10px;height:10px;";
  const plates = targets.map(() => el("div", "lg-plate", plateCss));
  back.append(...plates);
  document.body.prepend(back);

  /* ── Gradient painter (low-res, smooth when scaled) ───────── */
  const g1 = bgBack.getContext("2d")!;
  let back$: LiquidGlass | null = null;
  const size = () => {
    const w = Math.max(160, Math.ceil(innerWidth / 6));
    const h = Math.max(120, Math.ceil((innerHeight * (1 + OVER * 2)) / 6));
    if (bgBack.width !== w || bgBack.height !== h) {
      bgBack.width = w;
      bgBack.height = h;
    }
  };
  const paint = (t: number) => {
    const w = bgBack.width;
    const h = bgBack.height;
    const pal = html.dataset.theme === "dark" ? PALETTE.dark : PALETTE.light;
    const lg = g1.createLinearGradient(0, 0, w, h);
    lg.addColorStop(0, pal.base[0]);
    lg.addColorStop(1, pal.base[1]);
    g1.globalCompositeOperation = "source-over";
    g1.fillStyle = lg;
    g1.fillRect(0, 0, w, h);
    // Blobs are laid out over the visible band (the middle of the canvas).
    const vh = h / (1 + OVER * 2);
    const m = Math.max(w, vh);
    for (const b of pal.blobs) {
      const x = (b.x + Math.sin(t * b.fx + b.ph) * 0.18) * w;
      const y = OVER * vh + (b.y + Math.cos(t * b.fy + b.ph * 1.3) * 0.16) * vh;
      const r = b.r * m * (1 + Math.sin(t * 0.05 + b.ph) * 0.12);
      const rg = g1.createRadialGradient(x, y, 0, x, y, r);
      rg.addColorStop(0, `rgba(${b.c},${b.a})`);
      rg.addColorStop(0.45, `rgba(${b.c},${b.a * 0.45})`);
      rg.addColorStop(1, `rgba(${b.c},0)`);
      g1.fillStyle = rg;
      g1.fillRect(0, 0, w, h);
    }
    // Only glasses overlapping the (fixed, on-screen) canvas re-render —
    // i.e. just the cards currently in view.
    back$?.markChanged(bgBack);
  };
  size();
  paint(0);

  /* ── Plate geometry ─────────────────────────────────────────
     Sizes come from the LAYOUT box (offsetWidth/Height), never from a
     transformed rect: the library keeps a GPU framebuffer per distinct
     glass size, so sizes that change every frame would allocate buffers
     every frame. Styles are written only when they actually change. */
  const applyConfig = (plate: HTMLElement, w: number, h: number) => {
    const cfg = {
      ...getGlass(),
      cornerRadius: Math.round(Math.min(getGlass().cornerRadius, h / 2, w / 2)),
    };
    const json = JSON.stringify(cfg);
    if (plate.dataset.config !== json) plate.dataset.config = json;
  };
  const setBox = (plate: HTMLElement, x: number, y: number, w: number, h: number) => {
    const st = plate.style;
    const L = `${Math.round(x)}px`;
    const T = `${Math.round(y)}px`;
    const W = `${w}px`;
    const H = `${h}px`;
    if (st.left !== L) st.left = L;
    if (st.top !== T) st.top = T;
    if (st.width !== W) st.width = W;
    if (st.height !== H) st.height = H;
  };

  /* A card gets its plate once its reveal animation has finished (so the
     glass never sits at the final spot while the card is still sliding in). */
  const revealedAt = new WeakMap<Element, number>();
  const settled = (e: HTMLElement, now: number) => {
    const rev = e.closest(".reveal");
    if (!rev) return true;
    if (!rev.classList.contains("is-in")) return false;
    let t = revealedAt.get(rev);
    if (t === undefined) {
      t = now;
      revealedAt.set(rev, t);
    }
    return now - t > 1250;
  };

  const syncCards = () => {
    const now = performance.now();
    targets.forEach((card, i) => {
      const plate = plates[i];
      if (!settled(card, now) || card.offsetWidth < 1) {
        if (plate.style.left !== "-4000px") plate.style.left = "-4000px";
        card.classList.remove("lg-backed");
        return;
      }
      const r = card.getBoundingClientRect();
      const w = card.offsetWidth;
      const h = card.offsetHeight;
      setBox(plate, r.left + scrollX + (r.width - w) / 2, r.top + scrollY + (r.height - h) / 2, w, h);
      applyConfig(plate, w, h);
      card.classList.add("lg-backed");
    });
  };

  /* ── Re-measure cards only when layout can have moved them (resize,
        content height changes, reveals) — never per scroll frame. */
  let pending = 0;
  const scheduleCards = (delay = 0) => {
    clearTimeout(pending);
    pending = window.setTimeout(syncCards, delay);
  };
  const ro = new ResizeObserver(() => scheduleCards(50));
  ro.observe(document.body);
  const revealObs = new MutationObserver(() => scheduleCards(1300));
  document.querySelectorAll(".reveal").forEach((n) => revealObs.observe(n, { attributes: true, attributeFilter: ["class"] }));
  const safety = window.setInterval(syncCards, 2000);

  /* ── Loop: the gradient at ~24fps (none with reduced motion). */
  let raf = 0;
  let lastPaint = 0;
  const start = performance.now();
  const loop = (now: number) => {
    if (now - lastPaint > 41) {
      lastPaint = now;
      paint((now - start) / 1000);
    }
    raf = requestAnimationFrame(loop);
  };
  const onResize = () => {
    size();
    paint((performance.now() - start) / 1000);
    scheduleCards(80);
  };
  addEventListener("resize", onResize);
  // Panel edits: the library re-renders a plate when its data-config changes.
  const offGlass = onGlass(() => syncCards());
  const themeObs = new MutationObserver(() => paint((performance.now() - start) / 1000));
  themeObs.observe(html, { attributes: true, attributeFilter: ["data-theme"] });

  syncCards();
  try {
    back$ = await LiquidGlass.init({ root: back, glassElements: plates, defaults: getGlass() });
    html.classList.add("lg-live");
  } catch (err) {
    console.warn("[glass] WebGL glass unavailable — using CSS glass", err);
    targets.forEach((c) => c.classList.remove("lg-backed"));
  }
  if (!reduced) raf = requestAnimationFrame(loop);

  return () => {
    cancelAnimationFrame(raf);
    clearTimeout(pending);
    clearInterval(safety);
    ro.disconnect();
    revealObs.disconnect();
    removeEventListener("resize", onResize);
    themeObs.disconnect();
    offGlass();
    back$?.destroy();
    back.remove();
    targets.forEach((c) => c.classList.remove("lg-backed"));
    html.classList.remove("lg-live");
  };
}
