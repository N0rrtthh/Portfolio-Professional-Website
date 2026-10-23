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
   · A fixed FRONT stage sits just under the nav with its own plate that
     follows the nav bar → pill. Its copy of the gradient is clipped to
     nothing on screen (the library still samples its pixels), so page
     content never gets covered.
   · The real elements above the plates turn transparent, so their text
     and icons stay razor-sharp on top of the refraction.

   If WebGL or the library fails, everything stays on the CSS glass.
   ══════════════════════════════════════════════════════════ */
import { LiquidGlass } from "../vendor/liquidglass/index.js";

/* The settings from the reference playground ("clear glass"). */
const SETTINGS = {
  blurAmount: 0.14,
  refraction: 0.82,
  chromAberration: 0.155,
  edgeHighlight: 0.05,
  specular: 0.25,
  fresnel: 0.48,
  distortion: 0.49,
  cornerRadius: 40,
  zRadius: 36,
  opacity: 1,
  saturation: 0.44,
  brightness: 0.1,
  shadowOpacity: 0.21,
  shadowSpread: 12,
  bevelMode: 0,
};

/* Fox palette: cream → peach → fox orange → rust. No rainbow. */
type Blob = { c: string; a: number; r: number; x: number; y: number; fx: number; fy: number; ph: number };
const PALETTE = {
  light: {
    base: ["#fbf3ec", "#fde7d6"],
    blobs: [
      { c: "255,138,76", a: 0.75, r: 0.55, x: 0.18, y: 0.2, fx: 0.07, fy: 0.05, ph: 0 },
      { c: "240,90,34", a: 0.55, r: 0.42, x: 0.82, y: 0.3, fx: 0.05, fy: 0.08, ph: 1.7 },
      { c: "255,196,150", a: 0.85, r: 0.6, x: 0.55, y: 0.85, fx: 0.06, fy: 0.04, ph: 3.1 },
      { c: "194,65,12", a: 0.32, r: 0.38, x: 0.35, y: 0.6, fx: 0.08, fy: 0.06, ph: 4.4 },
      { c: "255,224,200", a: 0.9, r: 0.5, x: 0.7, y: 0.05, fx: 0.04, fy: 0.07, ph: 5.6 },
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

/* Nav-only backdrop for the normal light/dark site: the page's own paper
   or ink with a faint fox-orange warmth, painted once (static, so the nav
   glass costs nothing while idle). */
const NAV_PALETTE = {
  light: {
    base: ["#ffffff", "#f8f6f2"],
    blobs: [
      { c: "255,138,76", a: 0.1, r: 0.5, x: 0.12, y: 0.08, fx: 0, fy: 0, ph: 0 },
      { c: "240,90,34", a: 0.06, r: 0.4, x: 0.88, y: 0.05, fx: 0, fy: 0, ph: 0 },
    ] as Blob[],
  },
  dark: {
    base: ["#1c1d21", "#1a1a1d"],
    blobs: [
      { c: "240,90,34", a: 0.06, r: 0.5, x: 0.12, y: 0.08, fx: 0, fy: 0, ph: 0 },
      { c: "194,65,12", a: 0.04, r: 0.4, x: 0.88, y: 0.05, fx: 0, fy: 0, ph: 0 },
    ] as Blob[],
  },
};
/* Over a near-flat backdrop the playground's colour fringe and lift read as
   a coloured line and a muddy band (most visibly on dark), so the nav-only
   mode trims just those; everything else keeps the reference settings. */
const NAV_TUNE = {
  light: { chromAberration: 0.06 },
  dark: { chromAberration: 0.03, brightness: 0.02, saturation: 0.2 },
};

/**
 * mode "full": glass mode — every card plus the nav, over the drifting
 *              fox-orange gradient.
 * mode "nav":  the normal light/dark site — only the nav bar/pill gets the
 *              liquid glass, over a static, theme-matched backdrop.
 */
export async function startLiquid(mode: "full" | "nav" = "full"): Promise<() => void> {
  const full = mode === "full";
  // Nav-only mode paints once (theme flips repaint): no idle GPU work.
  const reduced = !full || matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ── Stages ─────────────────────────────────────────────────
     BACK spans the whole document (html is position:relative in glass
     mode), so each card's plate sits at fixed document coordinates and
     scrolls with its card: plates never move relative to the library's
     root, so scrolling alone re-renders nothing. The gradient canvas is
     position:fixed inside it, so it stays put like a wallpaper.
     FRONT is a fixed layer just under the nav for the nav's own plate. */
  const back = el("div", "lg-stage lg-back", "position:absolute;inset:0;z-index:-1;pointer-events:none;");
  const front = el("div", "lg-stage lg-front", "position:fixed;inset:0;z-index:49;pointer-events:none;");
  back.setAttribute("aria-hidden", "true");
  front.setAttribute("aria-hidden", "true");
  const bgBack = el("canvas", "lg-bg", "position:fixed;z-index:0;inset:0;width:100%;height:100%;");
  // Sampled by the library, never seen: clipped away so content stays visible.
  const bgFront = el("canvas", "lg-bg", "position:absolute;inset:0;width:100%;height:100%;clip-path:inset(50%);");
  back.append(bgBack);
  front.append(bgFront);

  const targets = full ? Array.from(document.querySelectorAll<HTMLElement>(CARD_TARGETS)) : [];
  // z-index:1 makes each plate its own stacking context: the library paints
  // its output canvas at z-index:-1, which would otherwise drop below the
  // gradient canvas.
  const plateCss = "position:absolute;z-index:1;left:-4000px;top:0;width:10px;height:10px;";
  const plates = targets.map(() => el("div", "lg-plate", plateCss));
  back.append(...plates);
  const navPlate = el("div", "lg-plate", "position:absolute;z-index:1;left:0;top:0;width:10px;height:10px;");
  front.append(navPlate);
  if (full) document.body.prepend(back);
  document.body.append(front);

  /* ── Gradient painter (low-res, smooth when scaled) ───────── */
  const g1 = bgBack.getContext("2d")!;
  const g2 = bgFront.getContext("2d")!;
  let back$: LiquidGlass | null = null;
  let front$: LiquidGlass | null = null;
  const size = () => {
    const w = Math.max(160, Math.ceil(innerWidth / 6));
    const h = Math.max(120, Math.ceil(innerHeight / 6));
    for (const c of [bgBack, bgFront]) {
      if (c.width !== w || c.height !== h) {
        c.width = w;
        c.height = h;
      }
    }
  };
  const paint = (t: number) => {
    const w = bgBack.width;
    const h = bgBack.height;
    const set = full ? PALETTE : NAV_PALETTE;
    const pal = html.dataset.theme === "dark" ? set.dark : set.light;
    const lg = g1.createLinearGradient(0, 0, w, h);
    lg.addColorStop(0, pal.base[0]);
    lg.addColorStop(1, pal.base[1]);
    g1.globalCompositeOperation = "source-over";
    g1.fillStyle = lg;
    g1.fillRect(0, 0, w, h);
    const m = Math.max(w, h);
    for (const b of pal.blobs) {
      const x = (b.x + Math.sin(t * b.fx + b.ph) * 0.18) * w;
      const y = (b.y + Math.cos(t * b.fy + b.ph * 1.3) * 0.16) * h;
      const r = b.r * m * (1 + Math.sin(t * 0.05 + b.ph) * 0.12);
      const rg = g1.createRadialGradient(x, y, 0, x, y, r);
      rg.addColorStop(0, `rgba(${b.c},${b.a})`);
      rg.addColorStop(0.45, `rgba(${b.c},${b.a * 0.45})`);
      rg.addColorStop(1, `rgba(${b.c},0)`);
      g1.fillStyle = rg;
      g1.fillRect(0, 0, w, h);
    }
    g2.drawImage(bgBack, 0, 0);
    // Only glasses overlapping the (fixed, on-screen) canvas re-render —
    // i.e. just the cards currently in view.
    back$?.markChanged(bgBack);
    front$?.markChanged(bgFront);
  };
  size();
  paint(0);

  /* ── Plate geometry ─────────────────────────────────────────
     Sizes come from the LAYOUT box (offsetWidth/Height), never from a
     transformed rect: the library keeps a GPU framebuffer per distinct
     glass size, so sizes that change every frame would allocate buffers
     every frame. Styles are written only when they actually change. */
  const applyConfig = (plate: HTMLElement, w: number, h: number, radius: number, tune: object = {}) => {
    const cfg = {
      ...SETTINGS,
      ...tune,
      cornerRadius: Math.round(Math.min(radius, h / 2, w / 2)),
      zRadius: Math.round(Math.min(SETTINGS.zRadius, h / 2 - 2)),
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
  const radiusOf = new WeakMap<Element, number>();
  const radius = (e: HTMLElement) => {
    let r = radiusOf.get(e);
    if (r === undefined) {
      r = parseFloat(getComputedStyle(e).borderTopLeftRadius) || 0;
      radiusOf.set(e, r);
    }
    return r;
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
      applyConfig(plate, w, h, radius(card));
      card.classList.add("lg-backed");
    });
  };

  const navInner = document.querySelector<HTMLElement>(".nav .nav-inner");
  const syncNav = () => {
    if (!navInner) return;
    const r = navInner.getBoundingClientRect();
    // The bar → pill morph animates the size; 48px buckets keep it to a
    // handful of framebuffer sizes.
    const w = Math.max(48, Math.round(r.width / 48) * 48);
    const h = Math.max(6, Math.round(r.height / 6) * 6);
    setBox(navPlate, r.left + (r.width - w) / 2, r.top + (r.height - h) / 2, w, h);
    const tune = full ? {} : NAV_TUNE[html.dataset.theme === "dark" ? "dark" : "light"];
    applyConfig(navPlate, w, h, parseFloat(getComputedStyle(navInner).borderTopLeftRadius) || 0, tune);
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

  /* ── Loop: the nav plate (read-only unless the bar is morphing) and
        the gradient at ~24fps. */
  let raf = 0;
  let lastPaint = 0;
  const start = performance.now();
  const loop = (now: number) => {
    syncNav();
    if (!reduced && now - lastPaint > 41) {
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
  const themeObs = new MutationObserver(() => paint((performance.now() - start) / 1000));
  themeObs.observe(html, { attributes: true, attributeFilter: ["data-theme"] });

  syncCards();
  syncNav();
  try {
    [back$, front$] = await Promise.all([
      full ? LiquidGlass.init({ root: back, glassElements: plates, defaults: SETTINGS }) : Promise.resolve(null),
      LiquidGlass.init({ root: front, glassElements: [navPlate], defaults: SETTINGS }),
    ]);
    html.classList.add("lg-nav-live");
    if (full) html.classList.add("lg-live");
  } catch (err) {
    console.warn("[glass] WebGL glass unavailable — using CSS glass", err);
    targets.forEach((c) => c.classList.remove("lg-backed"));
  }
  raf = requestAnimationFrame(loop);

  return () => {
    cancelAnimationFrame(raf);
    clearTimeout(pending);
    clearInterval(safety);
    ro.disconnect();
    revealObs.disconnect();
    removeEventListener("resize", onResize);
    themeObs.disconnect();
    back$?.destroy();
    front$?.destroy();
    back.remove();
    front.remove();
    targets.forEach((c) => c.classList.remove("lg-backed"));
    html.classList.remove("lg-live", "lg-nav-live");
  };
}
