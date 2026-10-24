/* ══════════════════════════════════════════════════════════
   LENS — live liquid glass for the nav bar/pill and its menu
   ──────────────────────────────────────────────────────────
   The WebGL library can only refract canvases it owns, not the live page,
   so these surfaces run the library's glass maths through the browser
   compositor instead: an SVG filter applied as `backdrop-filter: url(#…)`,
   which bends whatever is scrolling underneath.

   Every per-pixel term of the library's fragment shader (FS_GLASS) —
   bevel refraction, chromatic split, specular lights, fresnel, rim and
   inner glow — depends only on the surface's shape, so it is baked once
   into small images that the filter reads:
     · three displacement maps (red / green / blue sample offsets)
     · one light map (multiply + add terms of the shader's composite)
   Blur, brightness, saturation and opacity are native filter primitives
   with the shader's constants.

   Maps are rebuilt only when a surface settles at a new size. Chromium
   only (html.liquid-ok); other browsers keep the CSS frosted glass.
   ══════════════════════════════════════════════════════════ */
import type { GlassSettings } from "./glass-config";

const NS = "http://www.w3.org/2000/svg";

function svgEl<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string> = {}) {
  const e = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  return e;
}
const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
// Rounded-rect signed distance (negative inside), as in the shader.
const rrSDF = (px: number, py: number, bx: number, by: number, r: number) => {
  const qx = Math.abs(px) - bx + r;
  const qy = Math.abs(py) - by + r;
  return Math.min(Math.max(qx, qy), 0) + Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) - r;
};
const bevelHeight = (d: number, zR: number) => (d <= 0 ? 0 : d >= zR ? zR : Math.sqrt(d * (2 * zR - d)));

const norm3 = (x: number, y: number, z: number): [number, number, number] => {
  const l = Math.hypot(x, y, z) || 1;
  return [x / l, y / l, z / l];
};
const V: [number, number, number] = [0, 0, 1];
const half = (l: [number, number, number]) => norm3(l[0] + V[0], l[1] + V[1], l[2] + V[2]);
const H1 = half(norm3(0.4, 0.7, 1));
const H2 = half(norm3(-0.3, -0.5, 1));
const L3 = norm3(0.1, 0.3, 1);
const H4 = half(norm3(0, 0.9, 0.4));
const dot = (a: [number, number, number], b: [number, number, number]) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

type Maps = { r: string; g: string; b: string; light: string; scale: number };

type Shade = { rx: number; ry: number; cx: number; cy: number; add: number; mul: number; inside: number };

