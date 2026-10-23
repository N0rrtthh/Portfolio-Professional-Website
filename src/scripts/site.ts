/* ══════════════════════════════════════════════════════════
   The only client JavaScript on the site (~2 KB). Every feature here
   is an enhancement — the page works without it:
     · loader: random quip + click/key to skip (the CSS timeline
       dismisses it anyway)
     · theme toggle with a circular reveal from the button
     · project case studies (<dialog>) — fallback for browsers without
       the `commandfor` invoker attribute
     · copy-email button
     · nav: hairline once scrolled, live liquid-glass lens on the pill
   ══════════════════════════════════════════════════════════ */
import { initNavLens } from "./lens";

(window as Window & { __eqReady?: boolean }).__eqReady = true;
const rootEl = document.documentElement;

/* Hero entrance plays as the loader lifts (or at once without a loader). */
const heroIn = () => rootEl.classList.add("hero-in");

/* ── Loader ───────────────────────────────────────────────── */
const QUIPS = [
  "feeding the rubber duck",
  "centering a div (first try)",
  "removing stray console.logs",
  "asking the CSS nicely",
  "resolving merge conflicts with myself",
  "warming up the coffee",
  "convincing Flutter to hot-reload",
  "untangling node_modules",
];
const loader = document.getElementById("loader");
if (loader) {
  const quip = document.getElementById("ld-quip");
  if (quip) quip.textContent = QUIPS[Math.floor(Math.random() * QUIPS.length)];
  const skip = () => {
    loader.classList.add("is-skipped");
    heroIn();
  };
  window.addEventListener("keydown", skip, { once: true });
  loader.addEventListener("pointerdown", skip, { once: true });
  loader.addEventListener("animationstart", (e) => {
    if (e.target === loader && e.animationName === "ld-exit") setTimeout(heroIn, 120);
  });
  loader.addEventListener("animationend", (e) => {
    if (e.target === loader && e.animationName === "ld-exit") loader.remove();
  });
  setTimeout(heroIn, 1300); // belt and braces if animation events are missed
} else {
  requestAnimationFrame(heroIn);
}

/* ── Section reveals ──────────────────────────────────────── */
/* Each .reveal / .reveal-title / .reveal-head gets .is-in once ~15% of
   it is on screen, and is then left alone (no replay on scroll-back). */
if ((rootEl.classList.contains("motion-ok") || rootEl.classList.contains("motion-soft")) && "IntersectionObserver" in window) {
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add("is-in");
        // Titles start fully clipped (zero visible area), so they can't be
        // observed themselves — they reveal with their container.
        entry.target.querySelectorAll(".reveal-title").forEach((t) => t.classList.add("is-in"));
        io.unobserve(entry.target);
      }
    },
    { rootMargin: "0px 0px -12% 0px", threshold: 0.12 }
  );
  document.querySelectorAll(".reveal, .reveal-head").forEach((el) => io.observe(el));
} else {
  document.querySelectorAll(".reveal, .reveal-title, .reveal-head").forEach((el) => el.classList.add("is-in"));
}

/* ── Theme ────────────────────────────────────────────────── */
const root = document.documentElement;
const metaThemes = document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]');

function applyTheme(next: "light" | "dark") {
  root.dataset.theme = next;
  try {
    localStorage.setItem("eq-theme", next);
  } catch {
    /* private mode — the choice just isn't remembered */
  }
  metaThemes.forEach((m) => (m.content = next === "dark" ? "#0d0e10" : "#f7f6f2"));
  document.querySelectorAll<HTMLButtonElement>("[data-theme-toggle]").forEach((b) => {
    b.setAttribute("aria-label", next === "dark" ? "Switch to light theme" : "Switch to dark theme");
    b.setAttribute("aria-pressed", String(next === "dark"));
  });
}
applyTheme((root.dataset.theme as "light" | "dark") || "light");

/** Swap a look (theme / glass) with a circular reveal from the button. */
function revealFrom(btn: HTMLElement, change: () => void) {
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const doc = document as Document & { startViewTransition?: (cb: () => void) => unknown };
  if (!doc.startViewTransition || reduced) return change();
  // Reveal the new look from the button itself, out to the far corner.
  const r = btn.getBoundingClientRect();
  const x = r.left + r.width / 2;
  const y = r.top + r.height / 2;
  const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
  root.style.setProperty("--vt-x", `${x}px`);
  root.style.setProperty("--vt-y", `${y}px`);
  root.style.setProperty("--vt-r", `${Math.ceil(radius)}px`);
  doc.startViewTransition(change);
}

