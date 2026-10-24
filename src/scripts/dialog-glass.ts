/* ══════════════════════════════════════════════════════════
   DIALOG GLASS — apply liquid glass to case-study dialogs
   when glass mode is on. Each dialog gets its own LiquidGlass
   instance scoped to the .case-panel, destroyed on close.
   ══════════════════════════════════════════════════════════ */
import { LiquidGlass } from "../vendor/liquidglass/index.js";
import { getGlass, onGlass } from "./glass-config";

const html = document.documentElement;

function isGlassOn() {
  return html.dataset.glass === "on";
}

interface DialogGlassInstance {
  lg: InstanceType<typeof LiquidGlass>;
  plate: HTMLElement;
  offGlass: () => void;
}

const instances = new Map<HTMLDialogElement, DialogGlassInstance>();

async function attachGlass(dialog: HTMLDialogElement) {
  if (instances.has(dialog)) return;
  const panel = dialog.querySelector<HTMLElement>(".case-panel");
  if (!panel) return;

  // The plate sits behind the panel content, same size as the panel.
  const plate = document.createElement("div");
  plate.className = "lg-dialog-plate";
  plate.style.cssText = "position:absolute;inset:0;pointer-events:none;";

  // The library requires glass elements to be direct children of root.
  // We use the panel itself as root and the plate as the glass element.
  panel.style.position = "relative";
  panel.prepend(plate);

  const cfg = getGlass();
  plate.dataset.config = JSON.stringify({
    ...cfg,
    cornerRadius: Math.min(cfg.cornerRadius, 18),
    floating: false,
  });

  try {
    const lg = await LiquidGlass.init({
      root: panel,
      glassElements: [plate],
      defaults: {
        ...cfg,
        cornerRadius: Math.min(cfg.cornerRadius, 18),
      },
    });

    const offGlass = onGlass((s) => {
      plate.dataset.config = JSON.stringify({
        ...s,
        cornerRadius: Math.min(s.cornerRadius, 18),
        floating: false,
      });
    });

    instances.set(dialog, { lg, plate, offGlass });
  } catch (err) {
    console.warn("[dialog-glass] WebGL unavailable for dialog", err);
    plate.remove();
  }
}

function detachGlass(dialog: HTMLDialogElement) {
  const inst = instances.get(dialog);
  if (!inst) return;
  inst.offGlass();
  inst.lg.destroy();
  inst.plate.remove();
  instances.delete(dialog);
}

export function initDialogGlass() {
  document.querySelectorAll<HTMLDialogElement>("dialog.case").forEach((dialog) => {
    dialog.addEventListener("toggle", () => {
      if (dialog.open && isGlassOn()) {
        void attachGlass(dialog);
      } else {
        detachGlass(dialog);
      }
    });
  });

  // When glass mode is toggled while a dialog is open, sync it.
  const observer = new MutationObserver(() => {
    document.querySelectorAll<HTMLDialogElement>("dialog.case[open]").forEach((dialog) => {
      if (isGlassOn()) {
        void attachGlass(dialog);
      } else {
        detachGlass(dialog);
      }
    });
  });
  observer.observe(html, { attributes: true, attributeFilter: ["data-glass"] });
}