/** Bake the shader's shape-dependent terms for a W×H CSS-px panel. */
async function bake(W: number, H: number, s: GlassSettings, dpr: number): Promise<Maps> {
  // The shader works in device pixels; sample at CSS px, compute in device px.
  const k = dpr;
  const hx = (W * k) / 2;
  const hy = (H * k) / 2;
  const r = Math.min(s.cornerRadius * k, hx, hy);
  const zR = Math.max(s.zRadius * k, 0.001);
  const e = 2;
  const maxD = Math.min(hx, hy);
  const refrPow = 1 - 1 / 1.5;

  /* One fragment of FS_GLASS, minus the texture reads. */
  const shade = (px: number, py: number): Shade | null => {
    const sdf = rrSDF(px, py, hx, hy, r);
    if (sdf > 0.5) return null;
    const inside = -sdf;
    const edge = smoothstep(maxD * 0.35, 0, inside);
    const hC = bevelHeight(inside, zR);
    const gx = (bevelHeight(-rrSDF(px + e, py, hx, hy, r), zR) - bevelHeight(-rrSDF(px - e, py, hx, hy, r), zR)) / (2 * e);
    const gy = (bevelHeight(-rrSDF(px, py + e, hx, hy, r), zR) - bevelHeight(-rrSDF(px, py - e, hx, hy, r), zR)) / (2 * e);
    const N = norm3(-gx, -gy, 1);
    const depth = smoothstep(0, zR, inside);
    // Refraction (device px)
    let rx: number;
    let ry: number;
    if (s.bevelMode < 0.5) {
      // Scale by zR so displacement is proportional to bevel depth, not panel size.
      // The * 30 in the original caused full-image doubling on small panels.
      const f = refrPow * (2 + ((hC * 2) / Math.max(zR * 2, 1)) * 0.5) * s.refraction * zR * 0.18;
      rx = gx * f - (px / Math.max(hx, 1)) * s.refraction * depth * zR * 0.04;
      ry = gy * f - (py / Math.max(hy, 1)) * s.refraction * depth * zR * 0.04;
    } else {
      rx = -px * s.refraction * depth * 0.35;
      ry = -py * s.refraction * depth * 0.35;
    }
    // Chromatic aberration
    const caS = s.chromAberration * 18 * (edge * 0.7 + 0.3) * 2;
    // Lighting
    const fres = Math.pow(1 - Math.abs(N[2]), 4) * s.fresnel;
    const spec =
      (Math.pow(Math.max(dot(N, H1), 0), 90) +
        Math.pow(Math.max(dot(N, H2), 0), 50) * 0.3 +
        Math.pow(Math.max(dot(N, L3), 0), 6) * 0.1 +
        Math.pow(Math.max(dot(N, H4), 0), 120) * 0.6) *
      s.specular;
    const stroke = smoothstep(-2.5, -1.5, sdf) * (1 - smoothstep(-1, 0, sdf)) * (0.4 + 0.6 * (0.5 + 0.5 * (-py / hy)));
    const rim = edge * s.edgeHighlight * 0.22;
    const glow = smoothstep(5, 0, inside) * s.edgeHighlight * 0.15;
    const env = (N[1] * 0.5 + 0.5) * fres * 0.08;
    const F = fres * 0.2;
    return {
      rx,
      ry,
      cx: N[0] * caS,
      cy: N[1] * caS,
      add: (spec + rim + glow + stroke * s.edgeHighlight * 0.55 + env) * (1 - F) + F,
      mul: (1 + 0.06 * depth) * (1 - F),
      inside,
    };
  };

  const n = W * H;
  const offs = new Float32Array(n * 6); // r, g, b sample offsets (CSS px)
  const light = new Uint8ClampedArray(n * 4);
  let maxOff = 1;
  // The backdrop only exists inside the pill, so samples are clamped to its
  // box (the shader's CLAMP_TO_EDGE).
  const cl = (v: number, max: number) => Math.min(max - 0.5, Math.max(0.5, v));
  const put = (i: number, j: number, t: Shade | null) => {
    const idx = j * W + i;
    const L = idx * 4;
    light[L + 3] = 255;
    if (!t) {
      light[L + 1] = 232; // multiply = 1 (encoded /1.1)
      return;
    }
    const sx = i + 0.5;
    const sy = j + 0.5;
    const o = idx * 6;
    offs[o] = cl(sx + (t.rx + t.cx) / k, W) - sx;
    offs[o + 1] = cl(sy + (t.ry + t.cy) / k, H) - sy;
    offs[o + 2] = cl(sx + t.rx / k, W) - sx;
    offs[o + 3] = cl(sy + t.ry / k, H) - sy;
    offs[o + 4] = cl(sx + (t.rx - t.cx) / k, W) - sx;
    offs[o + 5] = cl(sy + (t.ry - t.cy) / k, H) - sy;
    for (let q = 0; q < 6; q++) maxOff = Math.max(maxOff, Math.abs(offs[o + q]));
    light[L] = t.add * 255;
    light[L + 1] = (t.mul / 1.1) * 255;
    // B: where micro-distortion may act (not within ~3px of the edge, where
    // its jitter would reach outside the backdrop) — used by the panel lens.
    light[L + 2] = smoothstep(1.5, 4, Math.min(sx, W - sx, sy, H - sy, t.inside / k)) * 255;
  };

  /* Only the rounded ends need the full maths. Along the straight middle
     every term depends on the row alone, except the centre-pull part of
     the x refraction, which is linear in x. */
  const end = Math.min(Math.ceil((r + 2 * e) / k) + 6, Math.floor(W / 2));
  const xOf = (i: number) => ((i + 0.5) / W) * 2 * hx - hx;
  // Yield to the browser every ~8ms so a bake never blocks a frame for long.
  let slice = performance.now();
  for (let j = 0; j < H; j++) {
    if (performance.now() - slice > 8) {
      await new Promise((go) => setTimeout(go));
      slice = performance.now();
    }
    const py = ((j + 0.5) / H) * 2 * hy - hy;
    for (let i = 0; i < end; i++) {
      put(i, j, shade(xOf(i), py));
      put(W - 1 - i, j, shade(xOf(W - 1 - i), py));
    }
    const mid = shade(0, py);
    if (!mid) {
      for (let i = end; i < W - end; i++) put(i, j, null);
      continue;
    }
    const depth = smoothstep(0, zR, mid.inside);
    const slope = s.bevelMode < 0.5 ? (-s.refraction * depth * zR * 0.04) / Math.max(hx, 1) : -s.refraction * depth * 0.35;
    const t = { ...mid };
    for (let i = end; i < W - end; i++) {
      t.rx = slope * xOf(i);
      put(i, j, t);
    }
  }

  // feDisplacementMap: offset = scale × (value − 0.5).
  const scale = Math.ceil(maxOff * 2 + 2);
  // PNG encoding happens off the main thread (toBlob).
  const encode = (data: Uint8ClampedArray) =>
    new Promise<string>((resolve) => {
      const c = document.createElement("canvas");
      c.width = W;
      c.height = H;
      c.getContext("2d")!.putImageData(new ImageData(data, W, H), 0, 0);
      c.toBlob((b) => resolve(b ? URL.createObjectURL(b) : c.toDataURL()));
    });
  const maps = [new Uint8ClampedArray(n * 4), new Uint8ClampedArray(n * 4), new Uint8ClampedArray(n * 4)];
  const f = 255 / scale;
  const yieldNow = () => new Promise((go) => setTimeout(go));
  for (let p = 0; p < n; p++) {
    if ((p & 4095) === 0 && performance.now() - slice > 8) {
      await yieldNow();
      slice = performance.now();
    }
    const o = p * 6;
    const q = p * 4;
    for (let c = 0; c < 3; c++) {
      const d = maps[c];
      d[q] = 127.5 + offs[o + c * 2] * f;
      d[q + 1] = 127.5 + offs[o + c * 2 + 1] * f;
      d[q + 2] = 128;
      d[q + 3] = 255;
    }
  }
  // One image per task, so encoding never stacks into one long task.
  const out: string[] = [];
  for (const d of [maps[0], maps[1], maps[2], light]) {
    await yieldNow();
    out.push(await encode(d));
  }
  const [mr, mg, mb, ml] = out;
  return { r: mr, g: mg, b: mb, light: ml, scale };
}

