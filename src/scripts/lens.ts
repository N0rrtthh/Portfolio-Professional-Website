/* ══════════════════════════════════════════════════════════
   NAV LENS — live liquid glass on the nav pill
   ──────────────────────────────────────────────────────────
   The WebGL library can only refract canvases it owns, not the live page,
   so the nav runs the same glass maths through the browser compositor
   instead: an SVG filter applied as `backdrop-filter: url(#nav-lens)`,
   which bends whatever is scrolling underneath.

   Every per-pixel term of the library's fragment shader (FS_GLASS) —
   bevel refraction, chromatic split, specular lights, fresnel, rim and
   inner glow — depends only on the panel's shape and settings, so it is
   baked once into small images that the filter reads:
     · three displacement maps (red / green / blue sample offsets)
     · one light map (multiply + add terms of the shader's composite)
   The blur, micro-distortion, brightness, saturation and opacity steps
   are native filter primitives with the shader's constants.

   Maps are rebuilt when the pill settles at a new size or a setting
   changes. Chromium only (html.liquid-ok); other browsers keep the CSS
   frosted glass.
   ══════════════════════════════════════════════════════════ */
import { getGlass, onGlass, type GlassSettings } from "./glass-config";

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
      const f = refrPow * (2 + ((hC * 2) / Math.max(zR * 2, 1)) * 0.5) * s.refraction * 30;
      rx = gx * f - (px / Math.max(hx, 1)) * s.refraction * 4 * depth;
      ry = gy * f - (py / Math.max(hy, 1)) * s.refraction * 4 * depth;
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
    // B: where the micro-distortion may act (not within ~3px of the edge,
    // where its jitter would reach outside the backdrop).
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
    const slope = s.bevelMode < 0.5 ? (-s.refraction * 4 * depth) / Math.max(hx, 1) : -s.refraction * depth * 0.35;
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
  for (let p = 0; p < n; p++) {
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
  const [mr, mg, mb, ml] = await Promise.all([encode(maps[0]), encode(maps[1]), encode(maps[2]), encode(light)]);
  return { r: mr, g: mg, b: mb, light: ml, scale };
}