document.querySelectorAll<HTMLButtonElement>("[data-theme-toggle]").forEach((btn) => {
  btn.addEventListener("click", () => revealFrom(btn, () => applyTheme(root.dataset.theme === "dark" ? "light" : "dark")));
});

/* ── Liquid glass ─────────────────────────────────────────── */
/* Glass mode's refracting cards (WebGL) are fetched only while glass mode
   is on. The nav's live lens (lens.ts) runs in every mode. */
let stopLiquid: (() => void) | null = null;
let liquidOn = false;
let liquidBusy = false;
let liquidAllowed = false;
async function syncLiquid(on: boolean) {
  if (!liquidAllowed || liquidBusy || liquidOn === on) return;
  liquidBusy = true;
  try {
    stopLiquid?.();
    stopLiquid = null;
    liquidOn = false;
    if (on) {
      const { startLiquid } = await import("./liquid");
      stopLiquid = await startLiquid();
      liquidOn = true;
    }
  } catch (err) {
    console.warn("[glass] could not load WebGL glass", err);
  } finally {
    liquidBusy = false;
  }
  // The toggle may have flipped while we were loading.
  const now = root.dataset.glass === "on";
  if (now !== liquidOn) void syncLiquid(now);
}

function applyGlass(on: boolean) {
  if (on) root.dataset.glass = "on";
  else delete root.dataset.glass;
  void syncLiquid(on);
  try {
    localStorage.setItem("eq-glass", on ? "on" : "off");
  } catch {
    /* not remembered in private mode */
  }
  document.querySelectorAll<HTMLButtonElement>("[data-glass-toggle]").forEach((b) => {
    b.setAttribute("aria-pressed", String(on));
    b.setAttribute("aria-label", on ? "Turn off liquid glass style" : "Turn on liquid glass style");
  });
}
applyGlass(root.dataset.glass === "on");

/* WebGL shaders compile in one long task, so glass mode (when it was left
   on) starts only once the intro has settled and the page is idle. */
{
  const go = () => {
    liquidAllowed = true;
    void syncLiquid(root.dataset.glass === "on");
  };
  const ric = (window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number }).requestIdleCallback;
  setTimeout(() => (ric ? ric(go, { timeout: 2500 }) : go()), 1600);
}

initNavLens();

document.querySelectorAll<HTMLButtonElement>("[data-glass-toggle]").forEach((btn) => {
  btn.addEventListener("click", () => revealFrom(btn, () => applyGlass(root.dataset.glass !== "on")));
});

/* ── Case-study dialogs ───────────────────────────────────── */
const supportsInvokers = "commandForElement" in HTMLButtonElement.prototype;
document.querySelectorAll<HTMLButtonElement>("button[commandfor]").forEach((btn) => {
  const dialog = document.getElementById(btn.getAttribute("commandfor") || "") as HTMLDialogElement | null;
  if (!dialog) return;
  if (!supportsInvokers) {
    btn.addEventListener("click", () => {
      if (btn.getAttribute("command") === "close") dialog.close();
      else dialog.showModal();
    });
  }
});
document.querySelectorAll<HTMLDialogElement>("dialog.case").forEach((dialog) => {
  // Backdrop click closes (clicks inside the panel land on its children).
  dialog.addEventListener("click", (e) => {
    if (e.target === dialog) dialog.close();
  });
  // Keep the page behind still while a case study is open.
  dialog.addEventListener("toggle", () => {
    document.body.style.overflow = dialog.open ? "hidden" : "";
  });
  dialog.addEventListener("close", () => {
    document.body.style.overflow = "";
  });
});