export { bake };

/* ── A lens on one element ─────────────────────────────────────
   Builds a private filter (#<id>), keeps it baked to the element's
   current size and corner radius, and reports when it is usable. The
   element's CSS applies it with `backdrop-filter: url(#<id>)` and reads
   its drop shadow from --lens-shadow. */
export type Lens = { schedule: (delay?: number) => void; ready: () => boolean };

export function createLens(el: HTMLElement, id: string, s: GlassSettings, onReady: () => void): Lens {
  const svg = svgEl("svg", { width: "0", height: "0", "aria-hidden": "true", focusable: "false" });
  svg.style.cssText = "position:absolute;width:0;height:0;overflow:hidden;pointer-events:none";
  const filter = svgEl("filter", { id, x: "0", y: "0", filterUnits: "userSpaceOnUse", "color-interpolation-filters": "sRGB" });
  const img = (result: string) => svgEl("feImage", { x: "0", y: "0", preserveAspectRatio: "none", result });
  const mapR = img("mr");
  const mapG = img("mg");
  const mapB = img("mb");
  const mapL = img("ml");
  const k = () => Math.min(window.devicePixelRatio || 1, 3);
  // Background blur: the library's 6 × separable 9-tap Gaussian passes.
  const blur = svgEl("feGaussianBlur", { in: "SourceGraphic", stdDeviation: ((s.blurAmount * 10.35) / k()).toFixed(2), result: "blurA" });
  // Un-premultiply to opaque: the blur's edge pixels keep their true colour
  // instead of fading into the empty space outside the backdrop.
  const opaque = svgEl("feColorMatrix", { in: "blurA", type: "matrix", values: "1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0 1", result: "src" });
  const disp = (map: string, out: string, matrix: string) => {
    const d = svgEl("feDisplacementMap", { in: "src", in2: map, xChannelSelector: "R", yChannelSelector: "G", result: `${out}d` });
    const only = svgEl("feColorMatrix", { in: `${out}d`, type: "matrix", values: matrix, result: out });
    return [d, only] as const;
  };
  const [dR, oR] = disp("mr", "cr", "1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0");
  const [dG, oG] = disp("mg", "cg", "0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0");
  const [dB, oB] = disp("mb", "cb", "0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0");
  // Brightness × saturation (shader luma weights), one matrix.
  const b = 1 + s.brightness;
  const t = 1 + s.saturation;
  const [lr, lg, lb] = [0.299 * (1 - t), 0.587 * (1 - t), 0.114 * (1 - t)];
  const grade = [
    [lr + t, lg, lb],
    [lr, lg + t, lb],
    [lr, lg, lb + t],
  ]
    .map((row) => `${row.map((v) => (v * b).toFixed(4)).join(" ")} 0 0`)
    .join("  ");
  filter.append(
    mapR, mapG, mapB, mapL,
    blur, opaque,
    dR, oR, dG, oG, dB, oB,
    svgEl("feBlend", { in: "cr", in2: "cg", mode: "screen", result: "rg" }),
    svgEl("feBlend", { in: "rg", in2: "cb", mode: "screen", result: "rgb" }),
    svgEl("feColorMatrix", { in: "rgb", type: "matrix", values: `${grade}  0 0 0 1 0`, result: "graded" }),
    // Light map → grey multiply (G) and add (R) layers of the shader composite.
    svgEl("feColorMatrix", { in: "ml", type: "matrix", values: "0 1 0 0 0  0 1 0 0 0  0 1 0 0 0  0 0 0 0 1", result: "lmul" }),
    svgEl("feColorMatrix", { in: "ml", type: "matrix", values: "1 0 0 0 0  1 0 0 0 0  1 0 0 0 0  0 0 0 0 1", result: "ladd" }),
    svgEl("feComposite", { in: "graded", in2: "lmul", operator: "arithmetic", k1: "1.1", k2: "0", k3: "0", k4: "0", result: "mul" }),
    svgEl("feComposite", { in: "mul", in2: "ladd", operator: "arithmetic", k1: "0", k2: "1", k3: "1", k4: "0", result: "lit" }),
    svgEl("feComposite", { in: "lit", in2: "SourceGraphic", operator: "arithmetic", k1: "0", k2: String(s.opacity), k3: String(1 - s.opacity), k4: "0" }),
    svgEl("feColorMatrix", { type: "matrix", values: "1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0 1" }),
  );
  svg.append(filter);
  document.body.append(svg);

  // Shader shadow: Gaussian falloff (σ = spread/√2) ×0.65 + contact ×0.35.
  const sp = Math.max(s.shadowSpread, 1);
  const a = s.shadowOpacity;
  el.style.setProperty(
    "--lens-shadow",
    `0 1px ${(sp * 1.414).toFixed(1)}px rgb(0 0 0 / ${(0.65 * a).toFixed(3)}), 0 1px ${(sp * 0.5).toFixed(1)}px rgb(0 0 0 / ${(0.35 * a).toFixed(3)})`,
  );

  /* Bake on settle: while the element animates (bar → pill), the current
     maps are stretched to its box; the bake runs once it holds still. */
  let baked = "";
  let isReady = false;
  let timer = 0;
  let run = 0;
  let urls: string[] = [];
  const stretch = () => {
    const W = String(el.offsetWidth);
    const H = String(el.offsetHeight);
    for (const e of [filter, mapR, mapG, mapB, mapL]) {
      e.setAttribute("width", W);
      e.setAttribute("height", H);
    }
  };
  const rebake = async () => {
    const W = el.offsetWidth;
    const H = el.offsetHeight;
    if (W < 24 || H < 16) return;
    const r = parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0;
    const key = `${W}x${H}r${Math.round(r)}@${k()}`;
    if (key === baked) return;
    baked = key;
    const mine = ++run;
    const m = await bake(W, H, { ...s, cornerRadius: r }, k());
    const fresh = [m.r, m.g, m.b, m.light];
    if (mine !== run) {
      fresh.forEach((u) => u.startsWith("blob:") && URL.revokeObjectURL(u));
      return; // a newer bake superseded this one
    }
    urls.forEach((u) => u.startsWith("blob:") && URL.revokeObjectURL(u));
    urls = fresh;
    mapR.setAttribute("href", m.r);
    mapG.setAttribute("href", m.g);
    mapB.setAttribute("href", m.b);
    mapL.setAttribute("href", m.light);
    for (const d of [dR, dG, dB]) d.setAttribute("scale", String(m.scale));
    stretch();
    if (!isReady) {
      isReady = true;
      onReady();
    }
  };
  const schedule = (delay = 160) => {
    stretch();
    clearTimeout(timer);
    timer = window.setTimeout(() => void rebake(), delay);
  };
  new ResizeObserver(() => schedule()).observe(el);
  return { schedule, ready: () => isReady };
}

