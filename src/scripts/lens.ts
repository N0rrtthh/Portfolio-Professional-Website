/* ══════════════════════════════════════════════════════════
   NAV LENS — live liquid-glass refraction for the nav pill
   ──────────────────────────────────────────────────────────
   The WebGL library can only refract canvases it owns, not the live page,
   so the nav uses the browser's own compositor instead: an SVG filter
   applied as `backdrop-filter: url(#nav-lens)`. It bends whatever is
   scrolling underneath — text, photos, cards — at the glass rim, with a
   red/blue split for chromatic aberration.

   The displacement map is a rounded-rect "bevel": neutral in the flat
   middle, pulling the backdrop inward along a convex curve towards the
   rim. It is drawn on a small canvas at half resolution and rebuilt only
   when the pill changes size (the bar → pill morph, resizes).

   Chromium only (html.liquid-ok). Other browsers keep the CSS frosted glass.
   ══════════════════════════════════════════════════════════ */

/* The playground's clear-glass settings (refraction 0.82, chromatic
   aberration 0.155, blur 0.14), with the bevel scaled to a 54px pill: the
   reference z-radius of 36 would curve the whole height, warping the middle
   too — the rim band keeps the centre flat and readable, like iOS. */
const LENS = { refraction: 0.82, chromAberration: 0.155, bevel: 15, blur: 1.8 };
const NS = "http://www.w3.org/2000/svg";
const SCALE = 2; // map resolution: 1 map pixel per 2 CSS px (it is smooth)

function svgEl<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string>) {
  const e = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  return e;
}

/** Bevel displacement map for a W×H rounded rect with corner radius R. */
function bevelMap(W: number, H: number, R: number, B: number): string {
  const w = Math.ceil(W / SCALE);
  const h = Math.ceil(H / SCALE);
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const g = c.getContext("2d")!;
  const img = g.createImageData(w, h);
  const d = img.data;
  const hw = W / 2;
  const hh = H / 2;
  for (let j = 0; j < h; j++) {
    const y = (j + 0.5) * SCALE - hh;
    for (let i = 0; i < w; i++) {
      const x = (i + 0.5) * SCALE - hw;
      // Signed distance to the rounded rect (negative inside).
      const qx = Math.abs(x) - (hw - R);
      const qy = Math.abs(y) - (hh - R);
      const mx = Math.max(qx, 0);
      const my = Math.max(qy, 0);
      const inside = R - Math.hypot(mx, my) - Math.min(Math.max(qx, qy), 0);
      let nx = 0;
      let ny = 0;
      let m = 0;
      if (inside >= 0 && inside < B) {
        // Outward normal: radial in the corners, axis-aligned on the sides.
        if (mx > 0 || my > 0) {
          const L = Math.hypot(mx, my);
          nx = mx / L;
          ny = my / L;
        } else if (qx > qy) nx = 1;
        else ny = 1;
        nx *= x < 0 ? -1 : 1;
        ny *= y < 0 ? -1 : 1;
        // Convex (circular) profile: flat inside, steepest at the rim.
        const t = 1 - inside / B;
        m = 1 - Math.sqrt(1 - t * t);
      }
      const k = (j * w + i) * 4;
      d[k] = 128 - nx * m * 127;
      d[k + 1] = 128 - ny * m * 127;
      d[k + 2] = 128;
      d[k + 3] = 255;
    }
  }
  g.putImageData(img, 0, 0);
  return c.toDataURL();
}

export function initNavLens(): void {
  const html = document.documentElement;
  const nav = document.querySelector<HTMLElement>(".nav");
  const inner = nav?.querySelector<HTMLElement>(".nav-inner");
  if (!nav || !inner || !html.classList.contains("liquid-ok")) return;

  /* One filter, built once; only its size and map change later. */
  const svg = svgEl("svg", { width: "0", height: "0", "aria-hidden": "true", focusable: "false" });
  svg.style.cssText = "position:absolute;width:0;height:0;overflow:hidden";
  const filter = svgEl("filter", {
    id: "nav-lens",
    x: "0",
    y: "0",
    filterUnits: "userSpaceOnUse",
    "color-interpolation-filters": "sRGB",
  });
  const map = svgEl("feImage", { x: "0", y: "0", preserveAspectRatio: "none", result: "map" });
  const channel = (n: string, matrix: string) => {
    const disp = svgEl("feDisplacementMap", {
      in: "SourceGraphic",
      in2: "map",
      xChannelSelector: "R",
      yChannelSelector: "G",
      result: `d${n}`,
    });
    const only = svgEl("feColorMatrix", { in: `d${n}`, type: "matrix", values: matrix, result: `c${n}` });
    filter.append(disp, only);
    return disp;
  };
  filter.append(map);
  const red = channel("r", "1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0");
  const green = channel("g", "0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0");
  const blue = channel("b", "0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0");
  filter.append(
    svgEl("feBlend", { in: "cr", in2: "cg", mode: "screen", result: "rg" }),
    svgEl("feBlend", { in: "rg", in2: "cb", mode: "screen", result: "rgb" }),
    svgEl("feGaussianBlur", { in: "rgb", stdDeviation: String(LENS.blur) }),
  );
  svg.append(filter);
  document.body.append(svg);

  let key = "";
  const build = () => {
    // The bar at the very top sits over plain page background: no lens.
    if (!nav.classList.contains("is-scrolled")) return;
    const W = inner.offsetWidth;
    const H = inner.offsetHeight;
    if (W < 40 || H < 20) return;
    const R = Math.min(parseFloat(getComputedStyle(inner).borderTopLeftRadius) || 0, H / 2, W / 2);
    const next = `${W}x${H}r${Math.round(R)}`;
    if (next === key) return;
    key = next;
    const B = Math.min(LENS.bevel, H * 0.3);
    for (const e of [filter, map]) {
      e.setAttribute("width", String(W));
      e.setAttribute("height", String(H));
    }
    map.setAttribute("href", bevelMap(W, H, R, B));
    // feDisplacementMap moves by scale × (value − 0.5): ±B·refraction px at
    // the rim, red bent a little more than green, blue a little less.
    const S = 2 * B * LENS.refraction;
    const ca = LENS.chromAberration / 2;
    red.setAttribute("scale", (S * (1 + ca)).toFixed(1));
    green.setAttribute("scale", S.toFixed(1));
    blue.setAttribute("scale", (S * (1 - ca)).toFixed(1));
    html.classList.add("lens-on");
  };

  let queued = false;
  const schedule = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      build();
    });
  };
  new ResizeObserver(schedule).observe(inner);
  new MutationObserver(schedule).observe(nav, { attributes: true, attributeFilter: ["class"] });
  schedule();
}