export function initNavLens(): void {
  const html = document.documentElement;
  const nav = document.querySelector<HTMLElement>(".nav");
  const inner = nav?.querySelector<HTMLElement>(".nav-inner");
  if (!nav || !inner || !html.classList.contains("liquid-ok")) return;

  /* ── Filter graph (built once; attributes change later) ────── */
  const svg = svgEl("svg", { width: "0", height: "0", "aria-hidden": "true", focusable: "false" });
  svg.style.cssText = "position:absolute;width:0;height:0;overflow:hidden";
  const filter = svgEl("filter", { id: "nav-lens", x: "0", y: "0", filterUnits: "userSpaceOnUse", "color-interpolation-filters": "sRGB" });
  const img = (result: string) => svgEl("feImage", { x: "0", y: "0", preserveAspectRatio: "none", result });
  const mapR = img("mr");
  const mapG = img("mg");
  const mapB = img("mb");
  const mapL = img("ml");
  // Background blur: the library's 6 × separable 9-tap Gaussian passes.
  const blur = svgEl("feGaussianBlur", { in: "SourceGraphic", result: "blurA" });
  // Un-premultiply to opaque: the blur's edge pixels keep their true colour
  // instead of fading into the empty space outside the backdrop.
  const opaque = svgEl("feColorMatrix", { in: "blurA", type: "matrix", values: "1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0 1", result: "blur" });
  // Micro-distortion: per-pixel jitter of the sample point.
  const noise = svgEl("feTurbulence", { type: "fractalNoise", baseFrequency: "0.85", numOctaves: "1", seed: "7", result: "noiseT" });
  // Turbulence fills alpha with noise too; make it opaque before using it.
  const noiseO = svgEl("feColorMatrix", { in: "noiseT", type: "matrix", values: "1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0 1", result: "noiseA" });
  // noise → 0.5 + (noise − 0.5) × mask (light map B), so the rim stays clean.
  const maskL = svgEl("feColorMatrix", { in: "ml", type: "matrix", values: "0 0 1 0 0  0 0 1 0 0  0 0 1 0 0  0 0 0 0 1", result: "jmask" });
  const noiseM = svgEl("feComposite", { in: "noiseA", in2: "jmask", operator: "arithmetic", k1: "1", k2: "0", k3: "-0.5", k4: "0.5", result: "noise" });
  const jitter = svgEl("feDisplacementMap", { in: "blur", in2: "noise", xChannelSelector: "R", yChannelSelector: "G", result: "src" });
  const disp = (map: string, out: string, matrix: string) => {
    const d = svgEl("feDisplacementMap", { in: "src", in2: map, xChannelSelector: "R", yChannelSelector: "G", result: `${out}d` });
    const only = svgEl("feColorMatrix", { in: `${out}d`, type: "matrix", values: matrix, result: out });
    return [d, only] as const;
  };
  const [dR, oR] = disp("mr", "cr", "1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0");
  const [dG, oG] = disp("mg", "cg", "0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0");
  const [dB, oB] = disp("mb", "cb", "0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0");
  // Brightness × saturation (shader luma weights), one matrix.
  const grade = svgEl("feColorMatrix", { in: "rgb", type: "matrix", result: "graded" });
  // Light map → grey multiply (G) and add (R) layers.
  const mulL = svgEl("feColorMatrix", { in: "ml", type: "matrix", values: "0 1 0 0 0  0 1 0 0 0  0 1 0 0 0  0 0 0 0 1", result: "lmul" });
  const addL = svgEl("feColorMatrix", { in: "ml", type: "matrix", values: "1 0 0 0 0  1 0 0 0 0  1 0 0 0 0  0 0 0 0 1", result: "ladd" });
  const opacity = svgEl("feComposite", { in: "lit", in2: "SourceGraphic", operator: "arithmetic", k1: "0", k4: "0" });
  filter.append(
    mapR, mapG, mapB, mapL,
    blur, opaque, noise, noiseO, maskL, noiseM, jitter,
    dR, oR, dG, oG, dB, oB,
    svgEl("feBlend", { in: "cr", in2: "cg", mode: "screen", result: "rg" }),
    svgEl("feBlend", { in: "rg", in2: "cb", mode: "screen", result: "rgb" }),
    grade, mulL, addL,
    svgEl("feComposite", { in: "graded", in2: "lmul", operator: "arithmetic", k1: "1.1", k2: "0", k3: "0", k4: "0", result: "mul" }),
    svgEl("feComposite", { in: "mul", in2: "ladd", operator: "arithmetic", k1: "0", k2: "1", k3: "1", k4: "0", result: "lit" }),
    opacity,
    svgEl("feColorMatrix", { type: "matrix", values: "1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0 1" }),
  );
  svg.append(filter);
  document.body.append(svg);

  /* ── Settings that need no re-bake ──────────────────────────── */
  const dpr = () => Math.min(window.devicePixelRatio || 1, 3);
  const applyCheap = (s: GlassSettings) => {
    const k = dpr();
    blur.setAttribute("stdDeviation", ((s.blurAmount * 10.35) / k).toFixed(2));
    // hash() noise is uniform ±2·distortion device px; turbulence σ ≈ 0.12.
    jitter.setAttribute("scale", ((s.distortion * 9.6) / k).toFixed(2));
    const b = 1 + s.brightness;
    const t = 1 + s.saturation;
    const lr = 0.299 * (1 - t);
    const lg = 0.587 * (1 - t);
    const lb = 0.114 * (1 - t);
    const m = [
      [lr + t, lg, lb],
      [lr, lg + t, lb],
      [lr, lg, lb + t],
    ]
      .map((row) => `${row.map((v) => (v * b).toFixed(4)).join(" ")} 0 0`)
      .join("  ");
    grade.setAttribute("values", `${m}  0 0 0 1 0`);
    opacity.setAttribute("k2", String(s.opacity));
    opacity.setAttribute("k3", String(1 - s.opacity));
    // Shader shadow: Gaussian falloff (σ = spread/√2) ×0.65 + contact ×0.35.
    const a = s.shadowOpacity;
    const sp = Math.max(s.shadowSpread, 1);
    html.style.setProperty(
      "--lens-shadow",
      a > 0 ? `0 1px ${(sp * 1.414).toFixed(1)}px rgb(0 0 0 / ${(0.65 * a).toFixed(3)}), 0 1px ${(sp * 0.5).toFixed(1)}px rgb(0 0 0 / ${(0.35 * a).toFixed(3)})` : "none",
    );
  };

  /* ── Bake on settle ──────────────────────────────────────────
     While the bar → pill morph runs, the old maps are stretched to the
     current box; the bake runs once the size has held still. */
  let baked = "";
  let timer = 0;
  const size = () => ({ W: inner.offsetWidth, H: inner.offsetHeight });
  const stretch = () => {
    const { W, H } = size();
    for (const e of [filter, mapR, mapG, mapB, mapL]) {
      e.setAttribute("width", String(W));
      e.setAttribute("height", String(H));
    }
  };
  let run = 0;
  let urls: string[] = [];
  const rebake = async () => {
    if (!nav.classList.contains("is-scrolled")) return;
    const { W, H } = size();
    if (W < 40 || H < 20) return;
    const s = getGlass();
    const key = `${W}x${H}@${dpr()}|${s.cornerRadius},${s.zRadius},${s.refraction},${s.chromAberration},${s.edgeHighlight},${s.specular},${s.fresnel},${s.bevelMode}`;
    if (key === baked) return;
    baked = key;
    const mine = ++run;
    const m = await bake(W, H, s, dpr());
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
    html.classList.add("lens-on");
  };
  const schedule = (delay: number) => {
    stretch();
    clearTimeout(timer);
    timer = window.setTimeout(() => void rebake(), delay);
  };

  applyCheap(getGlass());
  onGlass((s) => {
    applyCheap(s);
    schedule(30);
  });
  new ResizeObserver(() => schedule(160)).observe(inner);
  // On the first scroll the bar morphs into the pill (0.7s); the resize
  // observer keeps pushing the bake back until the pill has settled.
  new MutationObserver(() => schedule(160)).observe(nav, { attributes: true, attributeFilter: ["class"] });
  schedule(0);
}
