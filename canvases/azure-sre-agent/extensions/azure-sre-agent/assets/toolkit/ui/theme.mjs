// packages/canvas-toolkit/src/ui/theme.mjs
var colorNames = ["bg", "fg", "muted", "border", "accent", "success", "attention", "danger"];
var attributes = ["data-theme-tone", "data-color-mode", "data-light-theme", "data-dark-theme", "data-theme-source", "data-visual-mode", "class", "style"];
function readCanvasTheme(document = globalThis.document) {
  const view = document?.defaultView;
  if (!document?.body || !view) throw new TypeError("A rendered document is required.");
  const container = document.createElement("span");
  container.hidden = true;
  const probes = colorNames.map((name) => {
    const probe = document.createElement("span");
    probe.className = `canvas-theme-probe-${name}`;
    container.append(probe);
    return probe;
  });
  document.body.append(container);
  try {
    const root = view.getComputedStyle(document.documentElement);
    const body = view.getComputedStyle(document.body);
    const mode = root.colorScheme;
    return {
      hasHostTokens: Boolean(root.getPropertyValue("--background-color-default").trim()),
      tone: mode === "light" || mode === "dark" ? mode : view.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light",
      colors: Object.fromEntries(probes.map((probe, index) => [colorNames[index], view.getComputedStyle(probe).color])),
      fontFamily: body.fontFamily,
      fontSize: body.fontSize,
      background: body.backgroundColor,
      foreground: body.color
    };
  } finally {
    container.remove();
  }
}
function observeCanvasTheme(onChange, { document = globalThis.document } = {}) {
  if (typeof onChange !== "function") throw new TypeError("onChange must be a function.");
  const view = document?.defaultView;
  if (!document?.body || !view) throw new TypeError("A rendered document is required.");
  let frame;
  let previous;
  let stopped = false;
  function sample() {
    frame = void 0;
    if (stopped) return;
    const theme = readCanvasTheme(document);
    const signature = JSON.stringify(theme);
    if (signature === previous) return;
    previous = signature;
    onChange(theme);
  }
  function schedule() {
    if (!stopped && frame === void 0) frame = view.requestAnimationFrame(sample);
  }
  const observer = new view.MutationObserver(schedule);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: attributes });
  observer.observe(document.body, { attributes: true, attributeFilter: attributes });
  observer.observe(document.head, { childList: true, subtree: true, characterData: true, attributes: true });
  const media = view.matchMedia("(prefers-color-scheme: dark)");
  media.addEventListener("change", schedule);
  view.addEventListener("load", schedule);
  document.addEventListener("load", schedule, true);
  function stop() {
    stopped = true;
    observer.disconnect();
    if (frame !== void 0) view.cancelAnimationFrame(frame);
    media.removeEventListener("change", schedule);
    view.removeEventListener("load", schedule);
    document.removeEventListener("load", schedule, true);
    view.removeEventListener("pagehide", stop);
  }
  view.addEventListener("pagehide", stop, { once: true });
  schedule();
  return stop;
}
export {
  observeCanvasTheme,
  readCanvasTheme
};
