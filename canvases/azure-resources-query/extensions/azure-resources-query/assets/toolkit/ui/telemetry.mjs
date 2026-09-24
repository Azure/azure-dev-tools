// packages/canvas-toolkit/src/ui/telemetry.mjs
function observeCanvasUsage({ root = document, enabled = false, controls = {}, send, onDiagnostic } = {}) {
  if (typeof enabled !== "boolean") throw new TypeError("enabled must be a boolean.");
  if (!enabled) return Object.freeze({ dispose() {
  } });
  if (typeof send !== "function") throw new TypeError("send must be a function.");
  if (onDiagnostic !== void 0 && typeof onDiagnostic !== "function") throw new TypeError("onDiagnostic must be a function.");
  const types = /* @__PURE__ */ new Set(["button", "link", "select", "input", "textarea", "details", "other"]);
  const registry = new Map(Object.entries(controls));
  for (const [id, type] of registry) {
    if (!/^[a-z][a-z0-9_.-]{0,79}$/.test(id) || ["__proto__", "constructor", "prototype"].includes(id) || !types.has(type)) {
      throw new TypeError("Controls must contain only static bounded IDs and supported types.");
    }
  }
  let disposed = false, reported = false;
  function failed() {
    if (reported) return;
    reported = true;
    if (onDiagnostic) {
      const reportFailure = () => console.warn("Canvas telemetry diagnostic callback failed.");
      try {
        Promise.resolve(onDiagnostic({ code: "interaction_delivery_failed" })).catch(reportFailure);
      } catch {
        reportFailure();
      }
    } else console.warn("Canvas telemetry interaction delivery failed.");
  }
  function listener(event) {
    if (disposed || !event.isTrusted) return;
    const target = event.target?.nodeType === 1 ? event.target : event.target?.parentElement;
    const interactive = target?.closest?.('button,a,select,input,textarea,summary,details,form,[role="button"]');
    const owner = interactive?.closest("[data-metric-id],[id]");
    const controlId = owner?.getAttribute("data-metric-id") || owner?.id;
    if (!registry.has(controlId) || root.contains && !root.contains(owner)) return;
    const tag = interactive.tagName.toLowerCase();
    const type = interactive.getAttribute("role") === "button" ? "button" : tag === "a" ? "link" : ["summary", "details"].includes(tag) ? "details" : ["button", "select", "input", "textarea"].includes(tag) ? tag : "other";
    if (registry.get(controlId) !== type) return;
    try {
      Promise.resolve(send({ interactionType: event.type, controlId, controlType: type })).catch(failed);
    } catch {
      failed();
    }
  }
  const events = ["click", "change", "submit"];
  for (const type of events) root.addEventListener(type, listener, true);
  return Object.freeze({
    dispose() {
      if (disposed) return;
      disposed = true;
      for (const type of events) root.removeEventListener(type, listener, true);
    }
  });
}
export {
  observeCanvasUsage
};