/* ── Fixed glass for the nav and its menu ──────────────────────
   Clear glass by default, and not tied to the glass-settings panel (that
   styles glass mode's cards and previews on itself): the nav always looks
   the same. Playground clear-glass values with only a whisper of blur, the
   bevel kept to the rim so the labels sit on a calm centre, and no
   micro-noise (it would re-run on every scroll frame). */
export const NAV_GLASS: GlassSettings = {
  blurAmount: 0.06,
  refraction: 0.82,
  chromAberration: 0.155,
  edgeHighlight: 0.05,
  specular: 0.25,
  fresnel: 0.48,
  distortion: 0,
  cornerRadius: 27,
  zRadius: 18,
  opacity: 1,
  saturation: 0.44,
  brightness: 0.1,
  shadowOpacity: 0.21,
  shadowSpread: 12,
  bevelMode: 0,
};

const supported = () => document.documentElement.classList.contains("liquid-ok");

/** Nav bar / pill: liquid glass in every theme and mode (Chromium). */
export function initNavLens(): void {
  const html = document.documentElement;
  const nav = document.querySelector<HTMLElement>(".nav");
  const inner = nav?.querySelector<HTMLElement>(".nav-inner");
  if (!nav || !inner || !supported()) return;
  let started = false;
  const EVENTS = ["pointermove", "pointerdown", "wheel", "touchstart", "keydown", "scroll"] as const;
  const start = () => {
    if (started) return;
    started = true;
    for (const t of EVENTS) removeEventListener(t, start, true);
    const lens = createLens(inner, "nav-lens", NAV_GLASS, () => html.classList.add("lens-on"));
    // The bar ↔ pill morph (0.7s) keeps the resize observer pushing the
    // bake back until the new shape has settled.
    new MutationObserver(() => lens.schedule()).observe(nav, { attributes: true, attributeFilter: ["class"] });
    lens.schedule(0);
  };
  // The first bake waits for the visitor's first interaction (or a few
  // quiet seconds), so it never competes with the page loading; until then
  // the bar shows the CSS frosted glass.
  for (const t of EVENTS) addEventListener(t, start, { capture: true, passive: true, once: true });
  const ric = (window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number }).requestIdleCallback;
  setTimeout(() => (ric ? ric(start, { timeout: 2000 }) : start()), 6000);
}

/** The section menu (a popover): baked when it first opens. */
export function initMenuLens(panel: HTMLElement): Lens | null {
  if (!supported()) return null;
  // A list of links over busy content: heavily frosted, so only the rim
  // shows the refraction and the labels never compete with the page.
  return createLens(panel, "menu-lens", { ...NAV_GLASS, zRadius: 14, blurAmount: 0.9 }, () => panel.classList.add("lens-on"));
}