/* ── Copy email ───────────────────────────────────────────── */
document.querySelectorAll<HTMLButtonElement>("[data-copy]").forEach((btn) => {
  btn.addEventListener("click", async () => {
    const value = btn.dataset.copy || "";
    const status = btn.querySelector("[data-copy-label]");
    try {
      await navigator.clipboard.writeText(value);
      btn.dataset.state = "copied";
      if (status) status.textContent = "Copied";
    } catch {
      btn.dataset.state = "error";
      if (status) status.textContent = "Press Ctrl+C";
      const sel = getSelection();
      const target = document.querySelector("[data-copy-target]");
      if (sel && target) {
        const range = document.createRange();
        range.selectNodeContents(target);
        sel.removeAllRanges();
        sel.addRange(range);
      }
    }
    setTimeout(() => {
      delete btn.dataset.state;
      if (status) status.textContent = "Copy";
    }, 1800);
  });
});

/* ── Nav hairline once scrolled ───────────────────────────── */
const nav = document.querySelector<HTMLElement>(".nav");
if (nav) {
  const sentinel = document.getElementById("top");
  if (sentinel && "IntersectionObserver" in window) {
    new IntersectionObserver(([entry]) => nav.classList.toggle("is-scrolled", !entry.isIntersecting)).observe(sentinel);
  }
}

/* ── Mobile menu: close after picking a section ───────────── */
document.querySelectorAll<HTMLAnchorElement>("[data-menu-link]").forEach((a) => {
  a.addEventListener("click", () => a.closest("details")?.removeAttribute("open"));
});
document.addEventListener("click", (e) => {
  const menu = document.querySelector<HTMLDetailsElement>("details.menu[open]");
  if (menu && !menu.contains(e.target as Node)) menu.removeAttribute("open");
});

/* ── Project cards: cursor tilt + glare ───────────────────── */
/* Fine pointers only, and only when motion is welcome. Targets are set on
   pointermove; one rAF loop eases toward them (exponential smoothing, so
   it glides instead of snapping) and parks itself once the card is flat.
   Each element gets its own style write — no parent CSS variables driving
   child transforms. */
if (matchMedia("(hover: hover) and (pointer: fine)").matches && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
  rootEl.classList.add("tilt-on");
  const MAX = 5; // degrees
  document.querySelectorAll<HTMLElement>("[data-tilt]").forEach((card) => {
    const glare = card.querySelector<HTMLElement>(".proj-glare");
    const img = card.querySelector<HTMLElement>(".media img");
    const s = { tx: 0, ty: 0, x: 0, y: 0, tl: 0, l: 0, raf: 0, last: 0 };

    const frame = (now: number) => {
      const dt = s.last ? Math.min((now - s.last) / 1000, 1 / 30) : 1 / 60;
      s.last = now;
      const k = 1 - Math.exp(-dt / 0.12);
      s.x += (s.tx - s.x) * k;
      s.y += (s.ty - s.y) * k;
      s.l += (s.tl - s.l) * k;
      // Over WebGL glass the plate is pinned to the card's layout box, so
      // the card itself stays put; the glare and image zoom still respond.
      card.style.transform = rootEl.classList.contains("lg-live")
        ? ""
        : `rotateX(${s.y.toFixed(3)}deg) rotateY(${s.x.toFixed(3)}deg) translateY(${s.l.toFixed(2)}px)`;
      if (img) {
        img.style.setProperty("--px", `${(-s.x * 1.6).toFixed(2)}px`);
        img.style.setProperty("--py", `${(s.y * 1.6).toFixed(2)}px`);
      }
      const settled = Math.abs(s.tx - s.x) < 0.01 && Math.abs(s.ty - s.y) < 0.01 && Math.abs(s.tl - s.l) < 0.02;
      if (settled && s.tx === 0 && s.ty === 0 && s.tl === 0) {
        card.style.transform = "";
        s.raf = 0;
        s.last = 0;
        return;
      }
      s.raf = requestAnimationFrame(frame);
    };
    const kick = () => {
      if (!s.raf) s.raf = requestAnimationFrame(frame);
    };

    card.addEventListener("pointermove", (e) => {
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      s.tx = (px - 0.5) * 2 * MAX;
      s.ty = -(py - 0.5) * 2 * MAX;
      s.tl = -6;
      if (glare) {
        glare.style.setProperty("--gx", `${(px * 100).toFixed(1)}%`);
        glare.style.setProperty("--gy", `${(py * 100).toFixed(1)}%`);
      }
      kick();
    });
    card.addEventListener("pointerleave", () => {
      s.tx = 0;
      s.ty = 0;
      s.tl = 0;
      kick();
    });
  });
}
